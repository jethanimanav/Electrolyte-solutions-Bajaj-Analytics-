import { useRouter } from 'next/router'
import { Box, Typography, List, ListItem, Divider, Tooltip, Badge } from '@mui/material'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { useEffect, useState } from 'react'
import { fetchJson } from '../../lib/fetch-json'
import { useTheme } from '../../lib/ThemeContext'

const NAV = [
  { label: 'Dashboard',        icon: DashboardOutlinedIcon,   path: '/dashboard',     desc: 'Overview & KPIs' },
  { label: 'Analytics',        icon: AnalyticsOutlinedIcon,   path: '/analytics',     desc: 'Deep insights' },
  { label: 'BOM Registry',     icon: ListAltOutlinedIcon,     path: '/bom',           desc: 'Bill of Materials' },
  { label: 'Data History',     icon: HistoryOutlinedIcon,     path: '/data-history',  desc: 'DB stats & import logs' },
  { label: 'Map Analytics',    icon: MapOutlinedIcon,         path: '/map-analytics', desc: 'India heatmap' },
  { label: 'Master Table',     icon: TableChartOutlinedIcon,  path: '/master-table',  desc: 'All PCB codes' },
  { label: 'Upload Data',      icon: UploadFileOutlinedIcon,  path: '/upload',        desc: 'Import Excel / Dump' },
  { label: 'Consumption',      icon: CompareArrowsIcon, path: '/consumption',  desc: 'Consumption vs Actual' },
  { label: 'Auto-Corrections', icon: PsychologyOutlinedIcon,  path: '/corrections',   desc: 'Review & fix data', badge: true },
]

export default function Sidebar() {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const [pendingCount, setPendingCount] = useState(0)
  const isActive = p => router.pathname === p || router.pathname.startsWith(p + '/')
  const isDark = mode === 'dark'

  useEffect(() => {
    fetchJson('/api/corrections?type=stats')
      .then(d => setPendingCount(parseInt(d?.flagged?.pending || 0)))
      .catch(() => {})
  }, [router.pathname])

  // ── Light/dark tokens ─────────────────────────────────────
  const sidebarBg  = isDark ? '#080e1a' : '#ffffff'
  const border     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.1)'
  const logoGrad   = isDark
    ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)'
    : 'linear-gradient(135deg,#2563eb,#1d4ed8)'

  return (
    <Box sx={{
      width: 220, minHeight: '100vh', flexShrink: 0,
      background: sidebarBg,
      borderRight: `1px solid ${border}`,
      boxShadow: isDark ? 'none' : '1px 0 0 rgba(15,23,42,0.06)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh',
    }}>

      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.2, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: '9px', background: logoGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isDark ? '0 4px 12px rgba(59,130,246,0.3)' : '0 3px 10px rgba(37,99,235,0.3)' }}>
          <MemoryOutlinedIcon sx={{ color: '#fff', fontSize: 17 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>Electrolyte</Typography>
          <Typography sx={{ fontSize: '0.58rem', color: isDark ? '#475569' : '#64748b', letterSpacing: '0.3px' }}>PCB Analytics v2</Typography>
        </Box>
      </Box>

      {/* Section label */}
      <Box sx={{ px: 2.5, pt: 2.2, pb: 0.8 }}>
        <Typography sx={{ fontSize: '0.57rem', fontWeight: 700, color: isDark ? '#334155' : '#94a3b8', letterSpacing: '1.8px', textTransform: 'uppercase' }}>Navigation</Typography>
      </Box>

      <List sx={{ px: 1.5, flexGrow: 1, pt: 0 }}>
        {NAV.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)
          const showBadge = item.badge && pendingCount > 0
          const isCorrections = item.path === '/corrections'

          const activeColor = isDark ? '#60a5fa' : '#2563eb'
          const iconColor   = active
            ? activeColor
            : isCorrections
              ? (isDark ? '#c4b5fd' : '#7c3aed')
              : (isDark ? '#475569' : '#64748b')
          const textColor   = active
            ? (isDark ? '#f1f5f9' : '#1e293b')
            : isCorrections
              ? (isDark ? '#c4b5fd' : '#6d28d9')
              : (isDark ? '#64748b' : '#475569')

          return (
            <Tooltip key={item.label} title={item.desc} placement="right" arrow
              componentsProps={{ tooltip: { sx: { background: isDark ? '#1e293b' : '#0f172a', fontSize: '0.7rem', borderRadius: '6px' } } }}>
              <ListItem onClick={() => router.push(item.path)} sx={{
                mb: 0.3, borderRadius: '9px', cursor: 'pointer', py: 0.85, px: 1.2,
                background: active
                  ? (isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)')
                  : 'transparent',
                border: `1px solid ${active
                  ? (isDark ? 'rgba(59,130,246,0.22)' : 'rgba(37,99,235,0.18)')
                  : 'transparent'}`,
                transition: 'all 0.15s ease',
                '&:hover': {
                  background: active
                    ? (isDark ? 'rgba(59,130,246,0.16)' : 'rgba(37,99,235,0.11)')
                    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)'),
                  border: `1px solid ${active
                    ? (isDark ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.28)')
                    : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.1)')}`,
                },
              }}>
                <Badge badgeContent={showBadge ? pendingCount : 0} color="warning"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.48rem', height: 13, minWidth: 13, background: isDark ? '#f59e0b' : '#d97706' } }}>
                  <Icon sx={{ fontSize: 16, color: iconColor, mr: 1.3, flexShrink: 0, transition: 'color 0.15s' }} />
                </Badge>
                <Box flexGrow={1}>
                  <Typography sx={{ fontSize: '0.79rem', fontWeight: active ? 600 : 400, color: textColor, lineHeight: 1.2, transition: 'color 0.15s', letterSpacing: active ? '-0.01em' : 'normal' }}>
                    {item.label}
                  </Typography>
                </Box>
                {active && (
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: isDark ? '#3b82f6' : '#2563eb', boxShadow: `0 0 6px ${isDark ? '#3b82f6' : '#2563eb'}`, flexShrink: 0 }} />
                )}
              </ListItem>
            </Tooltip>
          )
        })}
      </List>

      <Divider sx={{ borderColor: border, mx: 1.5 }} />
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItem sx={{ borderRadius: '9px', cursor: 'pointer', py: 0.8, px: 1.2, '&:hover': { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.04)' } }}>
          <SettingsOutlinedIcon sx={{ fontSize: 16, color: isDark ? '#334155' : '#94a3b8', mr: 1.3 }} />
          <Typography sx={{ fontSize: '0.78rem', color: isDark ? '#334155' : '#94a3b8' }}>Settings</Typography>
        </ListItem>
      </List>

      {/* Status footer */}
      <Box sx={{ px: 2.5, py: 1.8, borderTop: `1px solid ${border}`, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(15,23,42,0.02)' }}>
        <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)', animation: 'blink 2.5s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
          <Typography sx={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 700, letterSpacing: '0.3px' }}>System Online</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.57rem', color: isDark ? '#334155' : '#94a3b8' }}>© 2025 Bajaj Auto Limited</Typography>
      </Box>
    </Box>
  )
}
