import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TablePagination, IconButton,
  Tooltip, TextField, InputAdornment, LinearProgress, Grid, Button
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useRouter } from 'next/router'
import Layout from '../components/common/Layout'
import { fetchJson } from '../lib/fetch-json'
import { useTheme } from '../lib/ThemeContext'

const fmt = v => Number(v || 0).toLocaleString('en-IN')

export default function BOMPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const router = useRouter()

  const B = `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)'}`
  const CARD = isDark
    ? 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)'
    : '#ffffff'
  const th = {
    color: isDark ? '#64748b' : '#374151',
    borderBottom: B, fontSize: '0.6rem', fontWeight: 700,
    letterSpacing: '1px', textTransform: 'uppercase',
    py: 1.2, px: 1.5, whiteSpace: 'nowrap',
    background: isDark ? 'rgba(8,17,31,0.96)' : '#f8fafc',
    position: 'sticky', top: 0, zIndex: 1,
  }
  const td = {
    color: isDark ? 'rgba(160,200,255,0.72)' : '#1e293b',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`,
    fontSize: '0.76rem', py: 1.2, px: 1.5,
  }

  const [bom, setBom]         = useState([])
  const [total, setTotal]     = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage]       = useState(0)
  const [rpp, setRpp]         = useState(50)

  const fetchData = async (p = 0, q = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: p + 1, limit: rpp })
      if (q) params.set('search', q)
      const json = await fetchJson(`/api/bom?${params}`)
      setBom(json.data || json.bom || [])
      setTotal(json.total || 0)
      setTotalPages(json.totalPages || 1)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData(page, search) }, [page, rpp])

  const handleSearch = () => { setSearch(searchInput); setPage(0); fetchData(0, searchInput) }

  // Stats derived from current loaded page + totals
  const byPartCode = useMemo(() => {
    const map = {}
    for (const b of bom) {
      const pc = String(b.part_code)
      if (!map[pc]) map[pc] = 0
      map[pc]++
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [bom])

  const totalConsumed = useMemo(() => bom.reduce((s, b) => s + (b.actual_count || 0), 0), [bom])

  const doExport = () => {
    const csv = ['Part Code,Location,Description,Actual Replacements,Source,Created',
      ...bom.map(b => `${b.part_code},"${b.location || ''}","${(b.description || '').replace(/"/g,'""')}",${b.actual_count || 0},"${b.source || 'dump'}","${b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : ''}"`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'bom_registry.csv'; a.click()
  }

  return (
    <>
      <Head><title>BOM Registry — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
            <Box sx={{ p: 0.8, borderRadius: '9px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-flex' }}>
              <ListAltOutlinedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: isDark ? '#f1f5f9' : theme.text1, letterSpacing: '-0.3px', mb: 0.1 }}>
                Bill of Materials
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#475569' : theme.text4 }}>
                All component part codes, locations, descriptions and consumption data
              </Typography>
            </Box>
          </Box>

          {/* KPI cards */}
          <Grid container spacing={1.5} mb={2.5}>
            {[
              { l: 'Total BOM Entries',   v: total,                       c: '#38bdf8' },
              { l: 'Part Codes with BOM', v: byPartCode.length,           c: '#22c55e' },
              { l: 'Total Replacements',  v: totalConsumed,               c: '#f59e0b' },
              { l: 'Avg per Part Code',   v: byPartCode.length > 0 ? Math.round(total / Math.max(byPartCode.length, 1)) : 0, c: '#a78bfa' },
            ].map(s => (
              <Grid item xs={6} sm={3} key={s.l}>
                <Box sx={{ p: 2, borderRadius: '12px', background: CARD, border: B,
                  transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)', boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(15,23,42,0.1), 0 2px 6px rgba(15,23,42,0.06)' } }}>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1, mb: 0.3 }}>
                    {fmt(s.v)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#475569' : theme.text3 }}>{s.l}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Part code quick-links */}
          {byPartCode.length > 0 && (
            <Box sx={{ p: 2, borderRadius: '12px', background: CARD, border: B, mb: 2 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: isDark ? '#475569' : '#374151', mb: 1, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Part Codes in this view
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {byPartCode.map(([pc, count]) => (
                  <Box key={pc} onClick={() => router.push(`/master-table/${pc}`)}
                    sx={{ px: 1.2, py: 0.7, borderRadius: '8px',
                      background: isDark ? 'rgba(56,189,248,0.07)' : 'rgba(56,189,248,0.06)',
                      border: isDark?'1px solid rgba(56,189,248,0.18)':'1px solid rgba(37,99,235,0.18)', cursor: 'pointer',
                      '&:hover': { border: isDark?'1px solid rgba(56,189,248,0.4)':'1px solid rgba(37,99,235,0.4)', background: isDark?'rgba(56,189,248,0.12)':'rgba(37,99,235,0.08)' },
                      transition: 'all 0.15s' }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: isDark?'#38bdf8':'#2563eb', fontFamily: "'JetBrains Mono',monospace" }}>{pc}</Typography>
                    <Typography sx={{ fontSize: '0.58rem', color: isDark ? '#475569' : theme.text4 }}>{count} components</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Main table */}
          <Box sx={{ p: 2.2, borderRadius: '12px', background: CARD, border: B, boxShadow: isDark?'0 1px 4px rgba(0,0,0,0.25)':'0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.07)' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: isDark ? '#f1f5f9' : theme.text1 }}>All BOM Entries</Typography>
                <Typography sx={{ fontSize: '0.62rem', color: isDark ? '#475569' : theme.text4 }}>
                  {fmt(total)} total entries · page {page + 1} of {totalPages}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <TextField size="small"
                  placeholder="Search part code, location, description..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                  sx={{ width: 320,
                    '& .MuiOutlinedInput-root': { color: isDark ? '#e2e8f0' : '#0f172a', borderRadius: '9px',
                      background: isDark ? 'rgba(15,23,42,0.9)' : '#ffffff', fontSize: '0.76rem',
                      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)' },
                      '&.Mui-focused fieldset': { borderColor: '#38bdf8' } },
                    '& input::placeholder': { color: isDark ? '#475569' : theme.text4, opacity: 1 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: isDark ? '#475569' : theme.text4, fontSize: 16 }} /></InputAdornment> }}
                />
                <Button variant="contained" onClick={handleSearch} size="small"
                  sx={{ borderRadius: '9px', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.76rem',
                    background: '#38bdf8', color: '#0c1a2e', '&:hover': { background: '#0ea5e9' }, textTransform: 'none' }}>
                  Search
                </Button>
                {bom.length > 0 && (
                  <Tooltip title="Export CSV">
                    <IconButton onClick={doExport} size="small"
                      sx={{ color: isDark ? '#475569' : theme.text4, border: B, borderRadius: '8px', p: 0.7,
                        '&:hover': { color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' } }}>
                      <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {loading ? (
              <Box textAlign="center" py={5}><LinearProgress sx={{ borderRadius: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)', '& .MuiLinearProgress-bar': { background: '#38bdf8' } }} /></Box>
            ) : bom.length === 0 ? (
              <Box textAlign="center" py={7}>
                <Typography sx={{ fontSize: '2.5rem', opacity: 0.12, mb: 1 }}>📦</Typography>
                <Typography sx={{ fontWeight: 600, color: isDark ? '#475569' : theme.text4, fontSize: '0.9rem', mb: 0.5 }}>
                  {search ? 'No results matched your search.' : 'No BOM data imported yet'}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#334155' : theme.text5, mb: 2 }}>
                  {search ? 'Try a different search term.' : 'Import the nexscan dump file to load Bill of Materials'}
                </Typography>
                {!search && (
                  <Button onClick={() => router.push('/upload')} size="small" startIcon={<UploadFileIcon />}
                    sx={{ color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px',
                      textTransform: 'none', fontSize: '0.75rem', '&:hover': { background: 'rgba(56,189,248,0.06)' } }}>
                    Go to Upload → Import Dump File
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}`, maxHeight: 580, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {['#','Part Code','Location / Component','Description','Actual Replacements','Source','Created',''].map(h => (
                          <TableCell key={h} sx={th}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bom.map((row, i) => (
                        <TableRow key={`${row.id || i}`}
                          sx={{ '&:hover': { background: isDark ? 'rgba(56,189,248,0.04)' : 'rgba(56,189,248,0.03)' },
                            background: i%2===0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                          <TableCell sx={{ ...td, color: isDark ? '#334155' : theme.text5, width: 45 }}>{page*rpp+i+1}</TableCell>
                          <TableCell sx={td}>
                            <Chip label={row.part_code} size="small"
                              onClick={() => router.push(`/master-table/${row.part_code}`)}
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                                background: 'rgba(59,130,246,0.1)', color: '#60a5fa',
                                border: '1px solid rgba(59,130,246,0.25)', fontFamily: "'JetBrains Mono',monospace",
                                '&:hover': { background: 'rgba(59,130,246,0.2)' } }} />
                          </TableCell>
                          <TableCell sx={{ ...td, color: '#38bdf8', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>
                            {row.location}
                          </TableCell>
                          <TableCell sx={{ ...td, color: isDark ? '#e2e8f0' : theme.text1, maxWidth: 360 }}>
                            <Typography sx={{ fontSize: '0.76rem' }}>{row.description || '—'}</Typography>
                          </TableCell>
                          <TableCell sx={{ ...td, fontFamily: "'JetBrains Mono',monospace" }}>
                            {row.actual_count > 0 ? (
                              <Box display="flex" alignItems="center" gap={0.8}>
                                <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.82rem' }}>
                                  {fmt(row.actual_count)}
                                </Typography>
                                <Box sx={{ width: 48, height: 4, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                                  <Box sx={{ height: '100%', borderRadius: 999, background: '#38bdf8',
                                    width: `${Math.min((row.actual_count / Math.max(...bom.map(b => b.actual_count || 0), 1)) * 100, 100)}%` }} />
                                </Box>
                              </Box>
                            ) : <Typography sx={{ color: isDark ? '#334155' : theme.text5, fontSize: '0.75rem' }}>—</Typography>}
                          </TableCell>
                          <TableCell sx={td}>
                            <Chip label={row.source || 'dump'} size="small"
                              sx={{ height: 16, fontSize: '0.55rem', fontWeight: 600,
                                background: (row.source === 'dump' || row.source === 'db_dump') ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)',
                                color: (row.source === 'dump' || row.source === 'db_dump') ? '#a78bfa' : '#22c55e',
                                border: `1px solid ${(row.source === 'dump' || row.source === 'db_dump') ? 'rgba(139,92,246,0.2)' : 'rgba(34,197,94,0.2)'}` }} />
                          </TableCell>
                          <TableCell sx={{ ...td, fontSize: '0.7rem', whiteSpace: 'nowrap', color: isDark ? '#475569' : theme.text4 }}>
                            {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}
                          </TableCell>
                          <TableCell sx={{ ...td, width: 36 }}>
                            <Tooltip title="View part detail">
                              <IconButton size="small" onClick={() => router.push(`/master-table/${row.part_code}`)}
                                sx={{ color: isDark ? '#334155' : theme.text5, p: 0.4,
                                  '&:hover': { color: '#38bdf8', background: 'rgba(56,189,248,0.1)' } }}>
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination component="div" count={total} page={page}
                  onPageChange={(_, p) => setPage(p)} rowsPerPage={rpp}
                  onRowsPerPageChange={e => { setRpp(parseInt(e.target.value)); setPage(0) }}
                  rowsPerPageOptions={[25, 50, 100, 200]}
                  sx={{ color: isDark ? '#475569' : theme.text4,
                    borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}`, mt: 0.5,
                    '& .MuiIconButton-root': { color: isDark ? '#475569' : theme.text4 },
                    '& .MuiSelect-icon': { color: isDark ? '#475569' : theme.text4 },
                    '& .MuiTablePagination-select': { color: isDark ? '#94a3b8' : theme.text2 } }} />
              </>
            )}
          </Box>
        </Box>
      </Layout>
    </>
  )
}
