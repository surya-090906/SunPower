import { useEffect, useState } from 'react';
import { Avatar, Badge, Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Bell, ChevronRight, ClipboardList, FolderOpen, Gauge, Headphones, LayoutDashboard, LogOut, Menu, Package, Search, Settings, ShieldCheck, Sun, TrendingUp, Wallet, Wrench, X } from 'lucide-react';
import { Brand, Csrf } from './Common';

const icons = { Home: LayoutDashboard, CRM: ClipboardList, Inventory: Package, Field: Wrench, Helpdesk: Headphones, Accounting: Wallet, Insights: TrendingUp, Settings, Projects: FolderOpen, 'My systems': Sun, Requests: Headphones, Alerts: Bell };

function DemoSwitcher({state,className}) {
  if(!state.demoUsers?.length)return null;
  return <Box component="form" action="/demo/switch/" method="post" className={className}><Csrf value={state.csrf}/><Box component="select" name="user" defaultValue={state.user.id} onChange={e=>e.currentTarget.form.requestSubmit()} aria-label="Demo account" sx={{font:'12px "DM Sans",sans-serif',width:'100%',maxWidth:190,minHeight:44,border:'1px solid #dfe6eb',borderRadius:'8px',px:1,bgcolor:'#fff',color:'#172b3a'}}>{!state.demoUsers.some(u=>u.id===state.user.id)&&<option value={state.user.id}>{state.user.name}</option>}{state.demoUsers.map(u=><option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}</Box></Box>;
}

export default function Shell({ state, children }) {
  const [open, setOpen] = useState(false);
  const [unread,setUnread]=useState(state.unread || 0);
  const { user, navigation = [] } = state;
  useEffect(()=>{
    const controller=new AbortController();
    const poll=()=>fetch('/api/notifications/count/',{credentials:'same-origin',signal:controller.signal})
      .then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted&&Number.isInteger(data?.count)&&data.count>=0)setUnread(data.count);}).catch(()=>{});
    poll();const timer=setInterval(poll,5000);
    return ()=>{controller.abort();clearInterval(timer);};
  },[user.id]);
  const current = navigation.find(n => n.active);
  const sidebar = <Box className="workspace-sidebar-inner">
    <Box sx={{ p: '28px 24px 24px' }}><Brand href={user.isCustomer ? '/portal/' : '/app/'} inverse /></Box>
    <Typography className="sidebar-label">{user.isCustomer ? 'YOUR SOLAR SPACE' : 'WORKSPACE'}</Typography>
    <nav aria-label="Workspace"><Stack spacing={.6} sx={{ px: 1.5 }}>{navigation.map(item => {
      const Icon = icons[item.label] || Gauge;
      return <a key={item.href} className={`workspace-nav-link ${item.active ? 'active' : ''}`} href={item.href} aria-current={item.active ? 'page' : undefined}><Icon size={19} /><span>{item.label}</span>{item.active && <ChevronRight size={16} />}</a>;
    })}</Stack></nav>
    <Box className="sidebar-service"><ShieldCheck size={23} /><Typography variant="body2" sx={{ color: '#e4edf0', mt: 1 }}>Every step. One place.</Typography><Typography variant="caption" sx={{ color: '#a8bdc7' }}>From the first site visit to the care your system needs.</Typography></Box>
    <Box sx={{px:3,pb:2}} className="sidebar-demo"><DemoSwitcher state={state}/></Box>
    <Box className="sidebar-user"><Avatar sx={{ width: 36, height: 36, bgcolor: '#eeb366', color: '#283e42', fontWeight: 700 }}>{user.name[0]}</Avatar><Box sx={{ minWidth: 0 }}><Typography variant="body2" sx={{fontWeight:700}} noWrap>{user.name}</Typography><Typography variant="caption" sx={{ color: '#a8bdc7' }}>{user.role}</Typography></Box></Box>
  </Box>;
  return <div className="workspace-layout">
    <aside className="workspace-sidebar">{sidebar}</aside>
    <Drawer open={open} onClose={() => setOpen(false)} sx={{ '& .MuiDrawer-paper': { width: 264, background: '#142f3a', color: '#fff' } }}>
      <IconButton aria-label="Close navigation" onClick={() => setOpen(false)} sx={{ color: '#fff', position: 'absolute', right: 5, top: 5 }}><X size={19} /></IconButton>{sidebar}
    </Drawer>
    <div className="workspace-body"><header className="workspace-topbar">
      <Stack direction="row" spacing={1} sx={{alignItems:"center"}}><IconButton aria-label="Open navigation" onClick={() => setOpen(true)} sx={{ display: { md: 'none' } }}><Menu size={21} /></IconButton><Typography variant="body2" color="text.secondary">{user.isCustomer ? 'Customer portal' : 'Workspace'}<span className="breadcrumb-separator">/</span><b>{current?.label || 'Project details'}</b></Typography></Stack>
      <Stack direction="row" spacing={1} sx={{alignItems:"center"}}>
        {!user.isCustomer && <Box component="form" action="/app/help/" method="get" className="workspace-search"><Search size={17} /><input aria-label="Search projects, customers or equipment" name="q" placeholder="Search your workspace…" /></Box>}
        {!user.isCustomer&&<Tooltip title="Search workspace"><IconButton component="a" href="/app/help/" aria-label="Search workspace" sx={{display:{xs:'inline-flex',lg:'none'}}}><Search size={19}/></IconButton></Tooltip>}
        <DemoSwitcher state={state} className="demo-select"/>
        <Tooltip title="Notifications"><IconButton component="a" href="/notifications/" aria-label="Notifications"><Badge badgeContent={unread} color="error"><Bell size={20} /></Badge></IconButton></Tooltip>
        <Box component="form" method="post" action="/logout/"><Csrf value={state.csrf} /><Tooltip title="Log out"><IconButton type="submit" aria-label="Log out"><LogOut size={19} /></IconButton></Tooltip></Box>
      </Stack>
    </header><div className="workspace-page">{children}</div><footer className="workspace-footer"><span>SunPower Solutions</span><span>Solar, connected.</span></footer></div>
    {user.isCustomer && <nav className="customer-mobile-nav" aria-label="Customer shortcuts">{navigation.map(item => { const Icon = icons[item.label] || FolderOpen; return <a key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined}><Icon size={20} /><span>{item.label}</span></a>; })}</nav>}
  </div>;
}
