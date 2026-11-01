import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import Auth from './Auth';
const state={page:'login',csrf:'test-csrf',next:'/portal/',messages:[],demoMode:true,username:'',otp:{step:'request',phone:''}};

test('login preserves the Django form contract and password visibility never submits',async()=>{
 const user=userEvent.setup();const {container}=render(<Auth state={state}/>);
 const form=container.querySelector('form');const submit=vi.fn(e=>e.preventDefault());form.addEventListener('submit',submit);
 expect(form).toHaveAttribute('method','post');expect(form).toHaveAttribute('action','/login/');
 expect(form.querySelector('[name=csrfmiddlewaretoken]')).toHaveValue('test-csrf');
 expect(form.querySelector('[name=next]')).toHaveValue('/portal/');
 const password=screen.getByLabelText(/Password/);expect(password).toHaveAttribute('type','password');
 await user.click(screen.getByRole('button',{name:'Show password'}));
 expect(password).toHaveAttribute('type','text');expect(submit).not.toHaveBeenCalled();
});
test('production login does not advertise a demo-only OTP flow',()=>{
 render(<Auth state={{...state,demoMode:false}}/>);
 expect(screen.queryByRole('link',{name:/verification code/i})).not.toBeInTheDocument();
});
test('staff sign-in posts to the employee route and links back to customer login',()=>{
 const employee={...state,page:'employee_login',employeePortal:true,next:'/app/'};
 const {container}=render(<Auth state={employee}/>);
 const form=container.querySelector('form');
 expect(form).toHaveAttribute('action','/employee/login/');
 expect(form.querySelector('[name=next]')).toHaveValue('/app/');
 expect(screen.getByLabelText(/Employee username, staff email or phone/)).toBeRequired();
 expect(screen.getByLabelText(/Password/)).toBeRequired();
 expect(screen.getByRole('button',{name:'Sign in to workspace'})).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Customer portal login'})).toHaveAttribute('href','/login/');
});
