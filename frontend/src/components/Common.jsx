import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, Check, Sun } from 'lucide-react';

export function Brand({ compact = false, inverse = false, href = '/' }) {
  return <a className={`brandmark ${inverse ? 'inverse' : ''}`} href={href} aria-label="SunPower home">
    <span className="brand-symbol"><Sun size={23} strokeWidth={2} /></span>
    <span>SunPower{!compact && <small>POWERING YOUR EVERYDAY</small>}</span>
  </a>;
}

export function Csrf({ value }) { return <input type="hidden" name="csrfmiddlewaretoken" value={value} />; }

export function Messages({ messages = [] }) {
  return messages.length > 0 && <Stack spacing={1.5} sx={{ mb: 3 }} aria-label="Notifications">
    {messages.map((m, index) => <Alert key={index} severity={m.level.includes('error') ? 'error' : m.level.includes('success') ? 'success' : m.level.includes('warn') ? 'warning' : 'info'}>{m.text}</Alert>)}
  </Stack>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <Box className="page-heading">
    <Box>{eyebrow && <Typography className="eyebrow" component="p">{eyebrow}</Typography>}
      <Typography variant="h1" sx={{ fontSize: { xs: '1.8rem', md: '2.15rem' } }}>{title}</Typography>
      {description && <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 680 }}>{description}</Typography>}
    </Box>{action}
  </Box>;
}

export function Journey({ compact = false }) {
  const steps = [
    ['A plan for your roof', 'Choose your site and tell us what you need.'],
    ['Survey and proposal', 'Review the site survey and your solar quote.'],
    ['Installation, connected', 'Follow equipment delivery and installation.'],
    ['Support that stays with you', 'Keep documents, warranty and service in one place.'],
  ];
  return <ol className={`journey ${compact ? 'compact' : ''}`}>
    {steps.map(([title, text], i) => <li key={title}><span className="journey-number">{i === 3 ? <Check size={17} /> : `0${i + 1}`}</span><Box><Typography component="h3" sx={{fontWeight:700}}>{title}</Typography>{!compact && <Typography variant="body2" sx={{ color: 'inherit', opacity: .8, mt: .5 }}>{text}</Typography>}</Box></li>)}
  </ol>;
}

export function PublicHeader({ user }) {
  return <header className="public-header"><div className="public-header-inner"><Brand />
    <Stack direction="row" spacing={{ xs: .5, sm: 2 }} sx={{alignItems:"center"}}>
      {!user && <Button component="a" href="/login/" color="secondary">Log in</Button>}
      <Button component="a" href={user ? user.isCustomer ? '/portal/' : '/app/' : '/enquire/'} variant="contained" color="secondary" endIcon={<ArrowRight size={17} />}>
        {user ? 'My workspace' : 'Get a solar quote'}
      </Button>
    </Stack>
  </div></header>;
}

export function PublicFooter() {
  return <footer className="public-footer"><span>SunPower Solutions · Rooftop solar, connected. Your project details stay in your account.</span></footer>;
}

export function StatusChip({ children, success = false }) {
  return <Chip label={children} size="small" sx={{ bgcolor: success ? '#e8f4ec' : '#fff2df', color: success ? '#246745' : '#854b12' }} />;
}
