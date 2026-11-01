import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { ArrowRight, CheckCircle2, FileText, QrCode, ShieldCheck, Sparkles, Sun, TrendingUp, Wrench, Zap } from 'lucide-react';
import { Journey, PublicFooter, PublicHeader } from '../components/Common';

export default function Landing({ state }) {
  return (
    <div className="marketing">
      <PublicHeader user={state.user} />
      <main id="main-content" tabIndex={-1}>
        {/* HERO SECTION */}
        <Container maxWidth="lg" className="landing-hero" style={{ paddingBlock: '64px 48px' }}>
          <Box>
            <Typography component="h1" className="landing-title" style={{ fontSize: 'clamp(36px, 4vw, 54px)', lineHeight: 1.15 }}>
              Rooftop solar, engineered for <span style={{ color: '#d97706' }}>decades</span>.
            </Typography>
            <Typography color="text.secondary" className="landing-description" style={{ fontSize: '17px', lineHeight: 1.7, marginTop: '20px' }}>
              One connected journey from first roof pin to 25-year warranty. Track surveys, quotes, dispatches, PM Surya Ghar subsidies, and generation performance in one unified customer portal.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 4, gap: 1.5 }}>
              <Button component="a" href="/enquire/" size="large" variant="contained" color="secondary" endIcon={<ArrowRight size={19} />}>
                Plan my solar installation
              </Button>
            </Stack>
            <div style={{ display: 'flex', gap: '24px', marginTop: '36px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <div><b style={{ fontSize: '1.25rem', color: '#0f172a' }}>38+ MW</b><div style={{ fontSize: '11px', color: '#64748b' }}>Rooftop Capacity</div></div>
              <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
              <div><b style={{ fontSize: '1.25rem', color: '#059669' }}>₹1.8 Cr+</b><div style={{ fontSize: '11px', color: '#64748b' }}>Subsidies Credited</div></div>
              <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
              <div><b style={{ fontSize: '1.25rem', color: '#d97706' }}>4.9 ★</b><div style={{ fontSize: '11px', color: '#64748b' }}>Customer CSAT</div></div>
              <div style={{ width: '1px', height: '28px', background: '#e2e8f0' }}></div>
              <div><b style={{ fontSize: '1.25rem', color: '#0f172a' }}>0 Paperwork</b><div style={{ fontSize: '11px', color: '#64748b' }}>Automated Trail</div></div>
            </div>
          </Box>

          {/* SOLAR STORY CARD */}
          <Box className="solar-story" style={{ background: '#0f172a', borderRadius: '20px', border: '1px solid #334155', padding: '36px' }}>
            <div className="story-heading" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <span className="story-icon" style={{ color: '#f59e0b' }}><Sun size={28} /></span>
              <Box>
                <Typography variant="overline" style={{ color: '#fbbf24', letterSpacing: '1.5px', fontWeight: 700 }}>THE SUNTHREAD ADVANTAGE</Typography>
                <Typography variant="h3" component="h2" style={{ color: '#fff' }}>A clear next step. Always.</Typography>
              </Box>
            </div>
            <Journey />
          </Box>
        </Container>

        {/* BENTO GRID: ENTERPRISE OPERATIONS */}
        <section style={{ padding: '72px 0', background: '#fff' }}>
          <Container maxWidth="lg">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', letterSpacing: '1.5px', textTransform: 'uppercase' }}>ENTERPRISE SOLAR PLATFORM</span>
              <Typography variant="h2" component="h2" style={{ fontSize: '2.1rem', marginTop: '6px', fontWeight: 800 }}>
                Every handoff connected. Zero chaos.
              </Typography>
              <Typography color="text.secondary" style={{ marginTop: '8px' }}>
                How SunThread eliminates the traditional seam friction between sales, engineering, warehouse, and field technicians.
              </Typography>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#dbeafe', color: '#1d4ed8', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  <Zap size={22} />
                </div>
                <Typography variant="h3" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  Live Handoff Telemetry
                </Typography>
                <Typography color="text.secondary" variant="body2" style={{ lineHeight: 1.6 }}>
                  Strict state machine rules govern every stage. Sales cannot quote before survey approval; warehouse cannot dispatch without serial scanning.
                </Typography>
              </div>

              <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#047857', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  <ShieldCheck size={22} />
                </div>
                <Typography variant="h3" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  PM Surya Ghar Automation
                </Typography>
                <Typography color="text.secondary" variant="body2" style={{ lineHeight: 1.6 }}>
                  Direct portal KYC document upload (electricity bill, Aadhaar, bank passbook) with step-by-step audit tracking until DBT release.
                </Typography>
              </div>

              <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  <QrCode size={22} />
                </div>
                <Typography variant="h3" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  Asset Tagging & QR Vault
                </Typography>
                <Typography color="text.secondary" variant="body2" style={{ lineHeight: 1.6 }}>
                  Every physical inverter and Mono PERC panel receives a printable barcode label. Warranties snapshot automatically at delivery.
                </Typography>
              </div>

              <div style={{ background: '#f8fafc', padding: '28px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                  <Wrench size={22} />
                </div>
                <Typography variant="h3" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                  Inverter Fault Diagnostics
                </Typography>
                <Typography color="text.secondary" variant="body2" style={{ lineHeight: 1.6 }}>
                  Contextual diagnostic hints for error codes (E01, E04, E12) with instant warranty coverage verdict and technician visit scheduling.
                </Typography>
              </div>
            </div>
          </Container>
        </section>

        {/* CUSTOMER PORTAL CTA */}
        <Container maxWidth="lg" style={{ paddingBlock: '48px 64px' }}>
          <Box className="returning-customer" style={{ background: '#0f172a', color: '#fff', padding: '40px 48px', borderRadius: '18px' }}>
            <Box>
              <Typography component="h2" variant="h2" style={{ color: '#fff', fontSize: '1.8rem' }}>
                Already a SunPower customer?
              </Typography>
              <Typography style={{ color: '#94a3b8', marginTop: '6px' }}>
                Sign in to view your real-time project timeline, download invoices, submit subsidy KYC, or raise a service request.
              </Typography>
            </Box>
            <Button component="a" href="/login/" variant="contained" style={{ background: '#fff', color: '#0f172a', fontWeight: 700 }} endIcon={<ArrowRight size={17} />}>
              Open my portal
            </Button>
          </Box>
        </Container>
      </main>
      <PublicFooter />
    </div>
  );
}
