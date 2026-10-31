import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
vi.mock('../components/LocationPicker',()=>({default:({error})=><div>{error&&<span role="alert">{error}</span>}<input id="location-search" aria-label="Location test input"/></div>}));
import Enquiry from './Enquiry';
const state={csrf:'test-csrf',messages:[],form:{site_lat:'',site_lng:'',package:'ongrid'},user:null,customer:null};
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
