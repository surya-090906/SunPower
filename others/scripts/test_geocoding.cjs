const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addressFields, createClient } = require('../../frontend/static/js/geocoding.js');

const place = (properties, coordinates = [77.5946, 12.9716]) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates }, properties,
});

test('formats Indian addresses and falls back to towns and villages for city', () => {
  assert.deepEqual(addressFields(place({
    name: 'Solar House', housenumber: '12', street: 'Lake Road', town: 'Whitefield',
    postcode: '560066', state: 'Karnataka', country: 'India',
  })), {
    address: 'Solar House, 12 Lake Road, Whitefield, Karnataka, 560066, India',
    city: 'Whitefield', pincode: '560066',
  });
  assert.equal(addressFields(place({ village: 'Village', postcode: '560001' })).city, 'Village');
});

test('does not invent a pincode or mistake a district for the city', () => {
  assert.deepEqual(addressFields(place({ name: 'Road', street: 'Road', county: 'District', postcode: '12345' })), {
    address: 'Road', city: '', pincode: '',
  });
});

test('recognizes city-level search results without a city property', () => {
  assert.equal(addressFields(place({ name: 'Bengaluru', osm_key: 'place', osm_value: 'city' })).city, 'Bengaluru');
});

test('search safely encodes the query and caches repeated lookups', async () => {
  let requests = [];
  const feature = place({ city: 'Bengaluru', postcode: '560001' });
  const client = createClient('https://example.test/', async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ features: [feature] }) };
  });
  const signal = new AbortController().signal;
  assert.deepEqual(await client.search('Lake Road & Park', signal), [feature]);
  await client.search('Lake Road & Park', signal);
  assert.equal(requests.length, 1);
  const url = new URL(requests[0].url);
  assert.equal(url.searchParams.get('q'), 'Lake Road & Park');
  assert.equal(url.searchParams.has('countrycode'), false);
  assert.equal(requests[0].options.credentials, 'omit');
});

test('reverse lookup sends latitude and longitude in the correct order', async () => {
  let requested;
  const client = createClient('https://example.test', async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ features: [] }) };
  });
  await client.reverse(12.9716123, 77.5946123, new AbortController().signal);
  assert.equal(requested.pathname, '/reverse');
  assert.equal(requested.searchParams.get('lat'), '12.971612');
  assert.equal(requested.searchParams.get('lon'), '77.594612');
});

test('malformed provider features cannot break the map', async () => {
  const feature = place({ city: 'Bengaluru' });
  const client = createClient('https://example.test', async () => ({
    ok: true, json: async () => ({ features: [null, {}, place({}, [999, 0]), feature] }),
  }));
  assert.deepEqual(await client.search('Bengaluru', new AbortController().signal), [feature]);
});

test('provider failures give a recoverable map-location message', async () => {
  const client = createClient('https://example.test', async () => ({ ok: false }));
  await assert.rejects(client.search('Bengaluru', new AbortController().signal), /choose another map location/);
});

test('cancelled requests do not contact the provider', async () => {
  const controller = new AbortController();
  controller.abort();
  const client = createClient('https://example.test', () => assert.fail('fetch must not be called'));
  await assert.rejects(client.search('Bengaluru', controller.signal), { name: 'AbortError' });
});
