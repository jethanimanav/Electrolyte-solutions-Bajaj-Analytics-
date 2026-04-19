import { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, TablePagination, IconButton, Tooltip, TextField,
  InputAdornment, LinearProgress, Grid, Tabs, Tab, Button, Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import MemoryIcon from '@mui/icons-material/Memory'
import StorageIcon from '@mui/icons-material/Storage'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useRouter } from 'next/router'
import Layout from '../components/common/Layout'
import { useTheme } from '../lib/ThemeContext'

const fmt = v => Number(v || 0).toLocaleString('en-IN')
const rateColor = v => { const n = parseFloat(v||0); return n>=80?'#22c55e':n>=60?'#f59e0b':'#ef4444' }

export default function MasterTablePage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const B = `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)'}`
  const CARD = isDark
    ? 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)'
    : '#ffffff'
  const th = { color:theme.text4, borderBottom:B, fontSize:'0.6rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', py:1.2, px:1.5, whiteSpace:'nowrap', background:isDark?'rgba(0,0,0,0.2)':'#f8fafc' }
  const td = { color:theme.text2, borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)'}`, fontSize:'0.76rem', py:1.2, px:1.5 }

  const router = useRouter()
  const [rows, setRows]     = useState([])
  const [bom, setBom]       = useState([])
  const [search, setSearch] = useState('')
  const [bomSearch, setBomSearch] = useState('')
  const [page, setPage]     = useState(0)
  const [rpp, setRpp]       = useState(25)
  const [bomPage, setBomPage] = useState(0)
  const [bomRpp, setBomRpp] = useState(25)
  const [loading, setLoading] = useState(true)
  const [bomLoading, setBomLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch('/api/pcb-list')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRows(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setBomLoading(true)
    fetch('/api/bom?part_code=all')
      .then(r => r.json())
      .then(d => {
        if (d.bom && Array.isArray(d.bom)) setBom(d.bom)
        else if (Array.isArray(d)) setBom(d)
      })
      .catch(() => {})
      .finally(() => setBomLoading(false))
  }, [])

  const filtered = rows.filter(r =>
    !search ||
    String(r.part_code).includes(search) ||
    (r.product_description||'').toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice(page * rpp, page * rpp + rpp)

  const filteredBom = bom.filter(b =>
    !bomSearch ||
    String(b.part_code).includes(bomSearch) ||
    (b.location||'').toLowerCase().includes(bomSearch.toLowerCase()) ||
    (b.description||'').toLowerCase().includes(bomSearch.toLowerCase())
  )
  const pagedBom = filteredBom.slice(bomPage * bomRpp, bomPage * bomRpp + bomRpp)

  const totals = rows.reduce((a, r) => ({
    total: a.total + (r.total_entries||0),
    ok: a.ok + (r.ok_count||0),
    nff: a.nff + (r.nff_count||0),
    wip: a.wip + (r.wip_count||0),
  }), { total:0, ok:0, nff:0, wip:0 })

  const doExportPCB = () => {
    const csv = ['Part Code,Product,Total,OK,NFF,WIP,OK Rate,Branches',
      ...rows.map(r => `${r.part_code},"${r.product_description||''}",${r.total_entries},${r.ok_count||0},${r.nff_count||0},${r.wip_count||0},${r.ok_rate||0},${r.branch_count||0}`)
    ].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='pcb_master.csv'; a.click()
  }

  const doExportBOM = () => {
    const csv = ['Part Code,Location,Description',
      ...bom.map(b => `${b.part_code},"${b.location||''}","${(b.description||'').replace(/"/g,'""')}"`)
    ].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='bom_all.csv'; a.click()
  }

  return (
    <>
      <Head><title>Master Table — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* Header */}
          <Box mb={2.5}>
            <Typography sx={{ fontSize:'1.2rem', fontWeight:700, color:theme.text1, letterSpacing:'-0.3px', mb:0.2 }}>Master Table</Typography>
            <Typography sx={{ fontSize:'0.68rem', color:theme.text4 }}>All PCB part codes · BOM registry · Click any row for detailed drill-down</Typography>
          </Box>

          {/* Summary KPIs */}
          <Grid container spacing={2} mb={2.5}>
            {[
              { l:'Unique Part Codes', v:rows.length,   c:'#3b82f6' },
              { l:'Total Records',     v:totals.total,  c:'#f1f5f9' },
              { l:'Repair OK',         v:totals.ok,     c:'#22c55e' },
              { l:'No Fault Found',    v:totals.nff,    c:'#f59e0b' },
              { l:'Work In Progress',  v:totals.wip,    c:'#a78bfa' },
              { l:'BOM Entries',       v:bom.length,    c:'#38bdf8' },
            ].map(s => (
              <Grid item xs={6} sm={4} md={2} key={s.l}>
                <Box sx={{ p:2, borderRadius:'12px', background:CARD, border:B,
                  transition:'all 0.2s', '&:hover':{ transform:'translateY(-1px)', boxShadow:isDark?'0 4px 16px rgba(0,0,0,0.4)':'0 4px 12px rgba(0,0,0,0.1)' } }}>
                  <Typography sx={{ fontSize:'1.4rem', fontWeight:800, color:s.c, fontFamily:"'JetBrains Mono',monospace", lineHeight:1, mb:0.3 }}>{fmt(s.v)}</Typography>
                  <Typography sx={{ fontSize:'0.65rem', color:theme.text3 }}>{s.l}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Tabs: PCB List | BOM Registry */}
          <Box sx={{ borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)'}`, mb:2.5 }}>
            <Tabs value={activeTab} onChange={(e,v) => setActiveTab(v)}
              sx={{ '& .MuiTab-root':{ color:theme.text4, fontSize:'0.8rem', textTransform:'none', minWidth:0, mr:3, fontFamily:'Inter' },
                    '& .Mui-selected':{ color:theme.text1 }, '& .MuiTabs-indicator':{ background:'#3b82f6' } }}>
              <Tab icon={<MemoryIcon sx={{ fontSize:16 }} />} iconPosition="start" label={`PCB Part Codes (${rows.length})`} />
              <Tab icon={<StorageIcon sx={{ fontSize:16 }} />} iconPosition="start" label={`BOM Registry (${bom.length})`} />
            </Tabs>
          </Box>

          {/* ──── TAB 0: PCB Part Codes ──── */}
          {activeTab === 0 && (
            <Box sx={{ p:2.2, borderRadius:'12px', background:CARD, border:B }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography sx={{ fontWeight:600, fontSize:'0.85rem', color:theme.text1 }}>All PCB Part Codes</Typography>
                  <Typography sx={{ fontSize:'0.62rem', color:theme.text4 }}>{filtered.length} results · Click row to drill down</Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <TextField size="small" placeholder="Search part code or product..." value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0) }}
                    sx={{ width:240,
                      '& .MuiOutlinedInput-root':{ color:theme.text1, borderRadius:'8px', background:isDark?'rgba(255,255,255,0.04)':'#f8fafc', fontSize:'0.76rem',
                        '& fieldset':{ borderColor:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.12)' },
                        '&:hover fieldset':{ borderColor:'rgba(59,130,246,0.3)' },
                        '&.Mui-focused fieldset':{ borderColor:'#3b82f6' } },
                      '& input::placeholder':{ color:theme.text4, opacity:1 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: isDark?theme.text5:'#94a3b8', fontSize:15 }} /></InputAdornment> }} />
                  <Tooltip title="Export CSV">
                    <IconButton onClick={doExportPCB} size="small"
                      sx={{ color: isDark?theme.text5:'#94a3b8', border:B, borderRadius:'8px', p:0.7,
                        '&:hover':{ color:'#22c55e', borderColor:'rgba(34,197,94,0.3)', background:'rgba(34,197,94,0.06)' } }}>
                      <FileDownloadOutlinedIcon sx={{ fontSize:16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {loading ? (
                <LinearProgress sx={{ borderRadius:1, background:isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar':{ background:'#3b82f6' } }} />
              ) : filtered.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography sx={{ fontSize:'1.5rem', opacity:0.15, mb:0.5 }}>📋</Typography>
                  <Typography sx={{ fontWeight:500, color:theme.text4, fontSize:'0.82rem' }}>No PCB data found</Typography>
                  <Typography sx={{ fontSize:'0.68rem', color: isDark?theme.text5:'#94a3b8', mt:0.5 }}>
                    {rows.length === 0 ? 'Upload an Excel file or DB dump to populate' : 'Try a different search term'}
                  </Typography>
                  {rows.length === 0 && (
                    <Button onClick={() => router.push('/upload')} size="small" startIcon={<UploadFileIcon />}
                      sx={{ mt:2, color:'#3b82f6', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'8px', textTransform:'none', fontSize:'0.75rem' }}>
                      Go to Upload
                    </Button>
                  )}
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ borderRadius:'8px', border:`1px solid ${isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)'}` }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {['#','Part Code','Product Description','Total','OK','NFF','WIP','OK Rate','Branches',''].map(h => (
                            <TableCell key={h} sx={th}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paged.map((row, i) => {
                          const rate = parseFloat(row.ok_rate || 0)
                          const rc = rateColor(rate)
                          return (
                            <TableRow key={row.part_code}
                              onClick={() => router.push(`/master-table/${row.part_code}`)}
                              sx={{ cursor:'pointer',
                                '&:hover':{ background:isDark?'rgba(59,130,246,0.05)':'rgba(59,130,246,0.04)' },
                                background: i%2===0 ? 'transparent' : isDark?'rgba(255,255,255,0.01)':'rgba(0,0,0,0.01)' }}>
                              <TableCell sx={{ ...td, color: isDark?theme.text5:'#94a3b8', width:45 }}>{page*rpp+i+1}</TableCell>
                              <TableCell sx={{ ...td, color:'#3b82f6', fontWeight:700, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.82rem', whiteSpace:'nowrap' }}>
                                {row.part_code}
                              </TableCell>
                              <TableCell sx={{ ...td, maxWidth:220 }}>
                                <Typography sx={{ fontSize:'0.73rem', color:theme.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                  {row.product_description || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ ...td, color:theme.text1, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.total_entries)}</TableCell>
                              <TableCell sx={{ ...td, color:'#22c55e', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.ok_count)}</TableCell>
                              <TableCell sx={{ ...td, color:'#f59e0b', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.nff_count)}</TableCell>
                              <TableCell sx={{ ...td, color:'#a78bfa', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.wip_count)}</TableCell>
                              <TableCell sx={{ borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)'}`, py:1.2, px:1.5, minWidth:120 }}>
                                <Box display="flex" alignItems="center" gap={0.8}>
                                  <LinearProgress variant="determinate" value={Math.min(rate,100)}
                                    sx={{ flexGrow:1, height:5, borderRadius:2,
                                      background:isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)',
                                      '& .MuiLinearProgress-bar':{ background:rc, borderRadius:2 } }} />
                                  <Typography sx={{ fontSize:'0.65rem', color:rc, fontWeight:700, minWidth:36, fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", color:theme.text3 }}>{row.branch_count||0}</TableCell>
                              <TableCell sx={{ borderBottom:`1px solid ${isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)'}`, py:1.2, px:1.5 }}>
                                <Tooltip title="View full analysis">
                                  <IconButton size="small" sx={{ color: isDark?theme.text5:'#94a3b8', p:0.5, '&:hover':{ color:'#3b82f6', background:'rgba(59,130,246,0.1)' } }}>
                                    <OpenInNewIcon sx={{ fontSize:14 }} />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination component="div" count={filtered.length} page={page}
                    onPageChange={(e,p) => setPage(p)} rowsPerPage={rpp}
                    onRowsPerPageChange={e => { setRpp(parseInt(e.target.value)); setPage(0) }}
                    rowsPerPageOptions={[10,25,50,100]}
                    sx={{ color:theme.text4, borderTop:`1px solid ${isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)'}`, mt:0.5, fontSize:'0.75rem',
                      '& .MuiIconButton-root':{ color:theme.text4 },
                      '& .MuiSelect-icon':{ color:theme.text4 },
                      '& .MuiTablePagination-select':{ color:theme.text2 } }} />
                </>
              )}
            </Box>
          )}

          {/* ──── TAB 1: BOM Registry ──── */}
          {activeTab === 1 && (
            <Box sx={{ p:2.2, borderRadius:'12px', background:CARD, border:B }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography sx={{ fontWeight:600, fontSize:'0.85rem', color:theme.text1 }}>Bill of Materials — All Part Codes</Typography>
                  <Typography sx={{ fontSize:'0.62rem', color:theme.text4 }}>
                    {bom.length > 0
                      ? `${filteredBom.length} entries · ${[...new Set(bom.map(b=>b.part_code))].length} unique part codes`
                      : 'No BOM data — import nexscan.dump from Upload page'}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <TextField size="small" placeholder="Search part code, location..." value={bomSearch}
                    onChange={e => { setBomSearch(e.target.value); setBomPage(0) }}
                    sx={{ width:240,
                      '& .MuiOutlinedInput-root':{ color:theme.text1, borderRadius:'8px', background:isDark?'rgba(255,255,255,0.04)':'#f8fafc', fontSize:'0.76rem',
                        '& fieldset':{ borderColor:isDark?'rgba(255,255,255,0.08)':'rgba(0,0,0,0.12)' },
                        '&.Mui-focused fieldset':{ borderColor:'#3b82f6' } },
                      '& input::placeholder':{ color:theme.text4, opacity:1 } }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: isDark?theme.text5:'#94a3b8', fontSize:15 }} /></InputAdornment> }} />
                  {bom.length > 0 && (
                    <Tooltip title="Export BOM as CSV">
                      <IconButton onClick={doExportBOM} size="small"
                        sx={{ color: isDark?theme.text5:'#94a3b8', border:B, borderRadius:'8px', p:0.7,
                          '&:hover':{ color:'#22c55e', borderColor:'rgba(34,197,94,0.3)', background:'rgba(34,197,94,0.06)' } }}>
                        <FileDownloadOutlinedIcon sx={{ fontSize:16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {bomLoading ? (
                <LinearProgress sx={{ borderRadius:1, background:isDark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.07)', '& .MuiLinearProgress-bar':{ background:'#38bdf8' } }} />
              ) : bom.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography sx={{ fontSize:'2rem', opacity:0.12, mb:1 }}>📦</Typography>
                  <Typography sx={{ fontWeight:600, color:theme.text4, fontSize:'0.85rem', mb:0.5 }}>No BOM data imported yet</Typography>
                  <Typography sx={{ fontSize:'0.72rem', color: isDark?theme.text5:'#94a3b8', mb:2 }}>
                    Import the nexscan.dump PostgreSQL file to load the Bill of Materials
                  </Typography>
                  <Button onClick={() => router.push('/upload')} size="small" startIcon={<UploadFileIcon />}
                    sx={{ color:'#38bdf8', border:'1px solid rgba(56,189,248,0.3)', borderRadius:'8px', textTransform:'none', fontSize:'0.75rem', '&:hover':{ background:'rgba(56,189,248,0.06)' } }}>
                    Go to Upload → DB Dump Import
                  </Button>
                </Box>
              ) : (
                <>
                  {/* BOM stats */}
                  <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                    {[...new Set(bom.map(b => b.part_code))].slice(0, 8).map(pc => {
                      const count = bom.filter(b => b.part_code === pc).length
                      const pcRow = rows.find(r => String(r.part_code) === String(pc))
                      return (
                        <Box key={pc} onClick={() => router.push(`/master-table/${pc}`)}
                          sx={{ px:1.2, py:0.8, borderRadius:'8px', background:isDark?'rgba(56,189,248,0.06)':'rgba(56,189,248,0.06)',
                            border:'1px solid rgba(56,189,248,0.18)', cursor:'pointer',
                            '&:hover':{ border:'1px solid rgba(56,189,248,0.4)', background:'rgba(56,189,248,0.1)' } }}>
                          <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:'#38bdf8', fontFamily:"'JetBrains Mono',monospace" }}>{pc}</Typography>
                          <Typography sx={{ fontSize:'0.58rem', color:theme.text4 }}>{count} components{pcRow ? ` · ${fmt(pcRow.total_entries)} records` : ''}</Typography>
                        </Box>
                      )
                    })}
                    {[...new Set(bom.map(b => b.part_code))].length > 8 && (
                      <Box sx={{ px:1.2, py:0.8, borderRadius:'8px', background:isDark?'rgba(255,255,255,0.03)':'#f8fafc', border:B, display:'flex', alignItems:'center' }}>
                        <Typography sx={{ fontSize:'0.7rem', color:theme.text4 }}>+{[...new Set(bom.map(b=>b.part_code))].length - 8} more</Typography>
                      </Box>
                    )}
                  </Box>

                  <TableContainer sx={{ borderRadius:'8px', border:`1px solid ${isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)'}`, maxHeight:560, overflow:'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {['#','Part Code','Location / Component','Description','Source'].map(h => (
                            <TableCell key={h} sx={{ ...th, position:'sticky', top:0, zIndex:1 }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pagedBom.map((row, i) => (
                          <TableRow key={`${row.id||i}`}
                            sx={{ '&:hover':{ background:isDark?'rgba(56,189,248,0.04)':'rgba(56,189,248,0.03)' },
                              background: i%2===0 ? 'transparent' : isDark?'rgba(255,255,255,0.01)':'rgba(0,0,0,0.01)' }}>
                            <TableCell sx={{ ...td, color: isDark?theme.text5:'#94a3b8', width:45 }}>{bomPage*bomRpp+i+1}</TableCell>
                            <TableCell sx={{ ...td }}>
                              <Chip label={row.part_code} size="small"
                                onClick={() => router.push(`/master-table/${row.part_code}`)}
                                sx={{ height:20, fontSize:'0.65rem', fontWeight:700, cursor:'pointer',
                                  background:'rgba(59,130,246,0.1)', color:'#60a5fa',
                                  border:'1px solid rgba(59,130,246,0.25)',
                                  '&:hover':{ background:'rgba(59,130,246,0.2)' },
                                  fontFamily:"'JetBrains Mono',monospace" }} />
                            </TableCell>
                            <TableCell sx={{ ...td, color:'#38bdf8', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>
                              {row.location}
                            </TableCell>
                            <TableCell sx={{ ...td, color:theme.text1, maxWidth:380 }}>
                              <Typography sx={{ fontSize:'0.76rem', color:theme.text1 }}>{row.description || '—'}</Typography>
                            </TableCell>
                            <TableCell sx={{ ...td }}>
                              <Chip label={row.source || 'dump'} size="small"
                                sx={{ height:16, fontSize:'0.55rem', fontWeight:600,
                                  background: row.source === 'dump' ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)',
                                  color: row.source === 'dump' ? '#a78bfa' : '#22c55e',
                                  border:`1px solid ${row.source === 'dump' ? 'rgba(139,92,246,0.2)' : 'rgba(34,197,94,0.2)'}` }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination component="div" count={filteredBom.length} page={bomPage}
                    onPageChange={(e,p) => setBomPage(p)} rowsPerPage={bomRpp}
                    onRowsPerPageChange={e => { setBomRpp(parseInt(e.target.value)); setBomPage(0) }}
                    rowsPerPageOptions={[25,50,100,200]}
                    sx={{ color:theme.text4, borderTop:`1px solid ${isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.07)'}`, mt:0.5,
                      '& .MuiIconButton-root':{ color:theme.text4 },
                      '& .MuiSelect-icon':{ color:theme.text4 },
                      '& .MuiTablePagination-select':{ color:theme.text2 } }} />
                </>
              )}
            </Box>
          )}
        </Box>
      </Layout>
    </>
  )
}
