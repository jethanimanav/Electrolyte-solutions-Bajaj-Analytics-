import { Grid, Box, Typography } from '@mui/material'
import { useEffect, useState, useRef } from 'react'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import MemoryIcon from '@mui/icons-material/Memory'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import { useTheme } from '../../lib/ThemeContext'

function useCounter(target, dur = 1200) {
  const [n, setN] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    if (!target) { setN(0); return }
    clearInterval(ref.current)
    let c = 0; const step = target / (dur / 16)
    ref.current = setInterval(() => {
      c += step
      if (c >= target) { setN(target); clearInterval(ref.current) } else setN(Math.floor(c))
    }, 16)
    return () => clearInterval(ref.current)
  }, [target])
  return n
}

function KPICard({ title, value, sub, icon: Icon, accent, isFloat, suffix = '', delay = 0, wipBadge }) {
  const { theme, mode } = useTheme()
  const num = typeof value === 'number' ? value : 0
  const animated = useCounter(isFloat ? Math.round(num * 10) : num)
  const display = isFloat ? `${(animated / 10).toFixed(1)}${suffix}` : `${animated.toLocaleString()}${suffix}`
  const isDark = mode === 'dark'

  return (
    <Box sx={{
      p: 2.2, borderRadius: '20px',
      background: isDark 
        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
        : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${wipBadge ? (isDark ? 'rgba(167,139,250,0.25)' : 'rgba(124,58,237,0.15)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15, 23, 42, 0.08)')}`,
      boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)', 
      cursor: 'default', height: '100%',
      animation: `fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
      '&:hover': {
        border: `1px solid ${accent}`,
        boxShadow: isDark 
          ? `0 20px 40px -15px rgba(0,0,0,0.6), 0 0 20px -5px ${accent}30` 
          : `0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 20px -5px ${accent}25`,
        transform: 'translateY(-6px) scale(1.02)'
      }
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.8}>
        <Box sx={{ 
          p: 0.9, borderRadius: '12px', 
          background: `${accent}15`, 
          border: `1px solid ${accent}25`, 
          display: 'inline-flex', 
          color: accent,
          boxShadow: `0 0 15px -5px ${accent}`
        }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        {wipBadge ? (
          <Box sx={{ px: 1, py: 0.4, borderRadius: '8px', background: isDark ? 'rgba(234,179,8,0.1)' : 'rgba(217,119,6,0.08)', border: `1px solid ${isDark ? 'rgba(234,179,8,0.2)' : 'rgba(217,119,6,0.2)'}` }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: theme.orange, fontFamily: 'Inter', letterSpacing: '0.05em' }}>IN PROGRESS</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 1, py: 0.4, borderRadius: '8px', background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.06)', border: `1px solid ${isDark ? 'rgba(34,197,94,0.18)' : 'rgba(22,163,74,0.15)'}` }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: theme.green, fontFamily: 'Inter', letterSpacing: '0.05em' }}>LIVE MONITOR</Typography>
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: theme.text1, letterSpacing: '-1.5px', lineHeight: 1.1, mb: 0.5, fontFamily: "'JetBrains Mono', monospace" }}>
        {display}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: theme.text3, mb: 1.2, fontFamily: 'Inter', opacity: 0.8 }}>{title}</Typography>
      <Box sx={{ height: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', mb: 1.2 }} />
      <Typography sx={{ fontSize: '0.68rem', color: accent, fontFamily: 'Inter', fontWeight: 600, lineHeight: 1.4, opacity: 0.9 }}>{sub}</Typography>
    </Box>
  )
}

function Skeleton() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const skClass = isDark ? 'skeleton-dark' : 'skeleton-light'
  return (
    <Box sx={{ p: 2.2, borderRadius: '20px', background: isDark ? 'rgba(15,23,42,0.4)' : '#fff', border: `1px solid ${theme.border}`, height: 154 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Box sx={{ width: 40, height: 40, borderRadius: '12px' }} className={skClass} />
        <Box sx={{ width: 60, height: 20, borderRadius: '8px' }} className={skClass} />
      </Box>
      <Box sx={{ width: '65%', height: 40, borderRadius: '8px', mb: 1 }} className={skClass} />
      <Box sx={{ width: '85%', height: 16, borderRadius: '4px' }} className={skClass} />
    </Box>
  )
}

export default function KPICards({ data, loading }) {
  const { theme } = useTheme()
  if (loading) return (
    <Grid container spacing={2} mb={2.5}>
      {[...Array(6)].map((_, i) => <Grid item xs={12} sm={6} md={4} lg={2} key={i}><Skeleton /></Grid>)}
    </Grid>
  )
  if (!data) return null

  const cards = [
    { title: 'Total Records',      value: data.total_entries, sub: `${data.total_pcbs||0} PCB types tracked`,   icon: StorageOutlinedIcon,    accent: theme.blue,    delay: 0 },
    { title: 'Repair OK',          value: data.ok_count,      sub: `${data.ok_percentage||0}% of completed`,    icon: CheckCircleOutlineIcon, accent: theme.green,   delay: 0.06 },
    { title: 'No Fault Found',     value: data.nff_count,     sub: `${data.nff_percentage||0}% NFF rate`,       icon: HighlightOffIcon,       accent: theme.orange,  delay: 0.12 },
    { title: 'Work In Progress',   value: data.wip_count,     sub: `${data.wip_percentage||0}% pending repair`, icon: HourglassEmptyIcon,     accent: theme.purple2, delay: 0.18, wipBadge: true },
    { title: 'Service Locations',  value: data.total_branches, sub: 'Cities & branches covered',                icon: LocationOnOutlinedIcon, accent: theme.red,     delay: 0.24 },
    { title: 'PCB Types',          value: data.total_pcbs,    sub: 'Unique part codes',                         icon: MemoryIcon,             accent: theme.purple,  delay: 0.30 },
  ]

  return (
    <Grid container spacing={2} mb={2.5}>
      {cards.map((c, i) => <Grid item xs={12} sm={6} md={4} lg={2} key={i}><KPICard {...c} /></Grid>)}
    </Grid>
  )
}
