import { render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Shell from './Shell';

test('the React notification badge polls the authorized endpoint and cleans up requests',async()=>{
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({count:5})});
 vi.stubGlobal('fetch',fetcher);
 try{
  const {unmount}=render(<Shell state={{user:{id:1,name:'Test User',role:'Sales',isCustomer:false},navigation:[],demoUsers:[],csrf:'test-csrf',unread:0}}><main>Test content</main></Shell>);
  await waitFor(()=>expect(screen.getByText('5')).toBeInTheDocument());
  expect(fetcher).toHaveBeenCalledWith('/api/notifications/count/',expect.objectContaining({credentials:'same-origin'}));
  const signal=fetcher.mock.calls[0][1].signal;
  unmount();expect(signal.aborted).toBe(true);
 }finally{vi.unstubAllGlobals();}
});
