import { useState } from 'react';
import { Box, Button, Divider, IconButton, InputAdornment, Link, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { Brand, Csrf, Journey, Messages } from '../components/Common';

export function PasswordField({ label = 'Password', create = false }) {
  const [visible, setVisible] = useState(false);
  return <TextField label={label} name="password" type={visible ? 'text' : 'password'} required autoComplete={create ? 'new-password' : 'current-password'} helperText={create ? 'Use at least 6 characters. You’ll use this to access your project.' : undefined}
    slotProps={{ htmlInput: { minLength: create ? 6 : undefined }, input: { endAdornment: <InputAdornment position="end"><IconButton type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v=>!v)} edge="end">{visible ? <EyeOff size={19} /> : <Eye size={19} />}</IconButton></InputAdornment> } }} />;
}

export default function Auth({ state }) {
  const otp = state.page === 'otp';
  const verifying = otp && state.otp.step === 'verify';
  return <div className="auth-layout"><aside className="auth-story"><Brand inverse /><Box className="auth-story-content"><Typography className="eyebrow">WELCOME TO YOUR SOLAR SPACE</Typography><Typography component="h2" variant="h1">One roof.<br />One connected journey.</Typography><Typography sx={{ mt: 3, color: '#d4e3e7', maxWidth: 390 }}>A little less paperwork. A lot more clarity. Keep every step of your solar installation in view.</Typography><Journey compact /></Box><Typography variant="body2" sx={{ color: '#abc2cc' }}>SunPower Solutions · Rooftop solar, connected. Your project details stay in your account.</Typography></aside>
    <main className="auth-main" id="main-content" tabIndex={-1}><Box className="auth-mobile-brand"><Brand /></Box><Link href="/" color="text.secondary" className="back-link"><ArrowLeft size={17} /> Back to home</Link><Box className="auth-form-wrap"><Tabs value="login" aria-label="Customer access" sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}><Tab label="Log in" value="login" component="a" href="/login/" /><Tab label="New customer" value="new" component="a" href="/enquire/" /></Tabs>
      <Typography component="h1" variant="h1" sx={{ fontSize: '2rem' }}>{verifying ? 'Check your verification code' : otp ? 'Log in with a code' : 'Welcome back'}</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{verifying ? `Enter the 6-digit code for +91 ${state.otp.phone}.` : otp ? 'Use the mobile number registered with your account.' : 'Pick up where your solar journey left off.'}</Typography><Messages messages={state.messages} />
      <Box component="form" method="post" action={otp ? '/otp/' : '/login/'}><Csrf value={state.csrf} /><input type="hidden" name="next" value={state.next} /><Stack spacing={2.5}>
        {otp ? <><input type="hidden" name="action" value={verifying ? 'verify' : 'send'} /><input type="hidden" name="step" value={verifying ? 'verify' : 'request'} />{verifying ? <><input type="hidden" name="phone" value={state.otp.phone} /><TextField label="6-digit verification code" name="otp" autoComplete="one-time-code" required slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}', maxLength: 6 } }} /><Typography variant="body2" color="text.secondary">Demo mode: your code is shown in the notification above.</Typography></> : <TextField label="Mobile number" name="phone" defaultValue={state.otp.phone} required autoComplete="tel-national" slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{10}', maxLength: 10 } }} helperText="Enter your 10-digit registered mobile number." />}</> : <><TextField label="Mobile number or email" name="username" defaultValue={state.username} required autoComplete="username" /><PasswordField /></>}
        <Button type="submit" variant="contained" color="secondary" size="large" endIcon={<ArrowRight size={18} />}>{verifying ? 'Verify and log in' : otp ? 'Send verification code' : 'Log in to my account'}</Button>
      </Stack></Box>
      {verifying && <Stack direction="row" sx={{ mt: 2, justifyContent:"space-between" }}><Link href="/otp/">Change mobile number</Link><Box component="form" method="post" action="/otp/"><Csrf value={state.csrf} /><input type="hidden" name="action" value="send" /><input type="hidden" name="phone" value={state.otp.phone} /><Button type="submit" size="small">Resend code</Button></Box></Stack>}
      {(!otp && state.demoMode) && <Button component="a" href="/otp/" fullWidth startIcon={<KeyRound size={17} />} sx={{ mt: 2 }} color="secondary">Log in with a verification code</Button>}
      {otp && <Button component="a" href="/login/" fullWidth sx={{ mt: 2 }} color="secondary">Use my password instead</Button>}
      <Divider sx={{ my: 3 }} /><Typography color="text.secondary" variant="body2">New to SunPower? <Link href="/enquire/" sx={{fontWeight:700}}>Plan your solar installation</Link></Typography><Typography className="auth-trust"><ShieldCheck size={16} />Your project details stay in your account.</Typography>
    </Box></main>
  </div>;
}
