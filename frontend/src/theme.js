import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ff9a1f', light: '#fff1d6', dark: '#c2570a', contrastText: '#2b1500' },
    secondary: { main: '#ff9a1f', contrastText: '#2b1500' },
    background: { default: '#f5f3ee', paper: '#ffffff' },
    text: { primary: '#0a1b2c', secondary: '#4f5f6e' },
    divider: '#e1e7ec',
    success: { main: '#28744f' },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-.045em', lineHeight: 1.12 },
    h2: { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.025em' },
    h3: { fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-.015em' },
    h4: { fontSize: '1.05rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.65 },
    body2: { fontSize: '.9rem', lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: 0 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 44, borderRadius: 10, paddingInline: 20 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
    MuiTextField: { defaultProps: { fullWidth: true, variant: 'outlined' } },
    MuiOutlinedInput: { styleOverrides: { root: { background: '#ffffff' }, input: { fontSize: 16 } } },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 16 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { outlined: { borderColor: '#e1e7ec' } } },
    MuiTableCell: { styleOverrides: { head: { background: '#f8fafb', color: '#526474', fontSize: 12, fontWeight: 700 }, root: { borderColor: '#edf0f3', paddingBlock: 16 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', minHeight: 48, fontWeight: 700 } } },
    MuiLink: { defaultProps: { underline: 'hover' } },
  },
});
