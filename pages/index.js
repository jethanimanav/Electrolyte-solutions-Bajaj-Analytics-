import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  Box, Grid, TextField, Button, Typography,
  Checkbox, FormControlLabel, Link, Alert,
  InputAdornment, IconButton, Divider, Chip
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import PeopleIcon from '@mui/icons-material/People'
import StorageIcon from '@mui/icons-material/Storage'
import InsightsIcon from '@mui/icons-material/Insights'

const features = [
  { icon: <AnalyticsIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'Real-time Analytics', desc: 'Live PCB performance insights' },
  { icon: <UploadFileIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'Excel Processing', desc: 'Auto upload & data parsing' },
  { icon: <DashboardIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'Smart Dashboard', desc: 'KPIs, charts & filters' },
  { icon: <SecurityIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'Role Based Access', desc: 'Admin, Manager & Viewer' },
  { icon: <SpeedIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'High Performance', desc: 'API response under 1 second' },
  { icon: <StorageIcon sx={{ color: '#00b4ff', fontSize: 22 }} />, title: 'PostgreSQL DB', desc: 'Structured & secure storage' },
]

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<1s', label: 'API Response' },
  { value: '30+', label: 'Concurrent Users' },
  { value: '95%', label: 'Data Accuracy' },
]

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    color: 'white', borderRadius: 2, background: 'rgba(255,255,255,0.05)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(0,180,255,0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#00b4ff', borderWidth: 2 },
  },
  '& input::placeholder': { color: 'rgba(255,255,255,0.2)', opacity: 1 },
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!email.includes('@')) return setError('Enter a valid email address')
    if (!password) return setError('Password is required')
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (email === 'admin@bajaj.com' && password === 'admin123') {
        router.push('/dashboard')
      } else {
        setError('Invalid credentials. Please try again.')
        setLoading(false)
      }
    }, 1200)
  }

  return (
    <>
      <Head><title>Login — Electrolyte Bajaj PCB Dashboard</title></Head>
      <Box sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #020617 0%, #0f172a 60%, #0a1628 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', py: 3, px: 2,
      }}>
        {/* Background grid */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,180,255,0.1), transparent)', top: '-200px', right: '-200px', animation: 'float 6s ease-in-out infinite', '@keyframes float': { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } } }} />

        {/* Badge */}
        <Box zIndex={1} mb={1.5}>
          <Chip label="🔒 Secure Internal Platform — Bajaj Auto Limited" size="small"
            sx={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' }} />
        </Box>

        {/* Main card */}
        <Box zIndex={1} sx={{ width: '100%', maxWidth: 920, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, backdropFilter: 'blur(20px)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'slideIn 0.7s ease', '@keyframes slideIn': { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>

          {/* Branding */}
          <Box sx={{ textAlign: 'center', pt: 3, pb: 2, px: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <Box sx={{ display: 'inline-block', p: 1, borderRadius: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', mb: 1.5 }}>
              <img src="/logo.jpeg" alt="logo" style={{ width: 140, borderRadius: 8, display: 'block' }} />
            </Box>
            <Typography variant="h4" fontWeight="900" sx={{ background: 'linear-gradient(135deg, #ffffff 30%, #00b4ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px', mb: 0.3 }}>
              Electrolyte Bajaj
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase' }}>
              PCB Data Intelligence Platform
            </Typography>
          </Box>

          {/* Feature cards */}
          <Box sx={{ px: 4, pt: 2, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Grid container spacing={1.2}>
              {features.map((f, i) => (
                <Grid item xs={6} sm={4} key={i}>
                  <Box sx={{ p: 1.3, borderRadius: 2.5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 1.2, alignItems: 'flex-start', transition: 'all 0.3s', '&:hover': { background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.2)', transform: 'translateY(-2px)' } }}>
                    {f.icon}
                    <Box>
                      <Typography fontWeight="700" fontSize="0.75rem" sx={{ color: 'white', mb: 0.1 }}>{f.title}</Typography>
                      <Typography fontSize="0.62rem" sx={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Login form */}
          <Box sx={{ px: { xs: 3, sm: 8 }, py: 3 }}>
            <Typography variant="h5" fontWeight="800" sx={{ color: 'white', mb: 0.4, textAlign: 'center' }}>Welcome Back 👋</Typography>
            <Typography variant="body2" mb={2.5} sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Sign in to access your PCB analytics dashboard</Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', color: '#ff6b6b', '& .MuiAlert-icon': { color: '#ff6b6b' } }}>{error}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>EMAIL ADDRESS</Typography>
                <TextField fullWidth type="email" placeholder="admin@bajaj.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} sx={inputStyle}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: 0.5, display: 'block', mb: 0.5 }}>PASSWORD</Typography>
                <TextField fullWidth type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} sx={inputStyle}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} /> : <Visibility sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }} />}</IconButton></InputAdornment>
                  }} />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5} mb={2}>
              <FormControlLabel control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#00b4ff' } }} />}
                label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Remember me</Typography>} />
              <Link href="#" underline="hover" sx={{ color: '#00b4ff', fontSize: '0.8rem', fontWeight: 500 }}>Forgot password?</Link>
            </Box>

            <Button fullWidth variant="contained" size="large" onClick={handleLogin} disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 'bold', fontSize: '1rem', background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #00b4ff 0%, #0066ff 100%)', boxShadow: loading ? 'none' : '0 8px 25px rgba(0,102,255,0.4)', color: loading ? 'rgba(255,255,255,0.3)' : 'white', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 35px rgba(0,102,255,0.5)' } }}>
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </Button>

            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.62rem', letterSpacing: 1 }}>DEMO ACCESS</Typography>
            </Divider>
            <Box sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', background: 'rgba(0,180,255,0.05)', border: '1px dashed rgba(0,180,255,0.15)' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>📧 admin@bajaj.com &nbsp;·&nbsp; 🔑 admin123</Typography>
            </Box>
          </Box>

          {/* Stats bar */}
          <Box sx={{ px: 4, py: 1.8, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
            {stats.map((s, i) => (
              <Box key={i} textAlign="center">
                <Typography fontWeight="800" fontSize="0.95rem" sx={{ background: 'linear-gradient(135deg, #00b4ff, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.58rem', letterSpacing: 1 }}>{s.label}</Typography>
              </Box>
            ))}
            <Box display="flex" alignItems="center" gap={0.8}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 6px #00ff88', animation: 'blink 2s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.6rem' }}>All systems operational</Typography>
            </Box>
          </Box>
        </Box>

        <Box zIndex={1} mt={2} display="flex" justifyContent="space-between" alignItems="center" width="100%" maxWidth={920}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>© 2025 Bajaj Auto Limited · Internal Tool</Typography>
          <Chip label="v1.0.0" size="small" sx={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', fontSize: '0.6rem', height: 18 }} />
        </Box>
      </Box>
    </>
  )
}
