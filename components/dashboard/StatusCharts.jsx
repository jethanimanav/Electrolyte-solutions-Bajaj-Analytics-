import { Box, Typography, Skeleton } from '@mui/material'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTheme } from '../../lib/ThemeContext'

const STATUS_COLORS = { OK: '#22c55e', NFF: '#f59e0b', WIP: '#a78bfa' }
const BAR_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#f97316', '#ef4444', '#06b6d4', '#84cc16']

const renderPctLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
  const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800}>{`${(percent*100).toFixed(0)}%`}</text>
}

// Center label for donut
const CenterLabel = ({ cx, cy, total }) => (
  <>
    <text x={cx} y={cy - 6} textAnchor="middle" fill="#f1f5f9" fontSize={20} fontWeight={800} fontFamily="'JetBrains Mono', monospace">
      {Number(total).toLocaleString()}
    </text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="Inter">
      total
    </text>
  </>
)

function SkCard() {
  const { mode } = useTheme()
  const isDark = mode === 'dark'
  const skClass = isDark ? 'skeleton-dark' : 'skeleton-light'
  return (
    <Box sx={{ p: 2.5, borderRadius: '18px', background: isDark ? 'rgba(15,23,42,0.4)' : '#fff', border: '1px solid rgba(255,255,255,0.05)', height: 320 }}>
      <Box sx={{ width: '40%', height: 22, borderRadius: '6px', mb: 1 }} className={skClass} />
      <Box sx={{ width: '60%', height: 16, borderRadius: '4px', mb: 3 }} className={skClass} />
      <Box sx={{ width: '100%', height: 200, borderRadius: '12px' }} className={skClass} />
    </Box>
  )
}

function Empty({ h = 200, msg = 'No data — upload Excel file' }) {
  const { mode } = useTheme()
  const isDark = mode === 'dark'
  return (
    <Box display="flex" alignItems="center" justifyContent="center" height={h} flexDirection="column" gap={1}>
      <Typography sx={{ fontSize: '1.6rem', opacity: 0.2 }}>📊</Typography>
      <Typography sx={{ fontSize: '0.72rem', color: isDark?'#64748b':'#475569', textAlign: 'center' }}>{msg}</Typography>
    </Box>
  )
}

export default function StatusCharts({ statusData = [], componentData = [], loading }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'

  const cardBg = isDark 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.08)'
  const titleColor = theme.text1
  const subColor = theme.text4

  const TT = {
    contentStyle: {
      background: isDark ? '#0d1626' : '#1e293b',
      border: `1px solid ${isDark ? 'rgba(0,180,255,0.2)' : 'rgba(255,255,255,0.2)'}`,
      borderRadius: '10px',
      color: '#f1f5f9',  // Always white text in tooltip
      fontSize: '0.75rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      padding: '10px 14px'
    },
    itemStyle: { color: '#f1f5f9' },  // Force white
    labelStyle: { color: isDark?'#94a3b8':'#374151', fontWeight: 600 },
  }

  // Calculate total for center label
  const total = statusData.reduce((sum, d) => sum + Number(d.count || 0), 0)

  if (loading) return <Box display="flex" flexDirection="column" gap={2} height="100%"><SkCard /><SkCard /></Box>

  return (
    <Box display="flex" flexDirection="column" gap={2} height="100%">

      {/* Status Donut */}
      <Box sx={{ p: 2.5, borderRadius: '14px', background: cardBg, border: cardBorder, height: '100%' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: titleColor, mb: 0.2 }}>Status Distribution</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: subColor, mb: 2 }}>OK / NFF / WIP repair outcomes</Typography>
        {statusData.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={statusData}
                cx="50%" cy="42%"
                innerRadius={58} outerRadius={95}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
                labelLine={false}
                label={renderPctLabel}
                animationBegin={0}
                animationDuration={900}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Pie>
              {/* Center total label via custom active shape trick */}
              {total > 0 && (
                <text>
                  <CenterLabel cx={0} cy={0} total={total} />
                </text>
              )}
              <Tooltip
                {...TT}
                formatter={(val, name) => [
                  <span style={{ color: STATUS_COLORS[name] || '#38bdf8', fontWeight: 700 }}>
                    {Number(val).toLocaleString()} records
                  </span>,
                  name
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                formatter={(value, entry) => (
                  <span style={{ color: theme.text2, fontSize: 12 }}>
                    {value}:{' '}
                    <strong style={{ color: theme.text1 }}>
                      {Number(entry.payload?.count || 0).toLocaleString()}
                    </strong>
                    {entry.payload?.percentage ? ` (${entry.payload.percentage}%)` : ''}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Top Components Bar */}
      <Box sx={{ p: 2.5, borderRadius: '14px', background: cardBg, border: cardBorder, height: '100%' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: titleColor, mb: 0.2 }}>Top Components</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: subColor, mb: 2 }}>Most consumed in repairs</Typography>
        {componentData.length === 0 ? <Empty /> : (
          <ResponsiveContainer width="100%" height={Math.max(200, componentData.slice(0, 10).length * 28)}>
            <BarChart
              data={componentData.slice(0, 10)}
              layout="vertical"
              barSize={11}
              margin={{ left: 4, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="2 4" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: theme.text3, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                dataKey="component"
                type="category"
                tick={{ fill: theme.text2, fontSize: 10, fontFamily: 'Inter' }}
                axisLine={false} tickLine={false}
                width={70}
                tickFormatter={v => v && v.length > 10 ? v.slice(0, 10) + '…' : v}
              />
              <Tooltip
                {...TT}
                formatter={(val) => [
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{Number(val).toLocaleString()}</span>,
                  'Count'
                ]}
                labelFormatter={(label) => (
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{label}</span>
                )}
              />
              <Bar dataKey="total_count" name="Count" radius={[0, 4, 4, 0]} animationDuration={800}>
                {componentData.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  )
}
