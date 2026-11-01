import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
vi.mock('../../static/js/app.js',()=>({}));
vi.mock('../../static/js/field.js',()=>({}));
import WorkflowPage from './WorkflowPage';

test('workflow bridge preserves the actual form nodes and existing listeners',()=>{
 const source=document.createElement('main');
 source.innerHTML='<form method="post" action="/app/p/123/qualify/"><input type="hidden" name="csrfmiddlewaretoken" value="test-csrf"><button type="button">Extract details</button></form>';
 const originalForm=source.querySelector('form'),handler=vi.fn();
 source.querySelector('button').addEventListener('click',handler);
 const {container}=render(<WorkflowPage state={{messages:[]}} source={source}/>);
 expect(container.querySelector('form')).toBe(originalForm);
 expect(originalForm).toHaveAttribute('action','/app/p/123/qualify/');
 expect(originalForm.querySelector('input')).toHaveValue('test-csrf');
 fireEvent.click(screen.getByRole('button',{name:'Extract details'}));
 expect(handler).toHaveBeenCalledOnce();
});
