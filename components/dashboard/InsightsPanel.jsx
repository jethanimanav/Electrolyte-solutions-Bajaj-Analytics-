import { Box, Typography, Skeleton } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { useState, useEffect } from 'react'
import { useTheme } from '../../lib/ThemeContext'

export default function InsightsPanel() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setInsights(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Box sx={{ p: 2.2, borderRadius: '12px', background: isDark ? '#111827' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, mb: 2, display: 'flex', gap: 1.5 }}>
      {[...Array(4)].map((_,i) => <Box key={i} sx={{ flex: 1, height: 72, borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', animation: 'pulse 1.5s ease infinite', '@keyframes pulse': { '0%,100%': { opacity:1 }, '50%': { opacity:0.5 } } }} />)}
    </Box>
  )
  if (insights.length === 0) return null

  return (
    <Box sx={{ p: 2, borderRadius: '12px', background: isDark ? '#111827' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`, mb: 2, boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 6px rgba(0,0,0,0.07)' }}>
      <Box display="flex" alignItems="center" gap={0.8} mb={1.5}>
        <AutoAwesomeIcon sx={{ color: '#8b5cf6', fontSize: 15 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: theme.text1, fontFamily: 'Inter' }}>Smart Insights</Typography>
        <Box sx={{ px: 0.7, py: 0.2, borderRadius: '5px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <Typography sx={{ fontSize: '0.55rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'Inter' }}>AUTO</Typography>
        </Box>
      </Box>
      <Box display="flex" gap={1.5} flexWrap="wrap">
        {insights.map((ins, i) => (
          <Box key={i} sx={{
            flex: '1 1 160px', minWidth: 145, p: 1.5, borderRadius: '9px',
            background: `${ins.color}10`,
            border: `1px solid ${ins.color}22`,
            animation: `fadeUp 0.4s ease ${i*0.07}s both`,
            '@keyframes fadeUp': { from: { opacity:0, transform:'translateY(8px)' }, to: { opacity:1, transform:'translateY(0)' } },
            transition: 'all 0.18s',
            cursor: 'pointer',
            '&:hover': { border: `1px solid ${ins.color}45`, transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${ins.color}15` }
          }}>
            <Typography sx={{ fontSize: '1.1rem', mb: 0.4 }}>{ins.icon}</Typography>
            {/* Title - was #475569 (too dark on dark bg), now proper secondary text */}
            <Typography sx={{ fontSize: '0.6rem', color: theme.text3, mb: 0.2, fontFamily: 'Inter', fontWeight: 500 }}>{ins.title}</Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: ins.color, mb: 0.2, fontFamily: "'JetBrains Mono', monospace" }}>{ins.value}</Typography>
            {/* Detail - was #334155 (too dark), now theme.text2 */}
            <Typography sx={{ fontSize: '0.6rem', color: theme.text2, fontFamily: 'Inter', lineHeight: 1.4 }}>{ins.detail}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
