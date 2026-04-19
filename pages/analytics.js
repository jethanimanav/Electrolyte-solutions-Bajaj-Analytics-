import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Alert, Box, Button, Grid, MenuItem, Select, Stack, Typography, LinearProgress, Chip } from '@mui/material'
import { useRouter } from 'next/router'
import Layout from '../components/common/Layout'
import { useTheme } from '../lib/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Legend, PieChart, Pie, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts'

const STATUS_COLORS = { OK:'#22c55e', NFF:'#f59e0b', WIP:'#a78bfa' }
const COLORS = ['#38bdf8','#22c55e','#f59e0b','#a78bfa','#f97316','#ef4444','#06b6d4','#84cc16']
const fmt = v => Number(v||0).toLocaleString('en-IN')

// Card is defined inside AnalyticsPage to access theme

// Empty is defined inside AnalyticsPage

const renderPct = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * Math.PI / 180)
  const y = cy + r * Math.sin(-midAngle * Math.PI / 180)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800}>{`${(percent*100).toFixed(0)}%`}</text>
}

export default function AnalyticsPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const B = `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)'}`
  const CARD = isDark
    ? 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)'
    : '#ffffff'
  const TT = {
    contentStyle: { background: isDark ? '#0d1626' : '#1e293b', border: B, borderRadius: 12, color: theme.text1, fontSize: '0.76rem' },
    labelStyle: { color: theme.text2, fontWeight: 600 },
  }
  const router = useRouter()

  // eslint-disable-next-line react/display-name
  const Card = ({ title, sub, children, minH=300, action, onAction }) => (
    <Box sx={{ p:2.5, borderRadius:'14px', background:CARD, border:B, boxShadow: isDark?'0 1px 4px rgba(0,0,0,0.3)':'0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.07)', minHeight:minH, height:'100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography sx={{ color: isDark?theme.text1:'#0f172a', fontWeight:700, fontSize:'0.95rem' }}>{title}</Typography>
          {sub && <Typography sx={{ color: isDark?theme.text2:'#334155', fontSize:'0.72rem', mt:0.3 }}>{sub}</Typography>}
        </Box>
        {action && <Button onClick={onAction} size="small" sx={{ color:theme.text2, border:B, borderRadius:999, textTransform:'none', fontSize:'0.68rem', px:1.2 }}>{action}</Button>}
      </Box>
      {children}
    </Box>
  )

  const Empty = ({ h=200 }) => (
    <Box display="flex" alignItems="center" justifyContent="center" height={h} flexDirection="column" gap={1}>
      <Typography sx={{ fontSize:'1.4rem', opacity:0.15 }}>📊</Typography>
      <Typography sx={{ fontSize:'0.72rem', color: isDark?theme.text5:'#94a3b8' }}>No data — upload Excel to populate</Typography>
    </Box>
  )

  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ part_code:'all', status:'all' })
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    const p = new URLSearchParams()
    if (filters.part_code !== 'all') p.set('part_code', filters.part_code)
    if (filters.status    !== 'all') p.set('status',    filters.status)
    fetch(`/api/dashboard-overview?${p}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters.part_code, filters.status])

  const partCodes  = data?.filters?.partCodes || []
  const trendData  = data?.trends || []
  const components = data?.components || []
  const statusData = data?.status || []
  const topStates  = data?.topStates || []
  const topCities  = data?.topCities || []
  const partCodeRows = data?.topPartCodes || []

  // Comparison data
  const compA = partCodeRows.find(p => p.partCode === compareA)
  const compB = partCodeRows.find(p => p.partCode === compareB)
  const compData = compA && compB ? [
    { metric:'Total', [compareA]: compA.total, [compareB]: compB.total },
    { metric:'OK',    [compareA]: compA.ok,    [compareB]: compB.ok    },
    { metric:'NFF',   [compareA]: compA.nff,   [compareB]: compB.nff  },
    { metric:'WIP',   [compareA]: compA.wip,   [compareB]: compB.wip  },
  ] : []

  return (
    <>
      <Head><title>Analytics — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* Header */}
          <Box mb={2.5}>
            <Typography sx={{ fontSize:'1.2rem', fontWeight:700, color:theme.text1, letterSpacing:'-0.3px', mb:0.2 }}>Analytics & Insights</Typography>
            <Typography sx={{ fontSize:'0.68rem', color:theme.text4 }}>Deep-dive analysis · PCB comparison · Component breakdown</Typography>
          </Box>

          {/* Filters */}
          <Box sx={{ p:2, borderRadius:'12px', background:CARD, border:B, boxShadow: isDark?'none':'0 1px 3px rgba(15,23,42,0.06)', mb:2, display:'flex', gap:1.5, flexWrap:'wrap', alignItems:'center' }}>
            {[
              { label:'Part Code', key:'part_code', options:[{v:'all',l:'All Part Codes'},...partCodes.map(p=>({v:p,l:`Part ${p}`}))] },
              { label:'Status',    key:'status',    options:[{v:'all',l:'All Status'},{v:'OK',l:'✅ OK'},{v:'NFF',l:'⚠️ NFF'},{v:'WIP',l:'⏳ WIP'}] },
            ].map(f => (
              <Box key={f.key}>
                <Typography sx={{ fontSize:'0.58rem', color:theme.text4, mb:0.4, textTransform:'uppercase', letterSpacing:'0.8px' }}>{f.label}</Typography>
                <Select size="small" value={filters[f.key]} onChange={e => setFilters(p=>({...p,[f.key]:e.target.value}))}
                  sx={{ minWidth:155, color: isDark?'#e2e8f0':'#1e293b', borderRadius:'8px', background: isDark?'rgba(255,255,255,0.04)':'#fff', fontSize:'0.76rem', '.MuiOutlinedInput-notchedOutline':{ borderColor: isDark?'rgba(255,255,255,0.08)':'rgba(15,23,42,0.18)' }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(37,99,235,0.4)' }, '.MuiSvgIcon-root':{ color:theme.text4 } }}
                  MenuProps={{ PaperProps:{ sx:{ background: isDark?'#0d1626':'#fff', border:B, borderRadius:'10px', '& .MuiMenuItem-root':{ color:theme.text2, fontSize:'0.76rem', '&:hover':{ background:'rgba(59,130,246,0.08)' } } } } }}>
                  {f.options.map(o => <MenuItem key={o.v} value={o.v}>{o.l}</MenuItem>)}
                </Select>
              </Box>
            ))}
            <Button onClick={() => setFilters({part_code:'all',status:'all'})} sx={{ color:theme.text3, border:B, borderRadius:'8px', textTransform:'none', fontSize:'0.72rem', mt:2.3, px:1.5 }}>Reset</Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb:2, borderRadius:'10px' }}>{error}</Alert>}
          {loading && <LinearProgress sx={{ mb:2, borderRadius:999, background:'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar':{ background:'#3b82f6' } }} />}

          <Grid container spacing={2}>

            {/* Part Code Summary table */}
            <Grid item xs={12}>
              <Card title="Part Code Summary" sub="All PCB types — OK / NFF / WIP breakdown" minH={100}>
                {partCodeRows.length === 0 ? <Empty h={80}/> : (
                  <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:1.2 }}>
                    {partCodeRows.map(p => (
                      <Box key={p.partCode} onClick={() => router.push(`/master-table/${p.partCode}`)}
                        sx={{ p:1.5, borderRadius:'10px', border:B, background: isDark?'rgba(15,23,42,0.6)':'#f8fafc', cursor:'pointer', transition:'all 0.18s', '&:hover':{ borderColor:'rgba(59,130,246,0.3)', background:'rgba(59,130,246,0.05)' } }}>
                        <Typography sx={{ color: isDark?'#60a5fa':'#2563eb', fontWeight:700, fontSize:'0.85rem', mb:0.2 }}>Part {p.partCode}</Typography>
                        <Typography sx={{ color: isDark?theme.text3:'#475569', fontSize:'0.65rem', mb:0.8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.productDescription}</Typography>
                        <Box display="flex" gap={1}>
                          {[{l:'OK',v:p.ok,c:'#22c55e'},{l:'NFF',v:p.nff,c:'#f59e0b'},{l:'WIP',v:p.wip,c:'#a78bfa'}].map(s=>(
                            <Box key={s.l} sx={{ flex:1, textAlign:'center', p:0.5, borderRadius:'6px', background:`${s.c}10` }}>
                              <Typography sx={{ fontSize:'0.75rem', fontWeight:800, color:s.c, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(s.v)}</Typography>
                              <Typography sx={{ fontSize:'0.55rem', color:theme.text4 }}>{s.l}</Typography>
                            </Box>
                          ))}
                        </Box>
                        <Box sx={{ mt:0.8, height:3, borderRadius:2, background: isDark?'rgba(255,255,255,0.07)':'rgba(15,23,42,0.08)', overflow:'hidden' }}>
                          <Box sx={{ height:'100%', width:`${p.okRate}%`, background:'#22c55e' }} />
                        </Box>
                        <Typography sx={{ fontSize:'0.6rem', color:'#22c55e', mt:0.3 }}>{p.okRate}% OK Rate</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Part Code Comparison */}
            <Grid item xs={12} md={6}>
              <Card title="Part Code Comparison" sub="Select two part codes to compare OK / NFF / WIP side-by-side">
                <Box display="flex" gap={1.5} mb={2} flexWrap="wrap">
                  {[{label:'Part Code A', val:compareA, set:setCompareA},{label:'Part Code B', val:compareB, set:setCompareB}].map((f,i) => (
                    <Box key={i}>
                      <Typography sx={{ fontSize:'0.58rem', color:theme.text4, mb:0.4 }}>{f.label}</Typography>
                      <Select size="small" value={f.val} onChange={e => f.set(e.target.value)} displayEmpty
                        sx={{ minWidth:140, color: isDark?'#e2e8f0':'#1e293b', borderRadius:'8px', background: isDark?'rgba(255,255,255,0.04)':'#fff', fontSize:'0.76rem', '.MuiOutlinedInput-notchedOutline':{ borderColor: isDark?'rgba(255,255,255,0.08)':'rgba(15,23,42,0.18)' }, '.MuiSvgIcon-root':{ color:theme.text4 } }}
                        MenuProps={{ PaperProps:{ sx:{ background:'#0d1626', border:B, borderRadius:'10px', '& .MuiMenuItem-root':{ color:theme.text2, fontSize:'0.76rem', '&:hover':{ background:'rgba(59,130,246,0.08)' } } } } }}>
                        <MenuItem value="">Select...</MenuItem>
                        {partCodes.map(p => <MenuItem key={p} value={p}>Part {p}</MenuItem>)}
                      </Select>
                    </Box>
                  ))}
                </Box>
                {compData.length === 0 ? (
                  <Box display="flex" alignItems="center" justifyContent="center" height={200} flexDirection="column" gap={1}>
                    <Typography sx={{ fontSize:'1.2rem', opacity:0.15 }}>🔄</Typography>
                    <Typography sx={{ fontSize:'0.72rem', color: isDark?theme.text5:'#94a3b8' }}>Select two part codes above to compare</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={compData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                      <CartesianGrid vertical={false} stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} />
                      <XAxis dataKey="metric" tick={{ fill: isDark?'#94a3b8':'#374151', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: isDark?'#94a3b8':'#374151', fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...TT} />
                      <Legend wrapperStyle={{ color: isDark?theme.text2:'#374151', fontSize:11 }} />
                      <Bar dataKey={compareA} fill="#38bdf8" radius={[4,4,0,0]} name={`Part ${compareA}`} />
                      <Bar dataKey={compareB} fill="#a78bfa" radius={[4,4,0,0]} name={`Part ${compareB}`} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Grid>

            {/* Status donut */}
            <Grid item xs={12} md={6}>
              <Card title="Status Breakdown" sub="OK vs NFF vs WIP across all records">
                {statusData.filter(s=>s.value>0).length === 0 ? <Empty/> : (
                  <Box>
                    <ResponsiveContainer width="100%" height={195}>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} labelLine={false} label={renderPct} animationDuration={900}>
                          {statusData.map(e => <Cell key={e.name} fill={STATUS_COLORS[e.name]||'#64748b'} />)}
                        </Pie>
                        <Tooltip {...TT} formatter={v => [fmt(v),'Records']} />
                        <Legend wrapperStyle={{ color: isDark?'#cbd5e1':'#374151', paddingTop:12, fontSize:12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box display="flex" gap={1} justifyContent="center" mt={0.5}>
                      {statusData.map(s => {
                        const totalCount = statusData.reduce((a, x) => a + (x.value || 0), 0)
                        const pct = totalCount > 0 ? ((s.value / totalCount) * 100).toFixed(1) : 0
                        return (
                          <Box key={s.name} sx={{ px:1.5, py:0.7, borderRadius:'8px', background:`${STATUS_COLORS[s.name]}10`, border:`1px solid ${STATUS_COLORS[s.name]}25`, textAlign:'center' }}>
                            <Typography sx={{ fontSize:'1rem', fontWeight:800, color:STATUS_COLORS[s.name], fontFamily:"'JetBrains Mono',monospace" }}>{fmt(s.value)}</Typography>
                            <Typography sx={{ fontSize:'0.6rem', color:theme.text3 }}>{s.name} · {pct}%</Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* Monthly Trend */}
            <Grid item xs={12}>
              <Card title="Monthly Repair Trend" sub="OK repaired vs NFF no-fault-found vs WIP pending — by month" minH={280}>
                {trendData.length === 0 ? <Empty h={220}/> : (() => {
                  const peak = [...trendData].sort((a,b) => b.total-a.total)[0]
                  const last = trendData[trendData.length-1]
                  const prev = trendData[trendData.length-2]
                  const dir  = last && prev ? (last.total > prev.total ? '▲ Increasing' : last.total < prev.total ? '▼ Decreasing' : '→ Stable') : ''
                  return (
                    <Box>
                      <Box display="flex" gap={1.5} mb={1.5}>
                        <Chip label={`Peak: ${peak?.month} (${fmt(peak?.total)})`} size="small" sx={{ background:'rgba(56,189,248,0.1)', color:'#bae6fd', fontSize:'0.65rem', height:22 }} />
                        {dir && <Chip label={`Trend: ${dir}`} size="small" sx={{ background:'rgba(167,139,250,0.1)', color:'#ddd6fe', fontSize:'0.65rem', height:22 }} />}
                      </Box>
                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={trendData} margin={{ top:5, right:16, left:0, bottom:5 }}>
                          <CartesianGrid stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: isDark?'#94a3b8':'#374151', fontSize:10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: isDark?'#94a3b8':'#374151', fontSize:10 }} axisLine={false} tickLine={false} width={36} />
                          <Tooltip {...TT} formatter={(v,n) => [fmt(v),n]} />
                          <Legend wrapperStyle={{ color: isDark?'#cbd5e1':'#374151', fontSize:11 }} />
                          <Line type="monotone" dataKey="ok_count"  stroke="#22c55e" strokeWidth={2.5} dot={{ r:3, fill:'#22c55e' }} name="OK"  animationDuration={900} />
                          <Line type="monotone" dataKey="nff_count" stroke="#f59e0b" strokeWidth={2.5} dot={{ r:3, fill:'#f59e0b' }} name="NFF" animationDuration={1000} />
                          <Line type="monotone" dataKey="wip_count" stroke="#a78bfa" strokeWidth={2.5} dot={{ r:3, fill:'#a78bfa' }} name="WIP" animationDuration={1100} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )
                })()}
              </Card>
            </Grid>

            {/* Component Consumption — with % labels */}
            <Grid item xs={12} md={7}>
              <Card title="Component Consumption" sub="Most replaced components — sorted by frequency · Click dashboard to drill into part codes">
                {components.length === 0 ? <Empty/> : (() => {
                  const maxVal = Math.max(...components.map(c=>c.total_count),1)
                  return (
                    <Box>
                      {components.map((c,i) => {
                        const pct = ((c.total_count / maxVal)*100).toFixed(0)
                        const totalAll = components.reduce((s,x)=>s+x.total_count,0)
                        const share = totalAll > 0 ? ((c.total_count/totalAll)*100).toFixed(1) : 0
                        return (
                          <Box key={c.component} sx={{ mb:1.2, animation:`fadeUp 0.3s ease ${i*0.04}s both`, '@keyframes fadeUp':{ from:{ opacity:0, transform:'translateY(6px)' }, to:{ opacity:1, transform:'translateY(0)' } } }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.4}>
                              <Typography sx={{ fontSize:'0.78rem', fontWeight:600, color: isDark?'#e2e8f0':'#1e293b', fontFamily:"'JetBrains Mono',monospace" }}>{c.component}</Typography>
                              <Box display="flex" gap={1} alignItems="center">
                                <Typography sx={{ fontSize:'0.65rem', color:theme.text3 }}>{share}% of total</Typography>
                                <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:COLORS[i%COLORS.length], fontFamily:"'JetBrains Mono',monospace", minWidth:40, textAlign:'right' }}>{fmt(c.total_count)}</Typography>
                              </Box>
                            </Box>
                            <Box sx={{ height:6, borderRadius:3, background: isDark?'rgba(255,255,255,0.07)':'rgba(15,23,42,0.08)', overflow:'hidden' }}>
                              <Box sx={{ height:'100%', width:`${pct}%`, background:COLORS[i%COLORS.length], borderRadius:3, transition:'width 1.2s ease' }} />
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  )
                })()}
              </Card>
            </Grid>

            {/* Top States vs Cities */}
            <Grid item xs={12} md={5}>
              <Card title="Geographic Distribution" sub="Top states and cities by PCB volume" action="Open Map" onAction={() => router.push('/map-analytics')}>
                {topStates.length === 0 ? <Empty/> : (
                  <Box>
                    <Typography sx={{ fontSize:'0.65rem', color:theme.text4, mb:1, textTransform:'uppercase', letterSpacing:'0.8px' }}>Top States</Typography>
                    {topStates.slice(0,5).map((s,i) => (
                      <Box key={s.state} sx={{ mb:0.8 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.3}>
                          <Typography sx={{ fontSize:'0.75rem', color: isDark?'#e2e8f0':'#1e293b' }}>{s.state}</Typography>
                          <Typography sx={{ fontSize:'0.72rem', color:'#38bdf8', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(s.total)}</Typography>
                        </Box>
                        <Box sx={{ height:4, borderRadius:2, background: isDark?'rgba(255,255,255,0.07)':'rgba(15,23,42,0.08)', overflow:'hidden' }}>
                          <Box sx={{ height:'100%', width:`${(s.total/topStates[0].total)*100}%`, background:'#38bdf8', borderRadius:2 }} />
                        </Box>
                      </Box>
                    ))}
                    <Typography sx={{ fontSize:'0.65rem', color:theme.text4, mt:1.8, mb:1, textTransform:'uppercase', letterSpacing:'0.8px' }}>Top Cities</Typography>
                    {topCities.slice(0,5).map((c,i) => (
                      <Box key={c.city} sx={{ mb:0.8 }}>
                        <Box display="flex" justifyContent="space-between" mb={0.3}>
                          <Typography sx={{ fontSize:'0.75rem', color: isDark?'#e2e8f0':'#1e293b' }}>{c.city}</Typography>
                          <Typography sx={{ fontSize:'0.72rem', color:'#a78bfa', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.total)}</Typography>
                        </Box>
                        <Box sx={{ height:4, borderRadius:2, background: isDark?'rgba(255,255,255,0.07)':'rgba(15,23,42,0.08)', overflow:'hidden' }}>
                          <Box sx={{ height:'100%', width:`${(c.total/topCities[0].total)*100}%`, background:'#a78bfa', borderRadius:2 }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            </Grid>

          </Grid>
        </Box>
      </Layout>
    </>
  )
}
