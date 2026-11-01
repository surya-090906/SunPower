import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
vi.mock('../components/LocationPicker',()=>({default:({error})=><div>{error&&<span role="alert">{error}</span>}<input id="location-search" aria-label="Location test input"/></div>}));
import Enquiry from './Enquiry';
const state={csrf:'test-csrf',messages:[],form:{site_lat:'',site_lng:'',package:'ongrid'},user:null,customer:null};
test.each(['','commercial','industry'])('subsidy is absent for property type "%s"',segment=>{
 const {container}=render(<Enquiry state={{...state,form:{segment,subsidy:'1'}}}/>);
 expect(screen.queryByRole('checkbox',{name:/rooftop solar subsidy/})).not.toBeInTheDocument();
 expect(new FormData(container.querySelector('form')).has('subsidy')).toBe(false);
});
test('changing away from Home clears the subsidy selection',async()=>{
 const user=userEvent.setup();
 const {container}=render(<Enquiry state={{...state,form:{segment:'home',subsidy:'1'}}}/>);
 expect(screen.getByRole('checkbox',{name:/rooftop solar subsidy/})).toBeChecked();
 await user.click(screen.getByRole('combobox',{name:/Property type/}));
 await user.click(screen.getByRole('option',{name:'Commercial'}));
 expect(screen.queryByRole('checkbox',{name:/rooftop solar subsidy/})).not.toBeInTheDocument();
 expect(new FormData(container.querySelector('form')).has('subsidy')).toBe(false);
 await user.click(screen.getByRole('combobox',{name:/Property type/}));
 await user.click(screen.getByRole('option',{name:'Home'}));
 expect(screen.getByRole('checkbox',{name:/rooftop solar subsidy/})).not.toBeChecked();
});
test('a new enquiry starts without preselected requirements or a default location',()=>{
 const {container}=render(<Enquiry state={{...state,form:{}}}/>);
 for(const name of ['name','phone','email','segment','roof','package','kw','bill','area']){
   expect(container.querySelector(`[name="${name}"]`).value).toBe('');
 }
 expect(screen.getAllByText('Not selected')).toHaveLength(4);
 expect(screen.queryByText(/Bengaluru \(default\)/)).not.toBeInTheDocument();
});
test('previously entered requirements are retained after validation',()=>{
 const {container}=render(<Enquiry state={{...state,form:{segment:'home',roof:'tin',package:'offgrid',kw:'2',bill:'2400'}}}/>);
 for(const [name,value] of Object.entries({segment:'home',roof:'tin',package:'offgrid',kw:'2',bill:'2400'})){
   expect(container.querySelector(`[name="${name}"]`).value).toBe(value);
 }
});
test('new customers require a password and cannot submit without a map selection',async()=>{
 const {container}=render(<Enquiry state={state}/>);
 await screen.findByLabelText('Location test input');
 expect(screen.getByLabelText(/Create password/)).toBeRequired();
 fireEvent.submit(container.querySelector('form'));
 expect(await screen.findByRole('alert')).toHaveTextContent(/Choose your installation location/);
 expect(screen.getByLabelText('Location test input')).toHaveFocus();
});
test('a signed-in customer can create another enquiry without another password',()=>{
 render(<Enquiry state={{...state,user:{name:'Customer'},customer:{name:'Customer'}}}/>);
 expect(screen.queryByLabelText(/Create password/)).not.toBeInTheDocument();
});
