const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { addressFields } = require('../../frontend/static/js/geocoding.js');
const source = fs.readFileSync(require.resolve('../../frontend/static/js/enquiry.js'), 'utf8');

function node() {
  return {
    value: '', textContent: '', disabled: false, hidden: false, children: [], events: {},
    addEventListener(event, listener) { this.events[event] = listener; },
    focus() {},
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
  };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(client) {
  const selectors = ['[name=site_lat]', '[name=site_lng]', '[data-location-status]', '[data-locate]',
    '[data-map-center]', '[data-place-search]', '[data-place-search-button]', '[data-search-status]',
    '[data-place-results]', '[name=address]', '[name=city]', '[name=pincode]', '[data-enquiry-submit]', '[data-clear-location]',
    '[data-location-summary]', '[data-address-preview]', '[data-city-preview]', '[data-pincode-preview]', '[data-coordinates-preview]'];
  const nodes = Object.fromEntries(selectors.map(selector => [selector, node()]));
  const form = Object.assign(node(), { querySelector: selector => nodes[selector] });
  const picker = { querySelector: selector => nodes[selector], getAttribute: () => 'https://example.test',
    closest: () => form };
  const timers = new Map();
  let nextTimer = 0;
  vm.runInNewContext(source, {
    document: { querySelector: selector => selector === '[data-location-picker]' ? picker : nodes[selector], createElement: node },
    window: { fetch() {} },
    navigator: { geolocation: { getCurrentPosition: success => success({ coords: { latitude: 12, longitude: 77 } }) } },
    SunThreadGeocoding: { addressFields, createClient: () => client }, AbortController,
    setTimeout: fn => { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout: id => timers.delete(id),
  });
  return {
    nodes,
    form,
    click(selector) { nodes[selector].events.click(); },
    runTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
const result = (city = 'Bengaluru', pin = '560001') => ({
  geometry: { type: 'Point', coordinates: [77, 12] },
  properties: { housenumber: '12', street: 'Lake Road', city, postcode: pin, country: 'India' },
});

test('current-location lookup fills address, city and pincode', async () => {
  const f = fixture({ reverse: async () => [result()] });
  f.click('[data-locate]');
  assert.equal(f.nodes['[data-enquiry-submit]'].disabled, true);
  f.runTimers();
  await settle();
  assert.equal(f.nodes['[name=address]'].value, '12 Lake Road, Bengaluru, 560001, India');
  assert.equal(f.nodes['[name=city]'].value, 'Bengaluru');
  assert.equal(f.nodes['[name=pincode]'].value, '560001');
  assert.equal(f.nodes['[data-enquiry-submit]'].disabled, false);
});

test('search on Enter does not submit the enquiry and choosing a result fills its address', async () => {
  const f = fixture({ search: async () => [result()], reverse: () => assert.fail('complete result needs no reverse lookup') });
  f.nodes['[data-place-search]'].value = 'Lake Road';
  let prevented = false;
  f.nodes['[data-place-search]'].events.keydown({ key: 'Enter', preventDefault: () => { prevented = true; } });
  await settle();
  assert.equal(prevented, true);
  f.nodes['[data-place-results]'].children[0].children[0].events.click();
  assert.equal(f.nodes['[name=pincode]'].value, '560001');
  assert.equal(f.nodes['[name=site_lat]'].value, '12.000000');
  assert.equal(f.nodes['[name=site_lng]'].value, '77.000000');
});

test('clearing the location removes address details and ignores stale lookup replies', async () => {
  const first = deferred(), second = deferred();
  let calls = 0;
  const f = fixture({ reverse: () => (++calls === 1 ? first.promise : second.promise) });
  f.click('[data-locate]'); f.runTimers();
  first.resolve([result()]); await settle();
  assert.equal(f.nodes['[name=address]'].value, '12 Lake Road, Bengaluru, 560001, India');
  assert.equal(f.nodes['[name=city]'].value, 'Bengaluru');
  f.click('[data-locate]'); f.runTimers();
  f.click('[data-clear-location]');
  second.resolve([result('Other City', '999999')]); await settle();
  assert.equal(f.nodes['[name=city]'].value, '');
  assert.equal(f.nodes['[name=site_lat]'].value, '');
  assert.equal(f.nodes['[data-location-summary]'].hidden, true);
  assert.equal(f.nodes['[data-enquiry-submit]'].disabled, false);
});

test('a map pin can be used when no postcode data is available', async () => {
  const f = fixture({ reverse: async () => [result('Other City', '')] });
  f.nodes['[name=pincode]'].value = '560001';
  f.click('[data-locate]'); f.runTimers(); await settle();
  assert.equal(f.nodes['[name=pincode]'].value, '');
  assert.equal(f.nodes['[data-pincode-preview]'].textContent, 'Not available');
  assert.match(f.nodes['[data-location-status]'].textContent, /map pin will be used/);
  assert.equal(f.nodes['[data-enquiry-submit]'].disabled, false);
});

test('lookup failure uses the selected map pin without stale address details', async () => {
  const f = fixture({ reverse: async () => { throw new Error('Service unavailable'); } });
  f.nodes['[name=address]'].value = 'Previous location';
  f.click('[data-locate]'); f.runTimers(); await settle();
  assert.equal(f.nodes['[name=address]'].value, 'Map location: 12.000000, 77.000000');
  assert.equal(f.nodes['[data-enquiry-submit]'].disabled, false);
  assert.match(f.nodes['[data-location-status]'].textContent, /map pin will be used/);
});

test('submitting without a map location is blocked', () => {
  const f = fixture({});
  let prevented = false;
  f.form.events.submit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.match(f.nodes['[data-location-status]'].textContent, /Choose your installation location/);
});
