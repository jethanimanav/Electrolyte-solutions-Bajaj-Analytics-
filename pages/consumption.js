import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Grid, Chip, Select, MenuItem,
  TextField, InputAdornment, LinearProgress, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Button
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import SwapHorizIcon from '@mui/icons-material/CompareArrows'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import Layout from '../components/common/Layout'
import { useTheme } from '../lib/ThemeContext'

const fmt = v => Number(v || 0).toLocaleString('en-IN')

// Returns gradient color based on consumption bar percentage
function barColor(pct) {
  if (pct >= 80) return '#ef4444'
  if (pct >= 50) return '#f59e0b'
  if (pct >= 25) return '#38bdf8'
  return '#22c55e'
}

export default function ConsumptionPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'

  // ── Style tokens ─────────────────────────────────────────
  const B      = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.09)'}`
  const CARD   = isDark
    ? 'linear-gradient(180deg, rgba(13,20,34,0.97) 0%, rgba(9,14,25,0.97) 100%)'
    : '#ffffff'
  const BGSUB  = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(15,23,42,0.025)'
  const TH_SX  = {
    color: isDark ? '#64748b' : '#374151',
    borderBottom: B,
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    py: 1.2, px: 1.8, whiteSpace: 'nowrap',
    background: isDark ? 'rgba(8,17,31,0.98)' : '#f8fafc',
    position: 'sticky', top: 0, zIndex: 2,
  }
  const TD_SX  = {
    color: isDark ? 'rgba(160,200,255,0.72)' : '#1e293b',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
    fontSize: '0.76rem', py: 1.3, px: 1.8,
  }

  // ── State ────────────────────────────────────────────────
  const [partCodes, setPartCodes]         = useState([])
  const [selectedPart, setSelectedPart]   = useState('all')
  const [data, setData]                   = useState(null)
  const [summary, setSummary]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState('all') // all | in_bom | not_in_bom
  const [page, setPage]                   = useState(0)
  const [rpp, setRpp]                     = useState(25)

  // ── Initial load: get part codes + global summary ────────
  useEffect(() => {
    fetch('/api/consumption')
      .then(r => r.json())
      .then(d => {
        setPartCodes(d.part_codes || [])
        setSummary(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Per-part load ────────────────────────────────────────
  useEffect(() => {
    if (selectedPart === 'all') return
    setLoading(true)
    setPage(0)
    fetch(`/api/consumption?part_code=${selectedPart}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedPart])

  // ── Derived rows ─────────────────────────────────────────
  const rows = useMemo(() => {
    if (selectedPart === 'all' || !data?.comparison) return []
    let list = data.comparison
    if (filter === 'in_bom')     list = list.filter(r => r.in_bom)
    if (filter === 'not_in_bom') list = list.filter(r => !r.in_bom)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(r =>
        String(r.component   || '').toLowerCase().includes(q) ||
        String(r.description || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [data, filter, search, selectedPart])

  const paged = rows.slice(page * rpp, page * rpp + rpp)

  // ── KPI values ───────────────────────────────────────────
  const kpis = useMemo(() => {
    if (selectedPart !== 'all' && data) {
      return {
        bom_parts:          data.bom_parts          || 0,
        consumed_types:     data.consumed_types      || 0,
        total_consumptions: data.total_consumptions  || 0,
        top_component:      data.top_component       || '—',
        pcbs_repaired:      data.total_pcbs          || 0,
      }
    }
    if (summary) {
      return {
        bom_parts:          '—',
        consumed_types:     summary.consumed_types   || 0,
        total_consumptions: summary.total_consumption || 0,
        top_component:      summary.top_component    || '—',
        pcbs_repaired:      summary.pcbs_repaired    || 0,
      }
    }
    return {}
  }, [selectedPart, data, summary])

  // ── Export CSV ───────────────────────────────────────────
  const doExport = () => {
    if (!rows.length) return
    const csv = [
      'Location,Description,Consumption Count,In BOM,Consumed,Failure Rate %',
      ...rows.map(r =>
        `${r.component},"${(r.description || '').replace(/"/g,'""')}",${r.actual_count},${r.in_bom ? 'YES' : 'NO'},${r.actual_count > 0 ? 'YES' : 'NO'},${r.failure_rate || 0}`
      ),
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `consumption_${selectedPart}.csv`
    a.click()
  }

  const KPI_CARDS = [
    { label: 'BOM Parts',          value: typeof kpis.bom_parts === 'number' ? fmt(kpis.bom_parts) : (kpis.bom_parts || '—'),          accent: '#38bdf8', icon: MemoryOutlinedIcon,    sub: 'Components in BOM' },
    { label: 'Consumed Types',      value: fmt(kpis.consumed_types),     accent: '#f59e0b', icon: CategoryOutlinedIcon,  sub: 'Unique components used' },
    { label: 'Total Consumptions',  value: fmt(kpis.total_consumptions), accent: '#a78bfa', icon: TrendingUpIcon,        sub: 'Sum of all replacements' },
    { label: 'Top Component',       value: kpis.top_component,           accent: '#facc15', icon: StarOutlinedIcon,      sub: 'Most consumed location' },
    { label: 'PCBs Repaired (OR)',  value: fmt(kpis.pcbs_repaired),      accent: '#22c55e', icon: TaskAltOutlinedIcon,   sub: 'Total repair entries' },
  ]

  return (
    <>
      <Head><title>Consumption vs Actual — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* ── Page Header ─────────────────────────────── */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{
                p: 0.9, borderRadius: '10px',
                background: 'rgba(56,189,248,0.1)',
                border: '1px solid rgba(56,189,248,0.22)',
                display: 'inline-flex',
              }}>
                <SwapHorizIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: isDark ? '#f1f5f9' : theme.text1, letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                  Consumption vs Actual
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#475569' : theme.text4, mt: 0.2 }}>
                  Compare BOM components against actual repair consumption per PCB part code
                </Typography>
              </Box>
            </Box>

            {/* Part code filter */}
            <Box display="flex" alignItems="center" gap={1}>
              {selectedPart !== 'all' && (
                <Button size="small" onClick={doExport}
                  startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    color: isDark ? '#94a3b8' : theme.text3,
                    border: B, borderRadius: '9px', textTransform: 'none',
                    fontSize: '0.72rem', fontWeight: 600,
                    '&:hover': { color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' }
                  }}>
                  Export CSV
                </Button>
              )}
              <Select
                value={selectedPart}
                onChange={e => { setSelectedPart(e.target.value); setData(null); setSearch('') }}
                size="small"
                displayEmpty
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: isDark ? '#0d1626' : '#fff',
                      border: B, borderRadius: '12px',
                      '& .MuiMenuItem-root': { fontSize: '0.76rem', color: isDark ? '#e2e8f0' : theme.text1 },
                      maxHeight: 320,
                    }
                  }
                }}
                sx={{
                  minWidth: 160, fontSize: '0.8rem', fontWeight: 700, borderRadius: '10px',
                  color: isDark ? '#e2e8f0' : theme.text1,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.18)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                  '& .MuiSvgIcon-root': { color: isDark ? '#64748b' : theme.text4 },
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                <MenuItem value="all">All Part Codes</MenuItem>
                {partCodes.map(pc => (
                  <MenuItem key={pc} value={pc} sx={{ fontFamily: "'JetBrains Mono', monospace" }}>{pc}</MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          {/* ── KPI Cards ───────────────────────────────── */}
          <Grid container spacing={1.5} mb={2.5}>
            {KPI_CARDS.map(k => (
              <Grid item xs={6} sm={4} md key={k.label}>
                <Box sx={{
                  p: 2.2, borderRadius: '14px', background: CARD, border: B,
                  transition: 'all 0.2s',
                  boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.07)',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.5)' : '0 6px 20px rgba(15,23,42,0.12)' }
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box sx={{ p: 0.7, borderRadius: '9px', background: `${k.accent}15`, border: `1px solid ${k.accent}28`, display: 'inline-flex' }}>
                      <k.icon sx={{ color: k.accent, fontSize: 18 }} />
                    </Box>
                    <Chip label={selectedPart === 'all' ? 'All' : selectedPart} size="small"
                      sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700,
                        background: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(37,99,235,0.07)',
                        color: isDark ? '#7dd3fc' : '#1d4ed8',
                        border: `1px solid ${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(37,99,235,0.2)'}`,
                        fontFamily: "'JetBrains Mono', monospace" }} />
                  </Box>
                  <Typography sx={{
                    fontSize: typeof k.value === 'string' && k.value.length > 6 ? '1rem' : '1.7rem',
                    fontWeight: 800, color: k.accent,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineHeight: 1, mb: 0.3, letterSpacing: '-0.5px',
                  }}>
                    {k.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: isDark ? '#334155' : theme.text4 }}>{k.sub}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isDark ? '#94a3b8' : theme.text3, mt: 0.1 }}>{k.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* ── Main Table Card ──────────────────────────── */}
          <Box sx={{
            borderRadius: '14px', background: CARD, border: B,
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)',
            overflow: 'hidden',
          }}>
            {/* Table Header Bar */}
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: B, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#f1f5f9' : theme.text1 }}>
                  Component Comparison{selectedPart !== 'all' ? ` — Part Code ${selectedPart}` : ' — Select a Part Code'}
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#475569' : theme.text4, mt: 0.2 }}>
                  {selectedPart === 'all'
                    ? 'Choose a part code from the dropdown to view detailed comparison'
                    : `${rows.length} component${rows.length !== 1 ? 's' : ''} · ${rows.filter(r => r.in_bom).length} in BOM · ${rows.filter(r => !r.in_bom).length} not in BOM`}
                </Typography>
              </Box>

              {selectedPart !== 'all' && (
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  {/* BOM filter chips */}
                  {['all', 'in_bom', 'not_in_bom'].map(f => (
                    <Chip key={f}
                      label={f === 'all' ? 'All' : f === 'in_bom' ? 'In BOM' : 'Not in BOM'}
                      onClick={() => { setFilter(f); setPage(0) }}
                      size="small"
                      sx={{
                        height: 24, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                        background: filter === f
                          ? (f === 'not_in_bom' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)')
                          : BGSUB,
                        color: filter === f
                          ? (f === 'not_in_bom' ? '#fca5a5' : '#7dd3fc')
                          : isDark ? '#64748b' : theme.text4,
                        border: filter === f
                          ? (f === 'not_in_bom' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(56,189,248,0.3)')
                          : B,
                        transition: 'all 0.15s',
                      }} />
                  ))}

                  {/* Search */}
                  <TextField size="small"
                    placeholder="Search component or description…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0) }}
                    sx={{
                      width: 260,
                      '& .MuiOutlinedInput-root': {
                        color: isDark ? '#e2e8f0' : theme.text1,
                        borderRadius: '9px',
                        background: isDark ? 'rgba(15,23,42,0.9)' : '#fff',
                        fontSize: '0.74rem',
                        '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.15)' },
                        '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                      },
                      '& input::placeholder': { color: isDark ? '#475569' : theme.text4, opacity: 1 },
                    }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: isDark ? '#475569' : theme.text4, fontSize: 15 }} /></InputAdornment> }}
                  />

                  {rows.length > 0 && (
                    <Chip label={`${rows.length} components`} size="small"
                      sx={{ height: 24, fontSize: '0.65rem', fontWeight: 700,
                        background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                        border: '1px solid rgba(167,139,250,0.25)' }} />
                  )}
                </Box>
              )}
            </Box>

            {/* Loading bar */}
            {loading && (
              <LinearProgress sx={{
                height: 2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)',
                '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#38bdf8,#a78bfa)' }
              }} />
            )}

            {/* Empty / prompt state */}
            {!loading && selectedPart === 'all' && (
              <Box textAlign="center" py={10}>
                <Typography sx={{ fontSize: '3rem', opacity: 0.1, mb: 1.5 }}>⚡</Typography>
                <Typography sx={{ fontWeight: 700, color: isDark ? '#475569' : theme.text4, fontSize: '1rem', mb: 0.5 }}>
                  Select a PCB Part Code
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#334155' : theme.text5 }}>
                  Use the dropdown above to view consumption vs BOM comparison
                </Typography>
              </Box>
            )}

            {/* Table */}
            {!loading && selectedPart !== 'all' && (
              <>
                <TableContainer sx={{ maxHeight: 620 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['Location', 'BOM Description', 'Consumption Count', 'Consumption Bar', 'In BOM', 'Consumed'].map(h => (
                          <TableCell key={h} sx={TH_SX}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ ...TD_SX, textAlign: 'center', py: 8, color: isDark ? '#475569' : theme.text4 }}>
                            No components match your filter
                          </TableCell>
                        </TableRow>
                      ) : paged.map((row, i) => (
                        <TableRow key={`${row.component}_${i}`}
                          sx={{
                            background: i % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.012)' : 'rgba(15,23,42,0.012)',
                            '&:hover': { background: isDark ? 'rgba(56,189,248,0.04)' : 'rgba(56,189,248,0.03)' },
                            transition: 'background 0.12s',
                          }}>

                          {/* Location */}
                          <TableCell sx={{ ...TD_SX, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                            <Typography sx={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                              {row.component}
                            </Typography>
                          </TableCell>

                          {/* Description */}
                          <TableCell sx={{ ...TD_SX, maxWidth: 280 }}>
                            <Typography sx={{ fontSize: '0.74rem', color: isDark ? '#e2e8f0' : theme.text1 }}>
                              {row.description && row.description !== row.component ? row.description : '—'}
                            </Typography>
                          </TableCell>

                          {/* Count */}
                          <TableCell sx={{ ...TD_SX, fontFamily: "'JetBrains Mono', monospace" }}>
                            <Typography sx={{
                              fontWeight: 800, fontSize: '0.9rem',
                              color: row.actual_count > 0
                                ? (row.bar_pct >= 80 ? '#ef4444' : row.bar_pct >= 50 ? '#f59e0b' : '#22c55e')
                                : (isDark ? '#334155' : theme.text5)
                            }}>
                              {row.actual_count > 0 ? fmt(row.actual_count) : '—'}
                            </Typography>
                          </TableCell>

                          {/* Consumption Bar */}
                          <TableCell sx={{ ...TD_SX, minWidth: 180 }}>
                            {row.actual_count > 0 ? (
                              <Box display="flex" alignItems="center" gap={1.2}>
                                <Box sx={{
                                  flex: 1, height: 6, borderRadius: 999,
                                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
                                  overflow: 'hidden', maxWidth: 160,
                                }}>
                                  <Box sx={{
                                    height: '100%', borderRadius: 999,
                                    width: `${row.bar_pct}%`,
                                    background: `linear-gradient(90deg, ${barColor(row.bar_pct)}, ${barColor(row.bar_pct)}cc)`,
                                    transition: 'width 0.6s ease',
                                  }} />
                                </Box>
                                <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#64748b' : theme.text4, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                  {row.bar_pct}%
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ width: 80, height: 6, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)' }} />
                            )}
                          </TableCell>

                          {/* In BOM */}
                          <TableCell sx={TD_SX}>
                            <Chip
                              label={row.in_bom ? 'YES' : 'NO'}
                              size="small"
                              sx={{
                                height: 20, fontSize: '0.62rem', fontWeight: 700,
                                background: row.in_bom ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                color: row.in_bom ? '#22c55e' : '#f87171',
                                border: `1px solid ${row.in_bom ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'}`,
                              }} />
                          </TableCell>

                          {/* Consumed */}
                          <TableCell sx={TD_SX}>
                            <Chip
                              label={row.actual_count > 0 ? 'YES' : 'NO'}
                              size="small"
                              sx={{
                                height: 20, fontSize: '0.62rem', fontWeight: 700,
                                background: row.actual_count > 0 ? 'rgba(56,189,248,0.1)' : 'rgba(100,116,139,0.1)',
                                color: row.actual_count > 0 ? '#38bdf8' : (isDark ? '#475569' : theme.text4),
                                border: `1px solid ${row.actual_count > 0 ? 'rgba(56,189,248,0.25)' : 'rgba(100,116,139,0.18)'}`,
                              }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={rows.length}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rpp}
                  onRowsPerPageChange={e => { setRpp(parseInt(e.target.value)); setPage(0) }}
                  rowsPerPageOptions={[25, 50, 100]}
                  sx={{
                    color: isDark ? '#475569' : theme.text4,
                    borderTop: B, fontSize: '0.72rem',
                    '& .MuiIconButton-root': { color: isDark ? '#475569' : theme.text4 },
                    '& .MuiSelect-icon': { color: isDark ? '#475569' : theme.text4 },
                    '& .MuiTablePagination-select': { color: isDark ? '#94a3b8' : theme.text2 },
                  }} />
              </>
            )}
          </Box>
        </Box>
      </Layout>
    </>
  )
}
