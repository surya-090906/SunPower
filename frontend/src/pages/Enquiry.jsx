import { lazy, Suspense, useState } from 'react';
import { Box, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { ArrowRight, Check, ShieldCheck, Sun } from 'lucide-react';
import { Csrf, Messages, PageHeading } from '../components/Common';
import { PasswordField } from './Auth';
import { validPoint } from '../lib/location';
const LocationPicker=lazy(()=>import('../components/LocationPicker'));

function Section({number,title,description,children}) {
  return <Paper variant="outlined" className="enquiry-section"><div className="section-heading"><span>{number}</span><Box><Typography variant="h3" component="h2">{title}</Typography>{description&&<Typography color="text.secondary" variant="body2">{description}</Typography>}</Box></div>{children}</Paper>;
}

export default function Enquiry({state}) {
  const f=state.form || {};
  const initial={lat:f.site_lat,lng:f.site_lng,address:f.address,city:f.city,pincode:f.pincode};
  const [location,setLocation]=useState(validPoint(initial) ? initial : null);
  const [locationPending,setLocationPending]=useState(false);
  const [locationError,setLocationError]=useState('');
  const [kind,setKind]=useState(f.package || 'ongrid'),[kw,setKw]=useState(f.kw || '3');
  const [segment,setSegment]=useState(f.segment || 'home');
  function submit(e) {
    if(!validPoint(location)){
      e.preventDefault();
      setLocationError('Choose your installation location on the map before continuing.');
      document.getElementById('location-search')?.focus();
    }
  }
  function changeLocation(value){setLocation(value);if(value)setLocationError('');}
  return <main id="main-content" tabIndex={-1} className={state.user?'native-page':'enquiry-container'}>
    <PageHeading eyebrow="LET’S BUILD YOUR SOLAR PLAN" title={state.customer?'Plan another installation':'Your solar journey starts here'} description="Tell us a little about your property. We’ll use your requirements and site survey to prepare your proposal." />
    <Messages messages={state.messages}/><Box component="form" method="post" action="/enquire/" onSubmit={submit} className="enquiry-layout"><Csrf value={state.csrf}/><input name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot" />
      <Stack spacing={2.5}>
        <Section number="01" title="A little about you" description="Your contact details keep us connected.">
          <div className="form-grid">
            <TextField className="span-full" label="Full name" name="name" defaultValue={f.name} required autoComplete="name" slotProps={{input:{readOnly:!!state.customer}}}/>
            <TextField label="Mobile number" name="phone" defaultValue={f.phone} required autoComplete="tel" slotProps={{htmlInput:{inputMode:'tel'},input:{readOnly:!!state.customer}}}/>
            <TextField label="Email (optional)" name="email" type="email" defaultValue={f.email} autoComplete="email"/>
            {!state.customer && <div className="span-full" style={{marginTop:8}}><PasswordField label="Create password" create/></div>}
          </div>
        </Section>
        <Section number="02" title="Installation site" description="Tell us where you want solar installed.">
          <Suspense fallback={<Box className="map-loading" role="status"><CircularProgress size={24}/><span>Loading location picker…</span></Box>}>
            <LocationPicker initial={location} onChange={changeLocation} onPendingChange={setLocationPending} geocoderUrl={state.geocoderUrl} error={locationError}/>
          </Suspense>
          <div className="form-grid" style={{marginTop:24}}>
            <TextField select label="Property type" name="segment" value={segment} onChange={e=>setSegment(e.target.value)}>
              <MenuItem value="home">Home</MenuItem>
              <MenuItem value="commercial">Commercial</MenuItem>
              <MenuItem value="industry">Industry</MenuItem>
            </TextField>
            <TextField select label="Roof type" name="roof" defaultValue={f.roof || 'rcc'}>
              <MenuItem value="rcc">RCC (concrete)</MenuItem>
              <MenuItem value="tin">Tin shed</MenuItem>
            </TextField>
          </div>
        </Section>
        <Section number="03" title="The system you have in mind" description="Not sure about capacity? Your site survey will help confirm the right fit.">
          <div className="form-grid">
            <TextField select label="System type" name="package" value={kind} onChange={e=>setKind(e.target.value)}>
              <MenuItem value="ongrid">On-Grid</MenuItem>
              <MenuItem value="offgrid">Off-Grid</MenuItem>
            </TextField>
            <TextField select label="Preferred capacity" name="kw" value={kw} onChange={e=>setKw(e.target.value)}>
              {[1,2,3,4,5].map(v=><MenuItem value={String(v)} key={v}>{v} kW</MenuItem>)}
            </TextField>
            <TextField label="Monthly electricity bill (₹)" name="bill" defaultValue={f.bill} slotProps={{htmlInput:{inputMode:'numeric'}}}/>
            <TextField label="Roof area (sq ft)" name="area" defaultValue={f.area} slotProps={{htmlInput:{inputMode:'numeric'}}}/>
          </div>
          <FormControlLabel control={<Checkbox name="subsidy" value="1" defaultChecked={!!f.subsidy}/>} label={<Box><Typography sx={{fontWeight:600}}>I’m interested in the rooftop solar subsidy</Typography><Typography variant="body2" color="text.secondary">Applies to eligible On-Grid installations at homes. Eligibility is confirmed during assessment.</Typography></Box>} sx={{mt:2,alignItems:'flex-start'}}/>
        </Section>
        <Section number="04" title="Anything else?">
          <Stack spacing={2.5}>
            <TextField label="Anything else we should know? (optional)" name="notes" multiline minRows={2} defaultValue={f.notes}/>
          </Stack>
        </Section>
      </Stack>
      <aside className="enquiry-summary">
        <Paper variant="outlined" sx={{p:3}}>
          <span className="summary-symbol"><Sun size={29}/></span>
          <Typography variant="h3" component="h2" sx={{mt:2}}>Your starting point</Typography>
          <Typography variant="body2" color="text.secondary" sx={{mt:1}}>A few details today. A proposal designed around your property next.</Typography>
          <dl>
            <dt>System</dt><dd>{kind==='ongrid'?'On-Grid':'Off-Grid'}</dd>
            <dt>Preferred capacity</dt><dd>{kw} kW</dd>
            <dt>Property</dt><dd>{segment==='commercial'?'Commercial':segment==='industry'?'Industry':'Home'}</dd>
            <dt>Installation site</dt><dd>{location?<span className="site-confirmed"><Check size={15}/> Selected</span>:'Bengaluru (default)'}</dd>
          </dl>
          <Button type="submit" disabled={locationPending} variant="contained" color="secondary" fullWidth size="large" endIcon={<ArrowRight size={18}/>}>{state.customer?'Send my enquiry':'Create account & send enquiry'}</Button>
        </Paper>
      </aside>
    </Box>
  </main>;
}
