import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
const harness=vi.hoisted(()=>({handlers:{},map:null}));
vi.mock('leaflet',()=>({default:{
  divIcon:vi.fn(),
  map:()=>{const map={setView:vi.fn(()=>map),on:(event,fn)=>{harness.handlers[event]=fn;return map;},remove:vi.fn(),invalidateSize:vi.fn(),getCenter:()=>({lat:12.9,lng:77.6})};harness.map=map;return map;},
  tileLayer:()=>({addTo:()=>({on:vi.fn()})}),
  marker:()=>{const m={addTo:()=>m,on:()=>m,setLatLng:vi.fn(),remove:vi.fn()};return m;},
}}));
import LocationPicker, {validPoint} from './LocationPicker';
const place={geometry:{type:'Point',coordinates:[76.655,12.305]},properties:{name:'Mysuru',city:'Mysuru',state:'Karnataka',postcode:'570001',country:'India'}};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

beforeEach(()=>{harness.handlers={};});
describe('React location picker',()=>{
  test('search on Enter stays inside the enquiry and selects address data',async()=>{
    const user=userEvent.setup(),change=vi.fn(),submit=vi.fn(e=>e.preventDefault());
    const client={search:vi.fn().mockResolvedValue([place]),reverse:vi.fn()};
    const {container}=render(<form onSubmit={submit}><LocationPicker initial={null} onChange={change} geocoderUrl="https://example.test" client={client}/></form>);
    await user.type(screen.getByLabelText('Search place, area or pincode'),'Mysuru{enter}');
    await user.click(await screen.findByRole('button',{name:/Mysuru, Karnataka/}));
    expect(submit).not.toHaveBeenCalled();
    expect(client.reverse).not.toHaveBeenCalled();
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({city:'Mysuru',pincode:'570001',lat:'12.305000',lng:'76.655000'}));
    expect(container.querySelector('[name=pincode]')).toHaveValue('570001');
  });
  test('clearing a pin ignores a late address lookup response',async()=>{
    const user=userEvent.setup(),pending=deferred(),change=vi.fn();
    const {container}=render(<LocationPicker initial={null} onChange={change} client={{search:vi.fn(),reverse:()=>pending.promise}}/>);
    await user.click(screen.getByRole('button',{name:'Use map center'}));
    await user.click(screen.getByRole('button',{name:'Clear pin'}));
    pending.resolve([place]);
    await waitFor(()=>expect(change).toHaveBeenLastCalledWith(null));
    expect(container.querySelector('[name=site_lat]')).toHaveValue('');
    expect(screen.queryByText('Selected installation site')).not.toBeInTheDocument();
  });
  test('a lookup failure keeps usable coordinates and does not invent a postcode',async()=>{
    const change=vi.fn();
    const {container}=render(<LocationPicker initial={null} onChange={change} client={{search:vi.fn(),reverse:vi.fn().mockRejectedValue(Error('offline'))}}/>);
    fireEvent.click(screen.getByRole('button',{name:'Use map center'}));
    await screen.findByText(/Address lookup is unavailable/);
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({lat:'12.900000',lng:'77.600000',pincode:'',address:'Map location: 12.900000, 77.600000'}));
    expect(container.querySelector('[name=site_lng]')).toHaveValue('77.600000');
  });
  test('zero coordinates are valid while empty, nonfinite and out-of-range points are rejected',()=>{
    expect(validPoint({lat:'0',lng:'0'})).toBe(true);
    for(const point of [{lat:'',lng:'0'},{lat:'NaN',lng:'1'},{lat:91,lng:0},{lat:0,lng:181}])expect(validPoint(point)).toBe(false);
  });
});
