import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import SystemSupport from './SystemSupport';

test('installed systems show active warranty and a report link for their project',()=>{
 render(<SystemSupport support={{available:true,coveredUnits:3,warrantyLabel:'Warranty active',url:'/portal/requests/new/?project=12'}}/>);
 expect(screen.getByText('Warranty active')).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Report a problem'})).toHaveAttribute('href','/portal/requests/new/?project=12');
});
test('service action is hidden until installation is complete',()=>{
 render(<SystemSupport support={{available:false}}/>);
 expect(screen.queryByRole('link',{name:'Report a problem'})).not.toBeInTheDocument();
});
