import { Box, Typography, Skeleton } from '@mui/material'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../../lib/ThemeContext'

export default function TrendsChart({ data = [], loading }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const skClass = isDark ? 'skeleton-dark' : 'skeleton-light'

  const TT = {
    contentStyle: {
      background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)'}`,
      borderRadius: '12px',
      color: isDark ? '#f1f5f9' : '#0f172a',
      fontSize: '0.75rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      padding: '12px 16px'
    },
    itemStyle: { color: isDark ? '#f1f5f9' : '#0f172a' },
    labelStyle: { color: isDark ? '#94a3b8' : '#334155', fontWeight: 700, marginBottom: 4 },
  }

  if (loading) return (
    <Box sx={{ p: 2.5, borderRadius: '20px', background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`, mb: 2, height: 320 }}>
      <Box sx={{ width: '40%', height: 22, borderRadius: '6px', mb: 1 }} className={skClass} />
      <Box sx={{ width: '60%', height: 16, borderRadius: '4px', mb: 3 }} className={skClass} />
      <Box sx={{ width: '100%', height: 220, borderRadius: '12px' }} className={skClass} />
    </Box>
  )
  if (!data || data.length === 0) return null

  const cardBg = isDark 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15, 23, 42, 0.08)'

  return (
    <Box sx={{
      p: 2.5, borderRadius: '20px', mb: 2,
      background: cardBg,
      border: cardBorder,
      boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text1, mb: 0.2 }}>Monthly Repair Trends</Typography>
      <Typography sx={{ fontSize: '0.65rem', color: theme.text4, mb: 2.5 }}>PCB repair volume over time — OK vs NFF vs WIP</Typography>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gOK" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gNFF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gWIP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: theme.text3, fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: theme.text4, fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip {...TT} />
          <Legend wrapperStyle={{ color: theme.text2, fontSize: 11, fontFamily: 'Inter' }} />
          <Area type="monotone" dataKey="ok_count" name="OK" stroke="#22c55e" strokeWidth={2.5} fill="url(#gOK)" dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1000} />
          <Area type="monotone" dataKey="nff_count" name="NFF" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gNFF)" dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1100} />
          <Area type="monotone" dataKey="wip_count" name="WIP" stroke="#a78bfa" strokeWidth={2} fill="url(#gWIP)" dot={{ fill: '#a78bfa', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1200} />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  )
}
