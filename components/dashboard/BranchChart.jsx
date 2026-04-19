import { Box, Typography, Skeleton } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useTheme } from '../../lib/ThemeContext'

export default function BranchChart({ data = [], loading }) {
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
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      padding: '12px 16px'
    },
    itemStyle: { color: isDark ? '#f1f5f9' : '#0f172a' },
    labelStyle: { color: isDark ? '#94a3b8' : '#334155', fontWeight: 700, marginBottom: 4 },
    formatter: (val, name) => [
      <span style={{ color: name === 'OK' ? '#22c55e' : name === 'NFF' ? '#f59e0b' : '#a78bfa', fontWeight: 800 }}>
        {Number(val).toLocaleString()} records
      </span>,
      name
    ]
  }

  const cardBg = isDark 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15, 23, 42, 0.08)'

  if (loading) return (
    <Box sx={{ p: 2.5, borderRadius: '20px', background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#fff', border: cardBorder, height: 560 }}>
      <Box sx={{ width: '35%', height: 22, borderRadius: '6px', mb: 1 }} className={skClass} />
      <Box sx={{ width: '55%', height: 16, borderRadius: '4px', mb: 3 }} className={skClass} />
      <Box sx={{ width: '100%', height: 440, borderRadius: '12px' }} className={skClass} />
    </Box>
  )

  const top = data.slice(0, 12)

  return (
    <Box sx={{ 
      p: 2.5, borderRadius: '20px', background: cardBg, border: cardBorder, height: '100%',
      boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
      transition: 'transform 0.3s ease',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text1, mb: 0.2 }}>Branch Distribution</Typography>
      <Typography sx={{ fontSize: '0.65rem', color: theme.text4, mb: 2 }}>
        {top.length > 0 ? `Top ${top.length} service locations — OK vs NFF vs WIP` : 'No branch data — upload Excel file'}
      </Typography>
      {top.length === 0 ? (
        <Box display="flex" alignItems="center" justifyContent="center" height={440} flexDirection="column" gap={1}>
          <Typography sx={{ fontSize: '2rem', opacity: 0.15 }}>🗺️</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: theme.text5, textAlign: 'center' }}>Branch data will appear after upload</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={480}>
          <BarChart data={top} barSize={18} margin={{ top: 5, right: 24, left: 0, bottom: 72 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} vertical={false} />
            <XAxis
              dataKey="branch"
              tick={{ fill: theme.text3, fontSize: 10, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
              angle={-40} textAnchor="end" interval={0}
            />
            <YAxis
              tick={{ fill: theme.text4, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false} tickLine={false}
            />
            <Tooltip {...TT} />
            <Legend
              wrapperStyle={{ paddingTop: 4, fontSize: 12 }}
              formatter={(v) => <span style={{ color: theme.text2, fontSize: 11 }}>{v}</span>}
            />
            <Bar dataKey="ok_count" name="OK" stackId="a" fill="#22c55e" animationDuration={800} />
            <Bar dataKey="nff_count" name="NFF" stackId="a" fill="#f59e0b" animationDuration={900} />
            <Bar dataKey="wip_count" name="WIP" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  )
}
