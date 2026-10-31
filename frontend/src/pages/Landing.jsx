import { useState } from 'react';
import { Box, Button, Container, Grid, Paper, Slider, Stack, Typography } from '@mui/material';
import { ArrowRight, Calculator, CheckCircle2, FileText, QrCode, ShieldCheck, Sparkles, Sun, TrendingUp, Wrench, Zap } from 'lucide-react';
import { Journey, PublicFooter, PublicHeader } from '../components/Common';

export default function Landing({ state }) {
  const [bill, setBill] = useState(4500);

  // Solar calculation logic
  const kw = bill < 3000 ? 2 : bill < 6000 ? 3 : bill < 9000 ? 4 : 5;
  const subsidy = kw === 1 ? 30000 : kw === 2 ? 60000 : 78000;
  const annualSavings = Math.round(bill * 10.8); // ~90% bill reduction across 12 months
  const total25Savings = Math.round((annualSavings * 25) / 100000 * 10) / 10;
  const paybackYears = (kw * 65000 - subsidy) / annualSavings;

  return (
    <div className="marketing">
      <PublicHeader user={state.user} />
      <main id="main-content" tabIndex={-1}>
        {/* HERO SECTION */}
        <Container maxWidth="lg" className="landing-hero" style={{ paddingBlock: '64px 48px' }}>
          <Box>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', color: '#047857', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '20px', border: '1px solid #a7f3d0' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              PM SURYA GHAR COMPLIANT · BENGALURU
            </div>
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
              <Button component="a" href="#calculator" variant="outlined" color="secondary" startIcon={<Calculator size={18} />}>
                Calculate solar savings
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

        {/* INTERACTIVE SAVINGS ESTIMATOR */}
        <section id="calculator" style={{ background: '#f8fafc', padding: '64px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <Container maxWidth="lg">
            <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', letterSpacing: '1.5px', textTransform: 'uppercase' }}>SAVINGS ENGINE</span>
              <Typography variant="h2" component="h2" style={{ fontSize: '2.1rem', marginTop: '6px', fontWeight: 800 }}>
                Calculate your rooftop solar returns
              </Typography>
              <Typography color="text.secondary" style={{ marginTop: '8px' }}>
                Based on Karnataka electricity tariffs and current PM Surya Ghar Muft Bijli Yojana subsidy slabs.
              </Typography>
            </div>

            <Paper variant="outlined" style={{ maxWidth: '920px', margin: '0 auto', padding: '36px', borderRadius: '16px', background: '#fff', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)' }}>
              <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" style={{ fontWeight: 700, color: '#0f172a' }}>
                    Select your current monthly electricity bill:
                  </Typography>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', margin: '12px 0 20px' }}>
                    ₹{bill.toLocaleString('en-IN')} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>/ month</span>
                  </div>
                  <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    {[2500, 4500, 7500, 12000].map(val => (
                      <Button
                        key={val}
                        size="small"
                        variant={bill === val ? 'contained' : 'outlined'}
                        color={bill === val ? 'secondary' : 'inherit'}
                        onClick={() => setBill(val)}
                        style={{ borderRadius: '8px', fontSize: '13px' }}
                      >
                        ₹{val.toLocaleString('en-IN')}
                      </Button>
                    ))}
                  </Stack>
                  <Slider
                    value={bill}
                    min={1500}
                    max={20000}
                    step={500}
                    onChange={(_, v) => setBill(v)}
                    sx={{ color: '#d97706' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>₹1,500</span>
                    <span>₹20,000+</span>
                  </div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>RECOMMENDED SYSTEM</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{kw} kW</div>
                        <div style={{ fontSize: '11px', color: '#059669' }}>On-Grid Solar Plant</div>
                      </div>
                      <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>GOVT SUBSIDY (DBT)</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>₹{subsidy.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Direct to bank account</div>
                      </div>
                      <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ANNUAL SAVINGS</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>₹{annualSavings.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Every year on bills</div>
                      </div>
                      <div style={{ background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>25-YR NET RETURN</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>₹{total25Savings} Lakhs</div>
                        <div style={{ fontSize: '11px', color: '#059669' }}>Payback ~{paybackYears.toFixed(1)} yrs</div>
                      </div>
                    </div>
                    <Button
                      component="a"
                      href={`/enquire/?bill=${bill}&kw=${kw}`}
                      variant="contained"
                      color="secondary"
                      fullWidth
                      size="large"
                      endIcon={<ArrowRight size={18} />}
                    >
                      Lock In This System & Subsidy
                    </Button>
                  </div>
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </section>

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
