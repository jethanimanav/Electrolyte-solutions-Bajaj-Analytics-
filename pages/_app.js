import { Box, CssBaseline, LinearProgress } from '@mui/material'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'
import ErrorBoundary from '../lib/ErrorBoundary'
import '../styles/globals.css'

const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

function AppContent({ Component, pageProps }) {
  const router = useRouter()
  const { mode } = useTheme()
  const isLight = mode === 'light'
  const [routeLoading, setRouteLoading] = useState(false)

  // Route change loading indicator
  useEffect(() => {
    const handleStart = (url) => { if (url !== router.asPath) setRouteLoading(true) }
    const handleDone = () => setRouteLoading(false)
    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleDone)
    router.events.on('routeChangeError', handleDone)
    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleDone)
      router.events.off('routeChangeError', handleDone)
    }
  }, [router])

  const muiTheme = createTheme({
    palette: {
      mode,
      ...(isLight ? {
        primary:    { main: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
        secondary:  { main: '#7c3aed' },
        success:    { main: '#16a34a', light: '#22c55e', dark: '#15803d' },
        warning:    { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
        error:      { main: '#dc2626', light: '#ef4444' },
        background: { default: '#f4f6fb', paper: '#ffffff' },
        text:       { primary: '#0f172a', secondary: '#334155', disabled: '#94a3b8' },
        divider:    'rgba(15,23,42,0.09)',
      } : {
        primary:    { main: '#38bdf8', light: '#7dd3fc', dark: '#0ea5e9' },
        secondary:  { main: '#a78bfa' },
        background: { default: '#0b0f19', paper: '#111827' },
        text:       { primary: '#f1f5f9', secondary: '#94a3b8', disabled: '#475569' },
        divider:    'rgba(148,163,184,0.13)',
      }),
    },
    typography: {
      fontFamily: FONT,
      allVariants: { letterSpacing: '-0.01em' },
      h1: { fontWeight: 800, letterSpacing: '-0.04em' },
      h2: { fontWeight: 700, letterSpacing: '-0.03em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.875rem' },
      body2: { fontSize: '0.8rem' },
      caption: { fontSize: '0.72rem' },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#f4f6fb' : '#0b0f19',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }
        }
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } }
      },
      MuiMenuItem: {
        styleOverrides: { root: { fontSize: '0.8rem', fontFamily: FONT } }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isLight ? '#0f172a' : '#0a1628',
            border: `1px solid ${isLight ? 'rgba(15,23,42,0.2)' : 'rgba(56,189,248,0.15)'}`,
            fontSize: '0.7rem', fontFamily: FONT,
            color: '#f1f5f9', borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            padding: '6px 10px',
          },
          arrow: { color: isLight ? '#0f172a' : '#0a1628' },
        }
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em', fontFamily: FONT }
        }
      },
      MuiChip: {
        styleOverrides: {
          root:  { fontWeight: 600, fontFamily: FONT },
          label: { fontFamily: FONT },
        }
      },
      MuiTableCell: {
        styleOverrides: {
          root: { fontFamily: FONT },
          head: {
            backgroundColor: isLight ? '#f8fafc' : 'rgba(8,17,31,0.98)',
            color: isLight ? '#374151' : '#64748b',
            fontWeight: 700,
            borderBottomColor: isLight ? 'rgba(15,23,42,0.1)' : 'rgba(148,163,184,0.1)',
          },
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td': { borderBottom: 0 },
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          select: isLight ? { color: '#0f172a', fontFamily: FONT } : { fontFamily: FONT },
        }
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontFamily: FONT },
          input: { fontFamily: FONT },
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: isLight ? {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,23,42,0.16)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(37,99,235,0.4)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
            backgroundColor: '#ffffff',
            color: '#0f172a',
          } : {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.09)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(56,189,248,0.25)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
          },
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.06)',
          },
          bar: {
            background: 'linear-gradient(90deg, #38bdf8, #a78bfa)',
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: '#38bdf8', height: 2, borderRadius: 2 },
        }
      },
      MuiTab: {
        styleOverrides: {
          root: { fontFamily: FONT, textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' }
        }
      },
    }
  })

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Head>
        <title>Electrolyte Bajaj — PCB Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <CssBaseline />
      {routeLoading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress sx={{
            height: 3,
            background: 'transparent',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #22c55e)',
              animationDuration: '1.2s',
            }
          }} />
        </Box>
      )}
      <Component {...pageProps} key={router.asPath} />
    </MuiThemeProvider>
  )
}

export default function App({ Component, pageProps }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])
  if (!ready) return null

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
