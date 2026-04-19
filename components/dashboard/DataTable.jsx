import { Box, Typography, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, TextField, InputAdornment, TablePagination } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SearchIcon from '@mui/icons-material/Search'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { useState } from 'react'
import { useRouter } from 'next/router'

const B = '1px solid rgba(148,163,184,0.14)'
const th = { color:'#475569', borderBottom:B, fontSize:'0.58rem', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', py:1.1, px:1.4, whiteSpace:'nowrap', background:'rgba(0,0,0,0.2)' }
const td = { color:'#94a3b8', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.74rem', py:1.1, px:1.4 }
const fmt = v => Number(v||0).toLocaleString('en-IN')
const rc = v => { const n = parseFloat(v||0); return n>=80?'#22c55e':n>=60?'#f59e0b':'#ef4444' }

export default function DataTable({ rows=[], search, onSearchChange, loading }) {
  const { mode } = useTheme()
  const isDark = mode === 'dark'
  const skClass = isDark ? 'skeleton-dark' : 'skeleton-light'
  const router = useRouter()
  const [page, setPage] = useState(0)
  const [rpp, setRpp] = useState(8)

  const filtered = rows.filter(r => !search || String(r.part_code).includes(search) || (r.product_description||'').toLowerCase().includes(search.toLowerCase()))
  const paged = filtered.slice(page*rpp, page*rpp+rpp)

  const doExport = () => {
    const csv = ['Part Code,Product,Total,OK,NFF,WIP,OK Rate',
      ...rows.map(r => `${r.part_code},"${r.product_description||''}",${r.total_entries},${r.ok_count||0},${r.nff_count||0},${r.wip_count||0},${r.ok_rate||0}`)
    ].join('\n')
    const a = document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='pcb_master.csv'; a.click()
  }

  const cardBg = isDark 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'

  if (loading) return (
    <Box sx={{ p:2.2, borderRadius:'20px', background: cardBg, border:B, mb:2, height: 500 }}>
       <Box sx={{ width: '30%', height: 22, borderRadius: '6px', mb: 1 }} className={skClass} />
       <Box sx={{ width: '50%', height: 14, borderRadius: '4px', mb: 3 }} className={skClass} />
      {[...Array(8)].map((_,i) => <Box key={i} sx={{ width:'100%', height:38, borderRadius:'8px', mb:1 }} className={skClass} />)}
    </Box>
  )

  return (
    <Box sx={{ p:2.2, borderRadius:'20px', background: cardBg, border:B, mb:2, boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 10px 30px -10px rgba(15, 23, 42, 0.08)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8}>
        <Box>
          <Typography sx={{ fontWeight:600, fontSize:'0.82rem', color:'#f1f5f9' }}>PCB Summary</Typography>
          <Typography sx={{ fontSize:'0.6rem', color:'#475569' }}>{filtered.length} unique part codes · Click to drill down</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <TextField size="small" placeholder="Search..." value={search} onChange={e => onSearchChange(e.target.value)}
            sx={{ width:155, '& .MuiOutlinedInput-root':{ color:'#f1f5f9', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'0.74rem', height:32, '& fieldset':{ borderColor:'rgba(255,255,255,0.08)' }, '&:hover fieldset':{ borderColor:'rgba(59,130,246,0.3)' }, '&.Mui-focused fieldset':{ borderColor:'#3b82f6' } }, '& input::placeholder':{ color:'#475569', opacity:1 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color:'#334155', fontSize:13 }} /></InputAdornment> }} />
          <Tooltip title="Export CSV">
            <IconButton onClick={doExport} size="small" sx={{ color:'#334155', border:B, borderRadius:'7px', p:0.6, '&:hover':{ color:'#22c55e' } }}>
              <FileDownloadOutlinedIcon sx={{ fontSize:15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {filtered.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography sx={{ fontSize:'0.8rem', color:'#334155' }}>No data — upload Excel to populate</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius:'8px', border:'1px solid rgba(255,255,255,0.05)' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Part Code','Product','Total','OK','NFF','WIP','OK Rate',''].map(h => <TableCell key={h} sx={th}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((row, i) => {
                  const rate = parseFloat(row.ok_rate||0)
                  const color = rc(rate)
                  return (
                    <TableRow key={row.part_code} onClick={() => router.push(`/master-table/${row.part_code}`)}
                      sx={{ cursor:'pointer', '&:hover':{ background:'rgba(59,130,246,0.05)' }, background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                      <TableCell sx={{ ...td, color:'#3b82f6', fontWeight:600, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.8rem' }}>{row.part_code}</TableCell>
                      <TableCell sx={{ ...td, maxWidth:160 }}>
                        <Typography sx={{ fontSize:'0.7rem', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.product_description||'—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...td, color:'#f1f5f9', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.total_entries)}</TableCell>
                      <TableCell sx={{ ...td, color:'#22c55e', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.ok_count)}</TableCell>
                      <TableCell sx={{ ...td, color:'#f59e0b', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.nff_count)}</TableCell>
                      <TableCell sx={{ ...td, color:'#a78bfa', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(row.wip_count)}</TableCell>
                      <TableCell sx={{ borderBottom:'1px solid rgba(255,255,255,0.04)', py:1.1, px:1.4, minWidth:100 }}>
                        <Box display="flex" alignItems="center" gap={0.7}>
                          <LinearProgress variant="determinate" value={Math.min(rate,100)} sx={{ flexGrow:1, height:3, borderRadius:2, background:'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar':{ background:color } }} />
                          <Typography sx={{ fontSize:'0.62rem', color, fontWeight:600, minWidth:30, fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom:'1px solid rgba(255,255,255,0.04)', py:1.1, px:1.4 }}>
                        <IconButton size="small" sx={{ color:'#334155', p:0.4, '&:hover':{ color:'#3b82f6' } }}>
                          <OpenInNewIcon sx={{ fontSize:13 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={filtered.length} page={page} onPageChange={(e,p)=>setPage(p)} rowsPerPage={rpp} onRowsPerPageChange={e=>{setRpp(parseInt(e.target.value));setPage(0)}} rowsPerPageOptions={[8,15,25]}
            sx={{ color:'#475569', borderTop:'1px solid rgba(255,255,255,0.05)', mt:0.5, '& .MuiIconButton-root':{ color:'#475569' }, '& .MuiSelect-icon':{ color:'#475569' } }} />
        </>
      )}
    </Box>
  )
}
