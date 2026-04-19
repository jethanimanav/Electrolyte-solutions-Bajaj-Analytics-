import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Box, Typography, IconButton, Avatar, Menu, MenuItem, Badge, Tooltip } from '@mui/material'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import LogoutIcon from '@mui/icons-material/Logout'
import RefreshIcon from '@mui/icons-material/Refresh'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useTheme } from '../../lib/ThemeContext'

const TITLES = {
  '/dashboard':     'Overview Dashboard',
  '/analytics':     'Analytics & Insights',
  '/bom':           'BOM Registry',
  '/data-history':  'Data History',
  '/map-analytics': 'Map Analytics',
  '/master-table':  'Master Table',
  '/upload':        'Upload Data',
  '/corrections':   'Auto-Corrections',
  '/consumption':   'Consumption vs Actual',
}

export default function Navbar({ onRefresh }) {
  const router = useRouter()
  const { theme, toggle, mode } = useTheme()
  const [time, setTime] = useState(new Date())
  const [anchor, setAnchor] = useState(null)
  const [spin, setSpin] = useState(false)

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const doRefresh = () => { setSpin(true); onRefresh?.(); setTimeout(() => setSpin(false), 700) }
  const title = TITLES[router.pathname] || (router.pathname.startsWith('/master-table/') ? 'PCB Detail' : 'Dashboard')

  const isDark = mode === 'dark'

  // Light mode tokens
  const navBg    = isDark ? '#080e1a' : '#ffffff'
  const border   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.1)'
  const shadow   = isDark ? 'none' : '0 1px 0 rgba(15,23,42,0.08)'

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: { xs: 2, md: 3 }, height: 60, flexShrink: 0,
      background: navBg,
      borderBottom: `1px solid ${border}`,
      boxShadow: shadow,
      gap: 3
    }}>

      {/* ── Left ──────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" gap={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
        
        {/* Logo */}
        <Box sx={{ 
          height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
        }}>
          <img src="/logo.jpeg" alt="Logo" style={{ height: '100%', width: 'auto', objectFit: 'contain', display: 'block', borderRadius: '4px' }} onError={e => e.target.style.display='none'} />
        </Box>

        {/* Title */}
        <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: isDark ? '#64748b' : '#94a3b8', letterSpacing: '0.2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mt: 0.3 }}>
            Bajaj Auto Limited · PCB Analytics
          </Typography>
        </Box>
      </Box>

      {/* ── Right ─────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" gap={1.2} sx={{ flexShrink: 0 }}>

        {/* Clock */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 0.5, 
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.03)', 
          px: 1.5, py: 0.5, borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)'}` }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
          </Typography>
          <Box sx={{ width: 4, height: 4, borderRadius: '50%', background: isDark ? '#475569' : '#94a3b8', mx: 1.2 }} />
          <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Typography>
        </Box>

        {/* Live badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, borderRadius: '999px',
          background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.09)',
          border: `1px solid ${isDark ? 'rgba(34,197,94,0.2)' : 'rgba(22,163,74,0.25)'}` }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.8)', animation: 'blink 2s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: isDark ? '#22c55e' : '#15803d', letterSpacing: '0.5px' }}>LIVE</Typography>
        </Box>

        {/* Theme toggle */}
        <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          <Box onClick={toggle} sx={{
            display: 'flex', alignItems: 'center', gap: 0.6,
            px: 1.2, py: 0.5, borderRadius: '8px', cursor: 'pointer',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.11)'}`,
            transition: 'all 0.18s ease',
            '&:hover': {
              background: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(37,99,235,0.07)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(37,99,235,0.2)'}`,
            }
          }}>
            {isDark
              ? <LightModeOutlinedIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
              : <DarkModeOutlinedIcon sx={{ fontSize: 14, color: isDark?'#64748b':'#475569' }} />
            }
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: isDark ? '#f59e0b' : '#64748b' }}>
              {isDark ? 'Light' : 'Dark'}
            </Typography>
          </Box>
        </Tooltip>

        {/* Refresh */}
        {onRefresh && (
          <Tooltip title="Refresh data">
            <IconButton onClick={doRefresh} size="small" sx={{
              color: isDark ? '#475569' : '#94a3b8',
              '&:hover': { color: isDark ? '#3b82f6' : '#2563eb', background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.07)' }
            }}>
              <RefreshIcon sx={{ fontSize: 17, transition: 'transform 0.65s ease', transform: spin ? 'rotate(360deg)' : 'none' }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        <IconButton size="small" sx={{ color: isDark ? '#475569' : '#94a3b8', '&:hover': { color: isDark ? '#f1f5f9' : '#0f172a', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' } }}>
          <Badge badgeContent={0} color="error">
            <NotificationsNoneIcon sx={{ fontSize: 18 }} />
          </Badge>
        </IconButton>

        {/* User avatar */}
        <Box onClick={e => setAnchor(e.currentTarget)} sx={{
          display: 'flex', alignItems: 'center', gap: 0.8, cursor: 'pointer',
          px: 1, py: 0.5, borderRadius: '9px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.12)'}`,
          background: isDark ? 'transparent' : '#ffffff',
          transition: 'all 0.15s ease',
          '&:hover': {
            background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(37,99,235,0.25)'}`,
          }
        }}>
          <Avatar sx={{ width: 24, height: 24, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', fontSize: '0.64rem', fontWeight: 800 }}>B</Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', lineHeight: 1.2, letterSpacing: '-0.01em' }}>Bhavesh</Typography>
            <Typography sx={{ fontSize: '0.55rem', color: isDark ? '#475569' : '#94a3b8' }}>Admin</Typography>
          </Box>
          <KeyboardArrowDownIcon sx={{ fontSize: 14, color: isDark ? '#475569' : '#94a3b8' }} />
        </Box>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}
          PaperProps={{ sx: { background: isDark ? '#111827' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.1)'}`, borderRadius: '10px', mt: 1, minWidth: 155, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(15,23,42,0.12)' } }}>
          <MenuItem onClick={() => { router.push('/'); setAnchor(null) }}
            sx={{ color: '#ef4444', gap: 1.5, fontSize: '0.8rem', '&:hover': { background: 'rgba(239,68,68,0.07)' } }}>
            <LogoutIcon sx={{ fontSize: 16 }} /> Logout
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}
