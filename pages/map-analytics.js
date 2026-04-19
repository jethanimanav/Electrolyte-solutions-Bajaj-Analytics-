import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Alert, Box, Button, Chip, Divider, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import Layout from '../components/common/Layout'
import { fetchJson } from '../lib/fetch-json'
import { useTheme } from '../lib/ThemeContext'
import IndiaMap from '../components/map/IndiaMap'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const fmt = v => Number(v || 0).toLocaleString('en-IN')
const SC = { OK: '#22c55e', NFF: '#f59e0b', WIP: '#a78bfa' }

export default function MapAnalyticsPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const skClass = isDark ? 'skeleton-dark' : 'skeleton-light'
  const B = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const CARD = isDark
    ? 'linear-gradient(180deg,rgba(13,20,34,0.97)0%,rgba(9,14,25,0.97)100%)'
    : '#ffffff'
  const inner = isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.9)'
  const TT = {
    contentStyle: { background: isDark ? '#0d1626' : '#1e293b', border: B, borderRadius: 10, color: '#f1f5f9', fontSize: '0.74rem' },
    labelStyle: { color: isDark?'#94a3b8':'#374151', fontWeight: 600 },
  }

  const [mapData, setMapData] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [path, setPath] = useState({ level: 'india' })

  const loadMap = async () => {
    setLoading(true); setError('')
    try {
      const data = await fetchJson('/api/map-data?level=india')
      setMapData(data)
      setDetail({ level: 'india', items: data.states, totalMapped: data.totalMapped })
      setPath({ level: 'india' })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const openLevel = async (nextPath) => {
    setDetailLoading(true); setPath(nextPath)
    try {
      const p = new URLSearchParams()
      p.set('level', nextPath.level)
      if (nextPath.state) p.set('state', nextPath.state)
      if (nextPath.city) p.set('city', nextPath.city)
      if (nextPath.partCode) p.set('part_code', nextPath.partCode)
      const data = await fetchJson(`/api/map-data?${p}`)
      setDetail(data)
    } catch (e) { setDetail({ level: nextPath.level, error: e.message }) }
    finally { setDetailLoading(false) }
  }

  useEffect(() => { loadMap() }, [])

  const summary = detail?.level === 'india'
    ? { total: mapData?.totalMapped||0, ok: (mapData?.states||[]).reduce((s,i)=>s+i.ok,0), nff: (mapData?.states||[]).reduce((s,i)=>s+i.nff,0), wip: (mapData?.states||[]).reduce((s,i)=>s+i.wip,0), okRate: mapData?.totalMapped ? (((mapData?.states||[]).reduce((s,i)=>s+i.ok,0)/mapData.totalMapped)*100).toFixed(1) : 0 }
    : detail?.level === 'state' ? detail.state
    : detail?.level === 'city' ? detail.city
    : detail?.summary


  const chartRows = detail?.level === 'india'
    ? (mapData?.states||[]).slice(0,10).map(i=>({name:i.state,total:i.total}))
    : detail?.level === 'state'
      ? (detail?.cities||[]).slice(0,10).map(i=>({name:i.city,total:i.total}))
      : detail?.level === 'city'
        ? (detail?.partCodes||[]).slice(0,10).map(i=>({name:i.partCode,total:i.total}))
        : (detail?.detail?.components||[]).slice(0,10).map(i=>({name:i.component,total:i.total_count}))

  return (
    <>
      <Head><title>Map Analytics — Electrolyte Bajaj</title></Head>
      <Layout onRefresh={loadMap}>
        <Box>
          {/* Header */}
          <Box sx={{ p: { xs: 2.2, md: 3 }, borderRadius: '16px', mb: 2.5, border: B, background: isDark ? 'radial-gradient(circle at top left,rgba(56,189,248,0.15),transparent 30%),radial-gradient(circle at bottom right,rgba(34,197,94,0.1),transparent 22%),linear-gradient(180deg,#0f172a 0%,#08111f 100%)' : 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 50%,#ede9fe 100%)', boxShadow: isDark ? 'none' : '0 2px 12px rgba(37,99,235,0.08)' }}>
            <Typography sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: { xs: '1.3rem', md: '1.7rem' }, fontWeight: 800, letterSpacing: '-0.5px' }}>India Map Analytics</Typography>
            <Typography sx={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '0.84rem', mt: 0.5 }}>Geographic PCB repair distribution · State → City → Part Code drill-down</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.5}>
              {[
                ['Geo-mapped records only', isDark ? 'rgba(167,139,250,0.12)' : 'rgba(109,40,217,0.08)', isDark ? '#ddd6fe' : '#6d28d9'],
                [`${fmt(mapData?.totalMapped)} mapped rows`, isDark ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.08)', isDark ? '#bae6fd' : '#0369a1'],
                [`${(mapData?.states||[]).length} states`, isDark ? 'rgba(34,197,94,0.1)' : 'rgba(22,163,74,0.08)', isDark ? '#bbf7d0' : '#166534'],
              ].map(([l,bg,c]) => (
                <Box key={l} sx={{ px: 1.2, py: 0.5, borderRadius: 999, background: bg, border: B }}>
                  <Typography sx={{ color: c, fontSize: '0.7rem', fontWeight: 600 }}>{l}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '11px', fontSize: '0.8rem' }}>{error}</Alert>}
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { background: '#3b82f6' } }} />}

          <Grid container spacing={2}>
            {/* Left: Map + Charts */}
            <Grid item xs={12} lg={8}>
              <Grid container spacing={2}>
                {/* KPI Row */}
                {[
                  ['States Covered', fmt(mapData?.states?.length), '#38bdf8'],
                  ['Mapped PCBs', fmt(mapData?.totalMapped), '#22c55e'],
                  ['Top State', mapData?.states?.[0]?.state || '—', '#a78bfa'],
                  ['Top Volume', fmt(mapData?.states?.[0]?.total), '#f59e0b'],
                ].map(([label, value, accent]) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Box sx={{ p: 2, borderRadius: '12px', border: B, background: CARD, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.08)' }}>
                      <Typography sx={{ color: accent, fontWeight: 800, fontSize: '1.4rem', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.1 }}>{value}</Typography>
                      <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mt: 0.4 }}>{label}</Typography>
                    </Box>
                  </Grid>
                ))}

                {/* India Map */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, borderRadius: '14px', border: B, background: CARD, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.08)' }}>
                    <IndiaMap states={mapData?.states||[]} activeState={path.state} onStateClick={state => openLevel({ level: 'state', state })} />
                    {/* Legend */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={2}>
                      {[['OK', '#22c55e'], ['NFF', '#f59e0b'], ['WIP', '#a78bfa']].map(([l, c]) => (
                        <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, px: 1.1, py: 0.6, borderRadius: 999, border: B, background: isDark ? 'rgba(15,23,42,0.6)' : '#fff' }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                          <Typography sx={{ color: theme.text2, fontSize: '0.7rem', fontWeight: 600 }}>{l}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Grid>

                {/* Chart */}
                <Grid item xs={12}>
                  <Box sx={{ p: 2.5, borderRadius: '14px', border: B, background: CARD, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.08)' }}>
                    <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.95rem', mb: 0.3 }}>
                      {detail?.level === 'part-code' ? 'Component Consumption' : 'Volume by ' + (detail?.level === 'india' ? 'State' : detail?.level === 'state' ? 'City' : 'Part Code')}
                    </Typography>
                    <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mb: 2 }}>
                      {detail?.level === 'india' ? 'Click a bar to drill into that state' : 'Click state or city in the list to navigate'}
                    </Typography>
                    <Box sx={{ height: 280 }}>
                      {chartRows.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartRows} layout="vertical" margin={{ top:4, right:10, left:6, bottom:4 }}>
                            <CartesianGrid horizontal={false} stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'} />
                            <XAxis type="number" tick={{ fill: theme.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" width={110} tick={{ fill: theme.text2, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip {...TT} formatter={v => [fmt(v), detail?.level === 'part-code' ? 'Usage' : 'PCBs']} />
                            <Bar dataKey="total" fill={detail?.level === 'part-code' ? '#38bdf8' : '#22c55e'} radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%" flexDirection="column" gap={1}>
                          <Typography sx={{ fontSize: '1.5rem', opacity: 0.15 }}>🗺️</Typography>
                          <Typography sx={{ color: theme.text4, fontSize: '0.76rem' }}>Upload data to see geographic distribution</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Right: Drill-down panel */}
            <Grid item xs={12} lg={4}>
              <Box sx={{ p: 2.5, minHeight: 720, borderRadius: '14px', border: B, background: CARD, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.08)' }}>
                {/* Breadcrumb */}
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap mb={2}>
                  <Button onClick={loadMap} size="small" sx={{ borderRadius: 999, border: B, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>India</Button>
                  {path.state && <Button onClick={() => openLevel({ level: 'state', state: path.state })} size="small" sx={{ borderRadius: 999, border: B, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>{path.state}</Button>}
                  {path.city && <Button onClick={() => openLevel({ level: 'city', state: path.state, city: path.city })} size="small" sx={{ borderRadius: 999, border: B, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>{path.city}</Button>}
                </Stack>

                {detailLoading ? (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ width: '60%', height: 24, borderRadius: '6px', mb: 1 }} className={skClass} />
                    <Box sx={{ width: '40%', height: 16, borderRadius: '4px', mb: 3 }} className={skClass} />
                    <Grid container spacing={1} mb={2}>
                      {[...Array(4)].map((_, i) => (
                        <Grid item xs={6} key={i}>
                          <Box sx={{ height: 50, borderRadius: '9px', background: inner }} className={skClass} />
                        </Grid>
                      ))}
                    </Grid>
                    <Stack spacing={0.9}>
                      {[...Array(5)].map((_, i) => (
                        <Box key={i} sx={{ height: 60, borderRadius: '10px', background: inner }} className={skClass} />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <>
                    <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.95rem', mb: 0.3 }}>
                      {detail?.level === 'india' ? 'State Overview' : detail?.level === 'state' ? `${path.state} — Cities` : detail?.level === 'city' ? `${path.city} — Part Codes` : `Part Code ${detail?.summary?.partCode}`}
                    </Typography>
                    <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mb: 2 }}>Click any item to drill deeper</Typography>
                  </>
                )}

                {/* Summary metrics */}
                {summary && (
                  <Grid container spacing={1} mb={2}>
                    {[['Total', summary.total, theme.text1], ['OK', summary.ok, SC.OK], ['NFF', summary.nff, SC.NFF], ['WIP', summary.wip, SC.WIP], ['OK Rate', `${summary.okRate||0}%`, '#38bdf8']].map(([l,v,c]) => (
                      <Grid item xs={6} key={l}>
                        <Box sx={{ p: 1.2, borderRadius: '9px', border: B, background: inner }}>
                          <Typography sx={{ color: c, fontWeight: 700, fontSize: '0.9rem', fontFamily: "'JetBrains Mono',monospace" }}>{l === 'OK Rate' ? v : fmt(v)}</Typography>
                          <Typography sx={{ color: theme.text3, fontSize: '0.66rem', mt: 0.2 }}>{l}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}

                <Divider sx={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.07)', mb: 1.5 }} />

                <Stack spacing={0.9} sx={{ maxHeight: 480, overflowY: 'auto', pr: 0.5 }}>
                  {/* India → States */}
                  {detail?.level === 'india' && (mapData?.states||[]).map(item => (
                    <Box key={item.state} onClick={() => openLevel({ level: 'state', state: item.state })}
                      sx={{ p: 1.3, borderRadius: '10px', border: B, background: inner, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(37,99,235,0.3)', transform: 'translateX(3px)' } }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: theme.text1, fontWeight: 600, fontSize: '0.82rem' }}>{item.state}</Typography>
                        <Typography sx={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.total)}</Typography>
                      </Box>
                      <Box display="flex" gap={1.5} mt={0.4}>
                        <Typography sx={{ color: SC.OK, fontSize: '0.68rem' }}>OK {fmt(item.ok)}</Typography>
                        <Typography sx={{ color: SC.NFF, fontSize: '0.68rem' }}>NFF {fmt(item.nff)}</Typography>
                        <Typography sx={{ color: SC.WIP, fontSize: '0.68rem' }}>WIP {fmt(item.wip)}</Typography>
                      </Box>
                    </Box>
                  ))}
                  {/* State → Cities */}
                  {detail?.level === 'state' && (detail?.cities||[]).map(item => (
                    <Box key={item.city} onClick={() => openLevel({ level: 'city', state: path.state, city: item.city })}
                      sx={{ p: 1.3, borderRadius: '10px', border: B, background: inner, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(37,99,235,0.3)', transform: 'translateX(3px)' } }}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: theme.text1, fontWeight: 600, fontSize: '0.82rem' }}>{item.city}</Typography>
                        <Typography sx={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.total)}</Typography>
                      </Box>
                      <Box display="flex" gap={1.5} mt={0.4}>
                        <Typography sx={{ color: SC.OK, fontSize: '0.68rem' }}>OK {fmt(item.ok)}</Typography>
                        <Typography sx={{ color: SC.NFF, fontSize: '0.68rem' }}>NFF {fmt(item.nff)}</Typography>
                        <Typography sx={{ color: SC.WIP, fontSize: '0.68rem' }}>WIP {fmt(item.wip)}</Typography>
                      </Box>
                    </Box>
                  ))}
                  {/* City → Part Codes */}
                  {detail?.level === 'city' && (detail?.partCodes||[]).map(item => (
                    <Box key={item.partCode} onClick={() => openLevel({ level: 'part-code', state: path.state, city: path.city, partCode: item.partCode })}
                      sx={{ p: 1.3, borderRadius: '10px', border: B, background: inner, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: isDark ? 'rgba(56,189,248,0.3)' : 'rgba(37,99,235,0.3)', transform: 'translateX(3px)' } }}>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography sx={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>Part {item.partCode}</Typography>
                          <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem' }}>{item.productDescription||'PCB'}</Typography>
                        </Box>
                        <Typography sx={{ color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.total)}</Typography>
                      </Box>
                    </Box>
                  ))}
                  {/* Part Code → Components */}
                  {detail?.level === 'part-code' && (detail?.detail?.components||[]).map(item => (
                    <Box key={item.component} sx={{ p: 1.3, borderRadius: '10px', border: B, background: inner }}>
                      <Box display="flex" justifyContent="space-between">
                        <Box>
                          <Typography sx={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.82rem', fontFamily: "'JetBrains Mono',monospace" }}>{item.component}</Typography>
                          {item.description && <Typography sx={{ color: theme.text3, fontSize: '0.66rem' }}>{item.description}</Typography>}
                        </Box>
                        <Typography sx={{ color: theme.text1, fontSize: '0.8rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.total_count)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Layout>
    </>
  )
}
