import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Button, Grid, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Alert,
  Tabs, Tab, Divider, TextField, InputAdornment, Paper
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import StorageIcon from '@mui/icons-material/Storage'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import BugReportIcon from '@mui/icons-material/BugReport'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DeleteIcon from '@mui/icons-material/Delete'
import DownloadIcon from '@mui/icons-material/Download'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SearchIcon from '@mui/icons-material/Search'
import TableChartIcon from '@mui/icons-material/TableChart'
import MemoryIcon from '@mui/icons-material/Memory'
import EngineeringIcon from '@mui/icons-material/Engineering'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import InventoryIcon from '@mui/icons-material/Inventory'
import AssessmentIcon from '@mui/icons-material/Assessment'
import Layout from '../components/common/Layout'
import { useTheme } from '../lib/ThemeContext'

const fmt = v => Number(v || 0).toLocaleString('en-IN')

// ── Shared style helpers ──────────────────────────────────────
function useCardStyles() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  return {
    isDark, theme,
    CARD: isDark
      ? 'linear-gradient(180deg,rgba(13,20,34,0.97)0%,rgba(9,14,25,0.97)100%)'
      : '#ffffff',
    B: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)'}`,
    shadow: isDark
      ? '0 2px 12px rgba(0,0,0,0.3)'
      : '0 1px 3px rgba(15,23,42,0.06),0 4px 12px rgba(15,23,42,0.08)',
    th: {
      color: isDark ? '#475569' : '#374151',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.1)'}`,
      fontSize: '0.59rem', fontWeight: 700, letterSpacing: '1px',
      textTransform: 'uppercase', py: 1.2, px: 1.5,
      background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc',
      whiteSpace: 'nowrap',
    },
    td: {
      color: isDark ? '#94a3b8' : '#1e293b',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.06)'}`,
      fontSize: '0.74rem', py: 1.1, px: 1.5,
    },
    accent: isDark ? '#3b82f6' : '#2563eb',
  }
}

// ── Status chip ───────────────────────────────────────────────
function StatusChip({ status }) {
  const { isDark } = useCardStyles()
  const s = (status || 'WIP').toUpperCase()
  const map = {
    OK:  { bg: isDark ? 'rgba(34,197,94,0.12)'  : 'rgba(22,163,74,0.1)',   color: isDark ? '#22c55e' : '#15803d', border: isDark ? 'rgba(34,197,94,0.25)'  : 'rgba(22,163,74,0.25)' },
    NFF: { bg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.1)',   color: isDark ? '#f59e0b' : '#b45309', border: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(217,119,6,0.25)' },
    WIP: { bg: isDark ? 'rgba(167,139,250,0.12)': 'rgba(124,58,237,0.1)',  color: isDark ? '#a78bfa' : '#6d28d9', border: isDark ? 'rgba(167,139,250,0.25)': 'rgba(124,58,237,0.25)' },
  }
  const c = map[s] || map.WIP
  return <Chip label={s} size="small" sx={{ height: 19, fontSize: '0.59rem', fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.border}`, '& .MuiChip-label': { px: 0.9 } }} />
}

// ── Drop zone ─────────────────────────────────────────────────
function DropZone({ onFile, color, accept, label, hint }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef(null)
  const { isDark } = useCardStyles()
  return (
    <Box
      onDrop={e => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]) }}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onClick={() => ref.current?.click()}
      sx={{
        border: `2px dashed ${drag ? color : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.15)'}`,
        borderRadius: '14px', p: 5, textAlign: 'center', cursor: 'pointer',
        background: drag ? `${color}0a` : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)',
        transition: 'all 0.2s ease',
        '&:hover': { border: `2px dashed ${color}70`, background: `${color}06` },
      }}>
      <UploadFileIcon sx={{ fontSize: 44, color: drag ? color : isDark ? '#334155' : '#cbd5e1', mb: 1.5, transition: 'color 0.2s' }} />
      <Typography sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#374151', mb: 0.4, fontSize: '0.87rem' }}>
        {drag ? '↓ Drop it here' : label}
      </Typography>
      <Typography sx={{ fontSize: '0.7rem', color: isDark ? '#334155' : '#94a3b8', mb: 2.2 }}>{hint}</Typography>
      <Button variant="outlined" size="small"
        sx={{ color, borderColor: `${color}60`, borderRadius: '8px', textTransform: 'none', fontSize: '0.73rem', fontWeight: 600, '&:hover': { background: `${color}0a`, borderColor: color } }}>
        Browse Files
      </Button>
      <input ref={ref} type="file" accept={accept} onChange={e => onFile(e.target.files[0])} style={{ display: 'none' }} />
    </Box>
  )
}

function FileCard({ file, color, onRemove, children }) {
  const { isDark, theme, B } = useCardStyles()
  return (
    <Box sx={{ p: 1.8, borderRadius: '12px', background: `${color}08`, border: `1px solid ${color}28`, mb: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={children ? 1.5 : 0}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: '9px', background: `${color}15`, border: `1px solid ${color}25`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <InsertDriveFileIcon sx={{ color, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.83rem', color: isDark ? '#f1f5f9' : '#1e293b' }}>{file.name}</Typography>
            <Typography sx={{ fontSize: '0.64rem', color: isDark ? '#475569' : '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · ready to process</Typography>
          </Box>
        </Box>
        <Button size="small" onClick={onRemove} startIcon={<DeleteIcon sx={{ fontSize: 14 }} />}
          sx={{ color: '#ef4444', fontSize: '0.7rem', textTransform: 'none', '&:hover': { background: 'rgba(239,68,68,0.07)' } }}>Remove</Button>
      </Box>
      {children}
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// DUMP DATA VIEWER — shows ALL extracted data with section tabs
// ════════════════════════════════════════════════════════════════
function DumpDataViewer({ data }) {
  const { isDark, theme, CARD, B, th, td, shadow, accent } = useCardStyles()
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('summary')

  if (!data) return null

  const {
    bom = [], engineers = [], pcb_records = [], components = [],
    status_entries = [], pcb_master = [], branches = [], summary = {}
  } = data

  const sq = search.toLowerCase()
  const filtBOM  = bom.filter(r => !sq || JSON.stringify(r).toLowerCase().includes(sq))
  const filtPCB  = pcb_records.filter(r => !sq || JSON.stringify(r).toLowerCase().includes(sq))
  const filtComp = components.filter(r => !sq || JSON.stringify(r).toLowerCase().includes(sq))
  const filtEng  = engineers.filter(r => !sq || r.name?.toLowerCase().includes(sq))

  const statusCounts = pcb_records.reduce((a, r) => { const s = (r.status||'WIP').toUpperCase(); a[s]=(a[s]||0)+1; return a }, {})
  const pcCounts = pcb_records.reduce((a, r) => { if (r.part_code) a[r.part_code]=(a[r.part_code]||0)+1; return a }, {})

  const SECTIONS = [
    { key:'summary',    label:'Summary',     count: null,                icon: AssessmentIcon },
    { key:'pcb',        label:'PCB Records', count: pcb_records.length,  icon: MemoryIcon },
    { key:'bom',        label:'BOM',         count: bom.length,          icon: AccountTreeIcon },
    { key:'components', label:'Consumption', count: components.length,   icon: InventoryIcon },
    { key:'engineers',  label:'Engineers',   count: engineers.length,    icon: EngineeringIcon },
    { key:'branches',   label:'Branches',    count: branches.length,     icon: LocalShippingIcon },
    { key:'master',     label:'PCB Master',  count: pcb_master.length,   icon: TableChartIcon },
  ]

  const KPI_DATA = [
    { label:'PCB Records',   value: pcb_records.length, color:'#2563eb', bg: isDark?'rgba(59,130,246,0.12)':'rgba(37,99,235,0.08)', icon:'🔧' },
    { label:'BOM Components',value: bom.length,          color:'#16a34a', bg: isDark?'rgba(34,197,94,0.12)' :'rgba(22,163,74,0.08)',  icon:'📋' },
    { label:'Consumption',   value: components.length,   color:'#d97706', bg: isDark?'rgba(245,158,11,0.12)':'rgba(217,119,6,0.08)', icon:'🔩' },
    { label:'Engineers',     value: engineers.length,    color:'#0284c7', bg: isDark?'rgba(56,189,248,0.12)':'rgba(2,132,199,0.08)',  icon:'👷' },
    { label:'Branches',      value: branches.length,     color:'#7c3aed', bg: isDark?'rgba(124,58,237,0.12)':'rgba(124,58,237,0.08)',icon:'📍' },
    { label:'PCB Master',    value: pcb_master.length,   color:'#db2777', bg: isDark?'rgba(219,39,119,0.12)':'rgba(219,39,119,0.08)',icon:'⚡' },
  ]

  return (
    <Box>
      {/* Header + search */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: isDark ? '#f1f5f9' : '#0f172a', letterSpacing: '-0.02em' }}>
            Dump File Preview
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: isDark ? '#475569' : '#64748b', mt: 0.2 }}>
            All data parsed from your dump — read-only, nothing saved to DB
          </Typography>
        </Box>
        <TextField size="small" placeholder="Search across all data…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: isDark ? '#475569' : '#94a3b8' }} /></InputAdornment> }}
          sx={{ width: 260, '& .MuiInputBase-root': { height: 34, fontSize: '0.78rem', background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', borderRadius: '9px', boxShadow: isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.06)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.14)' }, '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent } }} />
      </Box>

      {/* Section tabs */}
      <Box display="flex" gap={0.8} mb={2.5} flexWrap="wrap">
        {SECTIONS.map(s => {
          const Icon = s.icon; const active = section === s.key
          return (
            <Button key={s.key} size="small" startIcon={<Icon sx={{ fontSize: 13 }} />} onClick={() => setSection(s.key)}
              sx={{
                textTransform: 'none', fontSize: '0.73rem', fontWeight: active ? 700 : 500,
                borderRadius: '8px', px: 1.4, py: 0.65,
                background: active ? (isDark ? `rgba(59,130,246,0.14)` : 'rgba(37,99,235,0.09)') : (isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'),
                color: active ? accent : isDark ? '#64748b' : '#64748b',
                border: `1px solid ${active ? (isDark ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.25)') : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.1)')}`,
                boxShadow: active ? 'none' : (isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.05)'),
                '&:hover': { background: active ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.12)') : (isDark ? 'rgba(255,255,255,0.07)' : '#f8fafc') },
              }}>
              {s.label}
              {s.count != null && (
                <Box component="span" sx={{ ml: 0.7, px: 0.8, py: 0.05, borderRadius: '20px', background: active ? accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'), color: active ? '#fff' : (isDark ? '#64748b' : '#64748b'), fontSize: '0.57rem', fontWeight: 800, lineHeight: '18px' }}>
                  {s.count}
                </Box>
              )}
            </Button>
          )
        })}
      </Box>

      {/* ── SUMMARY ──────────────────────────────────────────── */}
      {section === 'summary' && (
        <Grid container spacing={2}>
          {KPI_DATA.map(k => (
            <Grid item xs={6} sm={4} md={2} key={k.label}>
              <Box sx={{ p: 2, borderRadius: '12px', background: CARD, border: B, boxShadow: shadow, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{k.icon}</Typography>
                <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{fmt(k.value)}</Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: isDark ? '#94a3b8' : '#374151', mt: 0.6 }}>{k.label}</Typography>
              </Box>
            </Grid>
          ))}

          {pcb_records.length > 0 && (
            <>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.2, borderRadius: '12px', background: CARD, border: B, boxShadow: shadow }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: isDark ? '#f1f5f9' : '#0f172a', mb: 1.5 }}>Status Distribution</Typography>
                  {Object.entries(statusCounts).map(([s, c]) => {
                    const pct = Math.round((c / pcb_records.length) * 100)
                    const color = s === 'OK' ? '#16a34a' : s === 'NFF' ? '#d97706' : '#7c3aed'
                    return (
                      <Box key={s} display="flex" alignItems="center" gap={1.5} mb={1.2}>
                        <Box sx={{ width: 28, textAlign: 'center' }}><StatusChip status={s} /></Box>
                        <Box flexGrow={1}>
                          <Box sx={{ height: 7, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)', overflow: 'hidden' }}>
                            <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.6s ease' }} />
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{c}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#475569' : '#94a3b8', minWidth: 32 }}>{pct}%</Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2.2, borderRadius: '12px', background: CARD, border: B, boxShadow: shadow }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: isDark ? '#f1f5f9' : '#0f172a', mb: 1.5 }}>Top Part Codes</Typography>
                  {Object.entries(pcCounts).sort(([,a],[,b]) => b-a).slice(0, 6).map(([pc, c]) => {
                    const max = Math.max(...Object.values(pcCounts))
                    return (
                      <Box key={pc} display="flex" alignItems="center" gap={1.5} mb={1}>
                        <Typography sx={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono',monospace", color: isDark ? '#94a3b8' : '#374151', minWidth: 70 }}>{pc}</Typography>
                        <Box flexGrow={1}>
                          <Box sx={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)', overflow: 'hidden' }}>
                            <Box sx={{ width: `${(c/max)*100}%`, height: '100%', borderRadius: 3, background: accent }} />
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: accent, minWidth: 28, textAlign: 'right' }}>{c}</Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Grid>
            </>
          )}

          {components.length > 0 && (
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2.2, borderRadius: '12px', background: CARD, border: B, boxShadow: shadow }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: isDark ? '#f1f5f9' : '#0f172a', mb: 1.5 }}>Top Consumed Components</Typography>
                {[...components].sort((a,b) => (b.count||0)-(a.count||0)).slice(0,8).map((c, i) => (
                  <Box key={i} display="flex" justifyContent="space-between" alignItems="center" mb={0.8}>
                    <Box>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>{c.component}</Typography>
                      <Typography sx={{ fontSize: '0.62rem', color: isDark ? '#475569' : '#94a3b8' }}>Part: {c.part_code}</Typography>
                    </Box>
                    <Chip label={`×${c.count || 0}`} size="small" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.09)', color: isDark ? '#f59e0b' : '#92400e', border: isDark ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(217,119,6,0.2)' }} />
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── PCB RECORDS ─────────────────────────────────────── */}
      {section === 'pcb' && (
        <Box sx={{ borderRadius: '12px', border: B, overflow: 'hidden', boxShadow: shadow }}>
          {filtPCB.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center', background: CARD }}>
              <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🔧</Typography>
              <Typography sx={{ color: isDark ? '#475569' : '#94a3b8', fontSize: '0.84rem' }}>
                {pcb_records.length === 0
                  ? 'No PCB repair records in this dump. These come from Excel upload.'
                  : 'No matches for your search.'}
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Sr','DC No','Branch','Part Code','Product','Status','Defect','Engineer','Repair Date'].map(h => (
                        <TableCell key={h} sx={th}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtPCB.slice(0, 300).map((r, i) => (
                      <TableRow key={i} sx={{ background: isDark ? (i%2?'rgba(255,255,255,0.015)':'transparent') : (i%2?'#f9fafb':'#fff'), '&:hover': { background: isDark ? 'rgba(59,130,246,0.06)' : 'rgba(37,99,235,0.04)' } }}>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8' }}>{r.sr_no||'—'}</TableCell>
                        <TableCell sx={{ ...td, fontWeight: 600, color: isDark?'#f1f5f9':'#1e293b' }}>{r.dc_no||'—'}</TableCell>
                        <TableCell sx={td}>{r.branch||'—'}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: isDark?'#60a5fa':'#2563eb' }}>{r.part_code||'—'}</TableCell>
                        <TableCell sx={{ ...td, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.product_description||'—'}</TableCell>
                        <TableCell sx={{ ...td, py:0.7 }}><StatusChip status={r.status} /></TableCell>
                        <TableCell sx={td}>{r.defect||'—'}</TableCell>
                        <TableCell sx={td}>{r.engg_name||'—'}</TableCell>
                        <TableCell sx={{ ...td, fontSize:'0.68rem', whiteSpace:'nowrap' }}>{r.repair_date?new Date(r.repair_date).toLocaleDateString('en-IN'):'—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ px: 2, py: 1, borderTop: B, background: isDark?'rgba(0,0,0,0.2)':'#f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Typography sx={{ fontSize:'0.66rem', color: isDark?'#475569':'#94a3b8' }}>
                  Showing {Math.min(300, filtPCB.length)} of {filtPCB.length} records {search && `(filtered from ${pcb_records.length})`}
                </Typography>
                {filtPCB.length > 300 && <Typography sx={{ fontSize:'0.66rem', color: isDark?'#475569':'#94a3b8' }}>Use search to narrow results</Typography>}
              </Box>
            </>
          )}
        </Box>
      )}

      {/* ── BOM ─────────────────────────────────────────────── */}
      {section === 'bom' && (
        <Box sx={{ borderRadius: '12px', border: B, overflow: 'hidden', boxShadow: shadow }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Part Code','Location / Component','Description','Source'].map(h => <TableCell key={h} sx={th}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtBOM.slice(0, 400).map((r, i) => (
                  <TableRow key={i} sx={{ background: isDark ? (i%2?'rgba(255,255,255,0.015)':'transparent') : (i%2?'#f9fafb':'#fff'), '&:hover': { background: isDark?'rgba(34,197,94,0.05)':'rgba(22,163,74,0.04)' } }}>
                    <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#16a34a' }}>{r.part_code}</TableCell>
                    <TableCell sx={{ ...td, fontWeight:600, color: isDark?'#f1f5f9':'#1e293b' }}>{r.location}</TableCell>
                    <TableCell sx={td}>{r.description||'—'}</TableCell>
                    <TableCell sx={{ ...td, py:0.7 }}>
                      <Chip label={r.source||'dump'} size="small" sx={{ height:18, fontSize:'0.57rem', fontWeight:700, background: isDark?'rgba(56,189,248,0.1)':'rgba(2,132,199,0.08)', color: isDark?'#38bdf8':'#0369a1', border: isDark?'1px solid rgba(56,189,248,0.2)':'1px solid rgba(2,132,199,0.2)', '& .MuiChip-label':{px:0.8} }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ px:2, py:1, borderTop:B, background: isDark?'rgba(0,0,0,0.2)':'#f8fafc' }}>
            <Typography sx={{ fontSize:'0.66rem', color: isDark?'#475569':'#94a3b8' }}>Showing {Math.min(400, filtBOM.length)} of {bom.length} BOM entries</Typography>
          </Box>
        </Box>
      )}

      {/* ── COMPONENT / CONSUMPTION ──────────────────────────── */}
      {section === 'components' && (
        <Box>
          {filtComp.length === 0 ? (
            <Box sx={{ p:5, textAlign:'center', background:CARD, border:B, borderRadius:'12px', boxShadow:shadow }}>
              <Typography sx={{ fontSize:'1.5rem', mb:1 }}>🔩</Typography>
              <Typography sx={{ color: isDark?'#475569':'#94a3b8', fontSize:'0.84rem' }}>
                {components.length===0 ? 'No component/consumption data in this dump file.' : 'No results.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ borderRadius:'12px', border:B, overflow:'hidden', boxShadow:shadow }}>
              <TableContainer sx={{ maxHeight:500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Part Code','Component','Description','Count / Usage'].map(h => <TableCell key={h} sx={th}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...filtComp].sort((a,b)=>(b.count||0)-(a.count||0)).slice(0,300).map((r, i) => (
                      <TableRow key={i} sx={{ background: isDark?(i%2?'rgba(255,255,255,0.015)':'transparent'):(i%2?'#f9fafb':'#fff'), '&:hover': { background: isDark?'rgba(245,158,11,0.05)':'rgba(217,119,6,0.04)' } }}>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#d97706' }}>{r.part_code}</TableCell>
                        <TableCell sx={{ ...td, fontWeight:600, color: isDark?'#f1f5f9':'#1e293b' }}>{r.component}</TableCell>
                        <TableCell sx={td}>{r.description||'—'}</TableCell>
                        <TableCell sx={{ ...td, py:0.7 }}>
                          {r.count > 0 && (
                            <Chip label={`×${r.count}`} size="small" sx={{ height:20, fontSize:'0.65rem', fontWeight:800, background: isDark?'rgba(245,158,11,0.12)':'rgba(217,119,6,0.1)', color: isDark?'#f59e0b':'#92400e', border: isDark?'1px solid rgba(245,158,11,0.25)':'1px solid rgba(217,119,6,0.22)', '& .MuiChip-label':{px:0.9} }} />
                          )}
                          {!r.count && <Typography sx={{ fontSize:'0.7rem', color: isDark?'#334155':'#94a3b8' }}>—</Typography>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ px:2, py:1, borderTop:B, background: isDark?'rgba(0,0,0,0.2)':'#f8fafc' }}>
                <Typography sx={{ fontSize:'0.66rem', color: isDark?'#475569':'#94a3b8' }}>Showing {Math.min(300,filtComp.length)} of {components.length} component entries</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ── ENGINEERS ────────────────────────────────────────── */}
      {section === 'engineers' && (
        <Grid container spacing={1.5}>
          {filtEng.map((eng, i) => (
            <Grid item xs={6} sm={4} md={3} key={eng.id||i}>
              <Box sx={{ p:1.8, borderRadius:'12px', background:CARD, border:B, boxShadow:shadow, display:'flex', alignItems:'center', gap:1.3, transition:'all 0.15s', '&:hover': { transform:'translateY(-1px)', boxShadow: isDark?'0 6px 20px rgba(0,0,0,0.4)':'0 6px 16px rgba(15,23,42,0.1)' } }}>
                <Box sx={{ width:38, height:38, borderRadius:'10px', background:`linear-gradient(135deg,${isDark?'#38bdf8,#0284c7':'#3b82f6,#1d4ed8'})`, display:'grid', placeItems:'center', flexShrink:0, boxShadow: isDark?'0 3px 10px rgba(56,189,248,0.2)':'0 3px 10px rgba(37,99,235,0.25)' }}>
                  <Typography sx={{ color:'#fff', fontWeight:800, fontSize:'0.85rem' }}>{(eng.name||'?')[0].toUpperCase()}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize:'0.79rem', fontWeight:600, color: isDark?'#f1f5f9':'#1e293b' }}>{eng.name}</Typography>
                  <Typography sx={{ fontSize:'0.6rem', color: isDark?'#475569':'#94a3b8', fontFamily:"'JetBrains Mono',monospace" }}>ID #{eng.id}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
          {filtEng.length === 0 && (
            <Grid item xs={12}><Box sx={{ p:4, textAlign:'center', background:CARD, border:B, borderRadius:'12px' }}><Typography sx={{ color: isDark?'#475569':'#94a3b8', fontSize:'0.84rem' }}>No engineers found</Typography></Box></Grid>
          )}
        </Grid>
      )}

      {/* ── BRANCHES ─────────────────────────────────────────── */}
      {section === 'branches' && (
        <Grid container spacing={1.5}>
          {branches.length > 0 ? branches.map((b, i) => (
            <Grid item xs={6} sm={4} md={3} key={b.name||i}>
              <Box sx={{ p:1.8, borderRadius:'12px', background:CARD, border:B, boxShadow:shadow, display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.15s', '&:hover': { transform:'translateY(-1px)' } }}>
                <Box>
                  <Typography sx={{ fontSize:'0.79rem', fontWeight:600, color: isDark?'#f1f5f9':'#1e293b' }}>{b.name}</Typography>
                  <Typography sx={{ fontSize:'0.62rem', color: isDark?'#475569':'#94a3b8' }}>{b.count} records</Typography>
                </Box>
                <Typography sx={{ fontSize:'1rem', fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color: isDark?'#a78bfa':'#7c3aed' }}>{b.count}</Typography>
              </Box>
            </Grid>
          )) : (
            <Grid item xs={12}><Box sx={{ p:4, textAlign:'center', background:CARD, border:B, borderRadius:'12px' }}><Typography sx={{ color: isDark?'#475569':'#94a3b8', fontSize:'0.84rem' }}>Branch data is derived from PCB records. Upload with PCB data to see branches.</Typography></Box></Grid>
          )}
        </Grid>
      )}

      {/* ── PCB MASTER ───────────────────────────────────────── */}
      {section === 'master' && (
        <Box>
          {pcb_master.length === 0 ? (
            <Box sx={{ p:5, textAlign:'center', background:CARD, border:B, borderRadius:'12px', boxShadow:shadow }}>
              <Typography sx={{ fontSize:'1.5rem', mb:1 }}>⚡</Typography>
              <Typography sx={{ color: isDark?'#475569':'#94a3b8', fontSize:'0.84rem' }}>No PCB master entries in this dump.</Typography>
            </Box>
          ) : (
            <Box sx={{ borderRadius:'12px', border:B, overflow:'hidden', boxShadow:shadow }}>
              <TableContainer sx={{ maxHeight:500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['ID','Part Code','Product Description','Total Entries'].map(h => <TableCell key={h} sx={th}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pcb_master.map((r, i) => (
                      <TableRow key={i} sx={{ background: isDark?(i%2?'rgba(255,255,255,0.015)':'transparent'):(i%2?'#f9fafb':'#fff'), '&:hover': { background: isDark?'rgba(219,39,119,0.05)':'rgba(219,39,119,0.04)' } }}>
                        <TableCell sx={{ ...td, color: isDark?'#475569':'#94a3b8', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem' }}>{r.id}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: isDark?'#f472b6':'#db2777' }}>{r.part_code}</TableCell>
                        <TableCell sx={{ ...td, fontWeight:500 }}>{r.product_description||'—'}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: accent }}>{fmt(r.total_entries||0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function UploadPage() {
  const { isDark, theme, CARD, B, th, td, shadow, accent } = useCardStyles()

  const [tab, setTab] = useState(0)
  const [excelFile, setExcelFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [excelResult, setExcelResult] = useState(null)
  const [excelError, setExcelError] = useState('')
  const [dumpFile, setDumpFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState('')
  const [importLog, setImportLog] = useState([])
  const [previewFile, setPreviewFile] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [previewError, setPreviewError] = useState('')
  const [inspectFile, setInspectFile] = useState(null)
  const [inspecting, setInspecting] = useState(false)
  const [inspectResult, setInspectResult] = useState(null)
  const [inspectError, setInspectError] = useState('')
  const [cleaning, setCleaning] = useState(false)
  const cleanRef = useRef(null)
  const [history, setHistory] = useState([])

  const loadHistory = () => { fetch('/api/upload-history').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setHistory(d) }).catch(()=>{}) }
  useEffect(() => { loadHistory() }, [excelResult, importResult])
  const addLog = msg => setImportLog(l => [...l, `${new Date().toLocaleTimeString()} — ${msg}`])

  const handleExcelUpload = async () => {
    if (!excelFile) return
    setUploading(true); setProgress(0); setExcelError('')
    try {
      const fd = new FormData(); fd.append('file', excelFile)
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = e => setProgress(Math.round((e.loaded*100)/e.total))
      xhr.onload = () => {
        try { const r = JSON.parse(xhr.responseText); if (xhr.status===200) setExcelResult(r); else setExcelError(r.error||'Upload failed') } catch { setExcelError('Invalid response') }
        setUploading(false)
      }
      xhr.onerror = () => { setExcelError('Network error'); setUploading(false) }
      xhr.open('POST', '/api/upload'); xhr.send(fd)
    } catch(e) { setExcelError(e.message); setUploading(false) }
  }

  const handleDumpImport = async () => {
    if (!dumpFile) return
    setImporting(true); setImportError(''); setImportLog([])
    addLog('Starting import…')
    try {
      const fd = new FormData(); fd.append('file', dumpFile); if (replaceMode) fd.append('replace','true')
      addLog('Uploading and parsing dump file…')
      const res = await fetch('/api/import-dump', { method:'POST', body:fd })
      const data = await res.json()
      if (res.ok) {
        const imp = data.imported || {}
        addLog(`✅ BOM: ${imp.bom||0} | Engineers: ${imp.engineers||0} | PCB Records: ${imp.pcb_records||0} | Components: ${imp.components||0}`)
        if (data.status_breakdown) {
          const sb = data.status_breakdown
          addLog(`✅ Status - OK: ${sb.ok||0} | NFF: ${sb.nff||0} | WIP: ${sb.wip||0}`)
        }
        if (data.tables_found?.length > 0) addLog(`📂 Tables found: ${data.tables_found.join(', ')}`)
        setImportResult(data)
      } else {
        addLog(`❌ ${data.error}`)
        if (data.tables_found?.length > 0) addLog(`📊 Tables in dump: ${data.tables_found.join(', ')}`)
        setImportError(data.error||'Import failed')
      }
    } catch(e) { addLog(`❌ ${e.message}`); setImportError(e.message) }
    setImporting(false)
  }

  const handleDumpPreview = async () => {
    if (!previewFile) return
    setPreviewing(true); setPreviewError(''); setPreviewData(null)
    try {
      const fd = new FormData(); fd.append('file', previewFile)
      const res = await fetch('/api/debug-dump', { method:'POST', body:fd })
      const raw = await res.json()
      if (!res.ok) { setPreviewError(raw.error||'Preview failed'); setPreviewing(false); return }

      // Build structured viewer data
      const branchMap = {}
      const allPCB = raw.pcb_sample || []
      allPCB.forEach(r => { if (r.branch) branchMap[r.branch] = (branchMap[r.branch]||0)+1 })
      const branches = Object.entries(branchMap).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)

      setPreviewData({
        bom: raw.bom_sample || [],
        engineers: raw.engineers || [],
        pcb_records: allPCB,
        components: raw.component_sample || [],
        status_entries: raw.status_sample || [],
        pcb_master: raw.pcb_master || [],
        branches,
        summary: raw.summary || {},
      })
    } catch(e) { setPreviewError(e.message) }
    setPreviewing(false)
  }

  const handleInspect = async () => {
    if (!inspectFile) return
    setInspecting(true); setInspectError(''); setInspectResult(null)
    try {
      const fd = new FormData(); fd.append('file', inspectFile)
      const res = await fetch('/api/debug-dump', { method:'POST', body:fd })
      const data = await res.json()
      if (res.ok) setInspectResult(data); else setInspectError(data.error||'Inspection failed')
    } catch(e) { setInspectError(e.message) }
    setInspecting(false)
  }

  const handleClean = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setCleaning(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/clean-excel', { method:'POST', body:fd })
      if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=file.name.replace(/\.(xlsx|xlsm)$/i,'_cleaned.xlsx'); a.click(); URL.revokeObjectURL(url) }
      else { const d = await res.json(); alert(d.error||'Cleaning failed') }
    } catch(e) { alert(e.message) }
    setCleaning(false); e.target.value=''
  }

  const TABS = ['📊  Excel Upload','🗄️  Import Dump','👁️  Preview Dump','🔬  Inspect File','✨  Data Cleaner']

  const inputSx = { width:'100%', '& .MuiInputBase-root': { height:36, fontSize:'0.78rem', background: isDark?'rgba(255,255,255,0.04)':'#fff', borderRadius:'9px', boxShadow: isDark?'none':'0 1px 2px rgba(15,23,42,0.05)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark?'rgba(255,255,255,0.1)':'rgba(15,23,42,0.16)' }, '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accent } }

  return (
    <>
      <Head><title>Upload Data — Electrolyte Dashboard</title></Head>
      <Layout>
        <Box sx={{ minHeight:'100vh', background: isDark?'#0b0f19':'#f5f7fa', p:{ xs:2, md:3 } }}>

          {/* Page header */}
          <Box mb={3}>
            <Typography sx={{ fontWeight:800, fontSize:'1.45rem', color: isDark?'#f1f5f9':'#0f172a', lineHeight:1.2, letterSpacing:'-0.02em' }}>
              Upload & Import Data
            </Typography>
            <Typography sx={{ fontSize:'0.8rem', color: isDark?'#475569':'#64748b', mt:0.5 }}>
              Import repair records via Excel or preview every table in a DB dump file before committing
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ mb:3, borderBottom: `1px solid ${isDark?'rgba(255,255,255,0.08)':'rgba(15,23,42,0.1)'}` }}>
            <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons="auto"
              sx={{ '& .MuiTab-root':{ textTransform:'none', fontSize:'0.81rem', fontWeight:600, minHeight:44, px:2.2, color: isDark?'#475569':'#64748b', letterSpacing:'-0.01em' }, '& .Mui-selected':{ color:`${accent} !important` }, '& .MuiTabs-indicator':{ background:accent, height:2.5, borderRadius:2 } }}>
              {TABS.map(t => <Tab key={t} label={t} />)}
            </Tabs>
          </Box>

          {/* ══ TAB 0 — Excel Upload ══ */}
          {tab===0 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Box sx={{ p:2.8, borderRadius:'16px', background:CARD, border:'1px solid rgba(22,163,74,0.2)', boxShadow: isDark?shadow:'0 1px 3px rgba(22,163,74,0.06),0 4px 12px rgba(22,163,74,0.06)' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.6}>
                    <Box sx={{ width:32, height:32, borderRadius:'9px', background:'rgba(22,163,74,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}><UploadFileIcon sx={{ color:'#16a34a', fontSize:17 }} /></Box>
                    <Box>
                      <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color: isDark?'#f1f5f9':'#0f172a', letterSpacing:'-0.01em' }}>Excel File Upload</Typography>
                      <Typography sx={{ fontSize:'0.63rem', color: isDark?'#475569':'#64748b' }}>Import PCB repair records from Bajaj consolidated data</Typography>
                    </Box>
                    <Chip label="RECORDS" size="small" sx={{ ml:'auto', height:18, fontSize:'0.55rem', fontWeight:700, background: isDark?'rgba(34,197,94,0.1)':'rgba(22,163,74,0.1)', color: isDark?'#22c55e':'#15803d', border: isDark?'1px solid rgba(34,197,94,0.25)':'1px solid rgba(22,163,74,0.25)' }} />
                  </Box>
                  <Divider sx={{ my:1.8, borderColor: isDark?'rgba(255,255,255,0.07)':'rgba(22,163,74,0.1)' }} />
                  {!excelFile ? (
                    <DropZone accept=".xlsx,.xlsm" label="Drag & drop your Excel file here" hint=".xlsx or .xlsm · Max 50 MB" color="#16a34a" onFile={setExcelFile} />
                  ) : (
                    <FileCard file={excelFile} color="#16a34a" onRemove={()=>{setExcelFile(null);setExcelResult(null);setExcelError('')}}>
                      {uploading && (
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={0.6}>
                            <Typography sx={{ fontSize:'0.68rem', color: isDark?'#64748b':'#64748b' }}>Processing rows…</Typography>
                            <Typography sx={{ fontSize:'0.68rem', color:'#16a34a', fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{progress}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius:2, height:5, background: isDark?'rgba(255,255,255,0.07)':'rgba(22,163,74,0.12)', '& .MuiLinearProgress-bar':{ background:'#16a34a', borderRadius:2 } }} />
                        </Box>
                      )}
                      {excelResult && (
                        <Box sx={{ p:1.8, borderRadius:'10px', background: isDark?'rgba(34,197,94,0.07)':'rgba(22,163,74,0.06)', border: isDark?'1px solid rgba(34,197,94,0.2)':'1px solid rgba(22,163,74,0.2)' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={1.2}><CheckCircleIcon sx={{ color:'#16a34a', fontSize:18 }} /><Typography sx={{ fontWeight:700, fontSize:'0.85rem', color: isDark?'#22c55e':'#15803d' }}>Upload Successful!</Typography></Box>
                          <Box display="flex" gap={3} flexWrap="wrap">
                            {[{l:'Total',v:excelResult.total_rows,c: isDark?'#60a5fa':'#2563eb'},{l:'OK',v:excelResult.ok_rows,c:'#16a34a'},{l:'NFF',v:excelResult.nff_rows,c: isDark?'#f59e0b':'#d97706'},{l:'WIP',v:excelResult.wip_rows,c: isDark?'#a78bfa':'#7c3aed'}].map(x => (
                              <Box key={x.l} textAlign="center">
                                <Typography sx={{ fontSize:'1.2rem', fontWeight:800, color:x.c, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{fmt(x.v)}</Typography>
                                <Typography sx={{ fontSize:'0.6rem', color: isDark?'#475569':'#94a3b8', mt:0.3, fontWeight:600 }}>{x.l}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                      {excelError && <Alert severity="error" sx={{ borderRadius:'10px', fontSize:'0.75rem' }}>{excelError}</Alert>}
                      {!uploading && !excelResult && (
                        <Button fullWidth variant="contained" onClick={handleExcelUpload} startIcon={<UploadFileIcon />}
                          sx={{ py:1.3, borderRadius:'10px', fontWeight:700, background:'#16a34a', textTransform:'none', fontSize:'0.85rem', boxShadow:'0 3px 10px rgba(22,163,74,0.3)', '&:hover':{ background:'#15803d', boxShadow:'0 5px 16px rgba(22,163,74,0.4)' } }}>
                          Upload & Process Excel
                        </Button>
                      )}
                    </FileCard>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ p:2.4, borderRadius:'16px', background:CARD, border:B, boxShadow:shadow }}>
                  <Typography sx={{ fontWeight:700, fontSize:'0.84rem', color: isDark?'#f1f5f9':'#0f172a', mb:1.4, letterSpacing:'-0.01em' }}>Supported Excel Formats</Typography>
                  {[{label:'New Format (.xlsx)',desc:'Single sheet "Bajaj_consolidated_data" with all 30 columns',color:'#16a34a'},{label:'Old Format (.xlsm)',desc:'Multiple sheets per PCB code (974290, 971039, etc.)',color:'#2563eb'}].map(x => (
                    <Box key={x.label} sx={{ p:1.4, borderRadius:'9px', background: isDark?`${x.color}08`:`${x.color}07`, border: isDark?`1px solid ${x.color}20`:`1px solid ${x.color}20`, mb:1 }}>
                      <Typography sx={{ fontSize:'0.73rem', fontWeight:700, color:x.color, mb:0.2 }}>{x.label}</Typography>
                      <Typography sx={{ fontSize:'0.64rem', color: isDark?'#64748b':'#64748b' }}>{x.desc}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my:1.6, borderColor: isDark?'rgba(255,255,255,0.06)':'rgba(15,23,42,0.08)' }} />
                  <Box sx={{ p:1.2, borderRadius:'8px', background: isDark?'rgba(59,130,246,0.07)':'rgba(37,99,235,0.05)', border: isDark?'1px solid rgba(59,130,246,0.15)':'1px solid rgba(37,99,235,0.12)' }}>
                    <Typography sx={{ fontSize:'0.68rem', color: isDark?'#93c5fd':'#3b82f6', fontWeight:600, mb:0.2 }}>💡 Recommended Workflow</Typography>
                    <Typography sx={{ fontSize:'0.65rem', color: isDark?'#475569':'#64748b', lineHeight:1.6 }}>Import the DB dump first to load BOM data, then upload Excel for repair records. BOM data enriches component descriptions.</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* ══ TAB 1 — DB Dump Import ══ */}
          {tab===1 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Box sx={{ p:2.8, borderRadius:'16px', background:CARD, border:'1px solid rgba(139,92,246,0.2)', boxShadow: isDark?shadow:'0 1px 3px rgba(124,58,237,0.05),0 4px 12px rgba(124,58,237,0.06)' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.6}>
                    <Box sx={{ width:32, height:32, borderRadius:'9px', background:'rgba(124,58,237,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}><StorageIcon sx={{ color:'#7c3aed', fontSize:17 }} /></Box>
                    <Box>
                      <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color: isDark?'#f1f5f9':'#0f172a', letterSpacing:'-0.01em' }}>Import DB Dump</Typography>
                      <Typography sx={{ fontSize:'0.63rem', color: isDark?'#475569':'#64748b' }}>Load full database schema including BOM, PCB records & consumption</Typography>
                    </Box>
                    <Chip label="ALL DATA" size="small" sx={{ ml:'auto', height:18, fontSize:'0.55rem', fontWeight:700, background:'rgba(124,58,237,0.1)', color: isDark?'#a78bfa':'#6d28d9', border:'1px solid rgba(124,58,237,0.25)' }} />
                  </Box>
                  <Divider sx={{ my:1.8, borderColor: isDark?'rgba(255,255,255,0.07)':'rgba(124,58,237,0.1)' }} />
                  {!dumpFile ? (
                    <DropZone accept=".dump,.sql,.backup,.pg,.pgdump" label="Drag & drop .dump or .sql file" hint="PostgreSQL custom (.dump) or plain SQL (.sql) · Max 500 MB" color="#7c3aed" onFile={f=>{ setDumpFile(f); setImportResult(null); setImportError(''); setImportLog([]) }} />
                  ) : (
                    <Box>
                      <FileCard file={dumpFile} color="#7c3aed" onRemove={()=>{ setDumpFile(null); setImportResult(null); setImportError(''); setImportLog([]) }}>
                        <Box sx={{ p:1.2, borderRadius:'9px', cursor:'pointer', background: replaceMode ? (isDark?'rgba(239,68,68,0.07)':'rgba(220,38,38,0.05)') : (isDark?'rgba(34,197,94,0.06)':'rgba(22,163,74,0.05)'), border: replaceMode ? (isDark?'1px solid rgba(239,68,68,0.2)':'1px solid rgba(220,38,38,0.15)') : (isDark?'1px solid rgba(34,197,94,0.15)':'1px solid rgba(22,163,74,0.15)') }} onClick={()=>setReplaceMode(!replaceMode)}>
                          <Box display="flex" alignItems="center" gap={1.2}>
                            <Box sx={{ width:16, height:16, borderRadius:'4px', border:`2px solid ${replaceMode?'#ef4444':'#16a34a'}`, background: replaceMode?'#ef4444':'transparent', display:'grid', placeItems:'center', flexShrink:0, transition:'all 0.15s' }}>
                              {replaceMode && <Typography sx={{ color:'#fff', fontSize:'0.55rem', fontWeight:900, lineHeight:1 }}>✓</Typography>}
                            </Box>
                            <Typography sx={{ fontSize:'0.72rem', fontWeight: replaceMode?700:400, color: replaceMode ? (isDark?'#fca5a5':'#dc2626') : (isDark?'#94a3b8':'#374151') }}>
                              {replaceMode ? '⚠ Replace mode — will overwrite existing BOM data' : 'Append/update BOM (safe, recommended)'}
                            </Typography>
                          </Box>
                        </Box>
                      </FileCard>
                      {importLog.length > 0 && (
                        <Box sx={{ mb:2, p:1.4, borderRadius:'9px', background: isDark?'rgba(0,0,0,0.3)':'rgba(15,23,42,0.03)', border:B, maxHeight:110, overflow:'auto' }}>
                          {importLog.map((l,i) => <Typography key={i} sx={{ fontSize:'0.63rem', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.9, color: l.includes('✅')?'#16a34a': l.includes('❌')?'#dc2626': isDark?'#475569':'#64748b' }}>{l}</Typography>)}
                          {importing && <LinearProgress sx={{ mt:1, borderRadius:1, height:3, background:'rgba(124,58,237,0.1)', '& .MuiLinearProgress-bar':{ background:'#7c3aed' } }} />}
                        </Box>
                      )}
                      {importResult && (
                        <Box sx={{ p:1.8, borderRadius:'10px', background: isDark?'rgba(34,197,94,0.07)':'rgba(22,163,74,0.06)', border: isDark?'1px solid rgba(34,197,94,0.2)':'1px solid rgba(22,163,74,0.18)', mb:2 }}>
                          <Box display="flex" alignItems="center" gap={1} sx={{ mb:1.2 }}><CheckCircleIcon sx={{ color:'#16a34a', fontSize:18 }} /><Typography sx={{ fontWeight:700, fontSize:'0.86rem', color: isDark?'#22c55e':'#15803d' }}>Import Successful!</Typography></Box>
                          <Grid container spacing={1} mt={0.5}>
                            {[
                              {l:'BOM',            v:(importResult.imported?.bom          || importResult.bom_imported          || 0), c:'#7c3aed'},
                              {l:'Engineers',       v:(importResult.imported?.engineers     || importResult.engineers_imported     || 0), c:'#0284c7'},
                              {l:'PCB Records',     v:(importResult.imported?.pcb_records   || importResult.pcb_records_imported   || 0), c:'#16a34a'},
                              {l:'Components',      v:(importResult.imported?.components    || importResult.components_imported    || 0), c:'#d97706'},
                              {l:'OK',              v:(importResult.status_breakdown?.ok  || 0), c:'#22c55e'},
                              {l:'NFF',             v:(importResult.status_breakdown?.nff || 0), c:'#f59e0b'},
                              {l:'WIP',             v:(importResult.status_breakdown?.wip || 0), c:'#a78bfa'},
                              {l:'Part Codes',      v:(importResult.imported?.pcb_master   || importResult.raw_parsed?.pcb_master  || 0), c:'#38bdf8'},
                            ].map(x => (
                              <Grid item xs={6} sm={3} key={x.l}><Box textAlign="center"><Typography sx={{ fontSize:'1.05rem', fontWeight:800, color:x.c, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(x.v)}</Typography><Typography sx={{ fontSize:'0.58rem', color: isDark?'#475569':'#94a3b8', fontWeight:600 }}>{x.l}</Typography></Box></Grid>
                            ))}
                          </Grid>
                          {importResult.tables_found?.length > 0 && (
                            <Typography sx={{ mt:1.2, fontSize:'0.62rem', color: isDark?'#334155':'#94a3b8' }}>
                              Tables found: {importResult.tables_found.join(', ')}
                            </Typography>
                          )}
                        </Box>
                      )}
                      {importError && <Alert severity="error" sx={{ mb:2, borderRadius:'10px', fontSize:'0.75rem' }}>{importError}</Alert>}
                      {!importing && !importResult && (
                        <Button fullWidth variant="contained" onClick={handleDumpImport} startIcon={<StorageIcon />}
                          sx={{ py:1.3, borderRadius:'10px', fontWeight:700, textTransform:'none', fontSize:'0.85rem', background:'#7c3aed', boxShadow:'0 3px 10px rgba(124,58,237,0.3)', '&:hover':{ background:'#6d28d9', boxShadow:'0 5px 16px rgba(124,58,237,0.4)' } }}>
                          Import to Database
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ p:2.4, borderRadius:'16px', background:CARD, border:B, boxShadow:shadow }}>
                  <Typography sx={{ fontWeight:700, fontSize:'0.84rem', color: isDark?'#f1f5f9':'#0f172a', mb:1.4 }}>{"What's extracted from the dump"}</Typography>
                  {[{icon:'✅',title:'Bill of Materials (BOM)',desc:'Component entries — R1, EC1, IC1 with Ω descriptions',color:'#16a34a'},{icon:'✅',title:'Engineers / Technicians',desc:'Staff members and visiting tech references',color:'#2563eb'},{icon:'✅',title:'PCB Records & Master',desc:'All PCB failure and consolidated data rows',color:'#d97706'},{icon:'✅',title:'Consumption & Status',desc:'Part codes consumption and aggregated status info',color:'#7c3aed'}].map(x => (
                    <Box key={x.title} display="flex" gap={1} sx={{ mb:1.2 }}>
                      <Typography sx={{ fontSize:'0.85rem', flexShrink:0, lineHeight:1.4 }}>{x.icon}</Typography>
                      <Box>
                        <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color:x.color }}>{x.title}</Typography>
                        <Typography sx={{ fontSize:'0.62rem', color: isDark?'#475569':'#64748b', lineHeight:1.45 }}>{x.desc}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* ══ TAB 2 — Preview Dump (full viewer) ══ */}
          {tab===2 && (
            <Box>
              {!previewData ? (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={7}>
                    <Box sx={{ p:2.8, borderRadius:'16px', background:CARD, border:`1px solid ${isDark?'rgba(59,130,246,0.25)':'rgba(37,99,235,0.2)'}`, boxShadow:shadow }}>
                      <Box display="flex" alignItems="center" gap={1} mb={0.6}>
                        <Box sx={{ width:32, height:32, borderRadius:'9px', background:'rgba(37,99,235,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}><TableChartIcon sx={{ color:'#2563eb', fontSize:17 }} /></Box>
                        <Box>
                          <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color: isDark?'#f1f5f9':'#0f172a', letterSpacing:'-0.01em' }}>Preview Dump Data</Typography>
                          <Typography sx={{ fontSize:'0.63rem', color: isDark?'#475569':'#64748b' }}>See every table — PCB records, BOM, components, branches, engineers</Typography>
                        </Box>
                        <Chip label="READ ONLY" size="small" sx={{ ml:'auto', height:18, fontSize:'0.55rem', fontWeight:700, background:'rgba(37,99,235,0.1)', color: isDark?'#60a5fa':'#1d4ed8', border:`1px solid ${isDark?'rgba(59,130,246,0.25)':'rgba(37,99,235,0.2)'}` }} />
                      </Box>
                      <Divider sx={{ my:1.8, borderColor: isDark?'rgba(255,255,255,0.07)':'rgba(37,99,235,0.1)' }} />
                      {!previewFile ? (
                        <DropZone accept=".dump,.sql,.backup,.pg,.pgdump" label="Upload any dump file to preview all data" hint="Nothing gets saved — pure read-only parsing" color="#2563eb" onFile={f=>{ setPreviewFile(f); setPreviewData(null); setPreviewError('') }} />
                      ) : (
                        <Box>
                          <FileCard file={previewFile} color="#2563eb" onRemove={()=>{ setPreviewFile(null); setPreviewData(null); setPreviewError('') }}>
                            {!previewing && !previewData && (
                              <Button fullWidth variant="contained" onClick={handleDumpPreview} startIcon={<TableChartIcon />}
                                sx={{ py:1.3, borderRadius:'10px', fontWeight:700, textTransform:'none', fontSize:'0.85rem', background:'#2563eb', boxShadow:'0 3px 10px rgba(37,99,235,0.3)', '&:hover':{ background:'#1d4ed8', boxShadow:'0 5px 16px rgba(37,99,235,0.4)' } }}>
                                Parse & Preview All Tables
                              </Button>
                            )}
                            {previewing && (
                              <Box>
                                <Typography sx={{ fontSize:'0.72rem', color: isDark?'#64748b':'#64748b', mb:0.8 }}>Parsing dump file — extracting all tables…</Typography>
                                <LinearProgress sx={{ borderRadius:2, height:5, background: isDark?'rgba(59,130,246,0.12)':'rgba(37,99,235,0.1)', '& .MuiLinearProgress-bar':{ background:'#2563eb', borderRadius:2 } }} />
                              </Box>
                            )}
                          </FileCard>
                          {previewError && <Alert severity="error" sx={{ borderRadius:'10px', fontSize:'0.75rem' }}>{previewError}</Alert>}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Box sx={{ p:2.4, borderRadius:'16px', background:CARD, border:B, boxShadow:shadow }}>
                      <Typography sx={{ fontWeight:700, fontSize:'0.84rem', color: isDark?'#f1f5f9':'#0f172a', mb:1.4 }}>{"Tables you'll see"}</Typography>
                      {[{icon:'🔧',label:'PCB Repair Records',desc:'sr_no, dc_no, branch, status, defect, engineer, dates'},{icon:'📋',label:'BOM Components',desc:'part_code, location, description, source'},{icon:'🔩',label:'Consumption / Component Data',desc:'component usage counts per part code'},{icon:'👷',label:'Engineers',desc:'ID, name'},{icon:'📍',label:'Branches',desc:'derived from PCB records with record counts'},{icon:'⚡',label:'PCB Master',desc:'master part code registry with descriptions'}].map(x => (
                        <Box key={x.label} sx={{ display:'flex', gap:1, mb:1.1 }}>
                          <Typography sx={{ fontSize:'0.9rem', flexShrink:0 }}>{x.icon}</Typography>
                          <Box>
                            <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color: isDark?'#f1f5f9':'#1e293b' }}>{x.label}</Typography>
                            <Typography sx={{ fontSize:'0.61rem', color: isDark?'#475569':'#64748b', lineHeight:1.4 }}>{x.desc}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography sx={{ fontWeight:700, fontSize:'0.86rem', color: isDark?'#94a3b8':'#64748b' }}>📁 {previewFile?.name}</Typography>
                    </Box>
                    <Button size="small" onClick={()=>{ setPreviewFile(null); setPreviewData(null) }} startIcon={<DeleteIcon sx={{ fontSize:14 }} />}
                      sx={{ color:'#ef4444', fontSize:'0.72rem', textTransform:'none', '&:hover':{ background:'rgba(239,68,68,0.07)' } }}>
                      Clear & upload new file
                    </Button>
                  </Box>
                  <DumpDataViewer data={previewData} />
                </Box>
              )}
            </Box>
          )}

          {/* ══ TAB 3 — Inspect ══ */}
          {tab===3 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Box sx={{ p:2.8, borderRadius:'16px', background:CARD, border:'1px solid rgba(14,165,233,0.2)', boxShadow:shadow }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.6}>
                    <Box sx={{ width:32, height:32, borderRadius:'9px', background:'rgba(14,165,233,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}><BugReportIcon sx={{ color:'#0ea5e9', fontSize:17 }} /></Box>
                    <Box>
                      <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color: isDark?'#f1f5f9':'#0f172a', letterSpacing:'-0.01em' }}>Inspect File</Typography>
                      <Typography sx={{ fontSize:'0.63rem', color: isDark?'#475569':'#64748b' }}>Diagnose format without writing to DB — check before importing</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my:1.8, borderColor: isDark?'rgba(255,255,255,0.07)':'rgba(14,165,233,0.1)' }} />
                  {!inspectFile ? (
                    <DropZone accept=".dump,.sql,.backup,.pg" label="Drop dump file to analyse format" hint="No data written — diagnostic only" color="#0ea5e9" onFile={f=>{ setInspectFile(f); setInspectResult(null); setInspectError('') }} />
                  ) : (
                    <Box>
                      <FileCard file={inspectFile} color="#0ea5e9" onRemove={()=>{ setInspectFile(null); setInspectResult(null) }}>
                        {!inspecting && !inspectResult && (
                          <Button fullWidth variant="contained" onClick={handleInspect} startIcon={<BugReportIcon />}
                            sx={{ py:1.3, borderRadius:'10px', fontWeight:700, textTransform:'none', fontSize:'0.85rem', background:'#0284c7', '&:hover':{ background:'#0369a1' } }}>
                            Run Diagnostics
                          </Button>
                        )}
                        {inspecting && <LinearProgress sx={{ borderRadius:2, height:5, background:'rgba(14,165,233,0.1)', '& .MuiLinearProgress-bar':{ background:'#0ea5e9', borderRadius:2 } }} />}
                      </FileCard>
                      {inspectError && <Alert severity="error" sx={{ borderRadius:'10px', fontSize:'0.75rem' }}>{inspectError}</Alert>}
                      {inspectResult && (
                        <Box>
                          <Alert severity={inspectResult.recommendation?.toLowerCase().includes('good')||inspectResult.recommendation?.toLowerCase().includes('fine')?'success':'warning'} sx={{ mb:2, borderRadius:'10px', fontSize:'0.75rem' }}>{inspectResult.recommendation}</Alert>
                          <Grid container spacing={1.5}>
                            {[['Format',inspectResult.file?.format],['Size',inspectResult.file?.size_human],['BOM rows',inspectResult.content?.bom_like_lines],['PCB rows',inspectResult.content?.data_like_lines],['Engineers',inspectResult.content?.engineers_found],['Tables',(inspectResult.content?.tables_detected||[]).join(', ')||'—']].map(([k,v]) => (
                              <Grid item xs={6} sm={4} key={k}>
                                <Box sx={{ p:1.3, borderRadius:'9px', background: isDark?'rgba(0,0,0,0.2)':'rgba(15,23,42,0.03)', border:B, boxShadow: isDark?'none':'0 1px 2px rgba(15,23,42,0.05)' }}>
                                  <Typography sx={{ fontSize:'0.59rem', color: isDark?'#475569':'#94a3b8', fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase', mb:0.3 }}>{k}</Typography>
                                  <Typography sx={{ fontSize:'0.8rem', fontWeight:700, color: isDark?'#38bdf8':'#0284c7', fontFamily:"'JetBrains Mono',monospace" }}>{String(v??'—')}</Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ p:2.4, borderRadius:'16px', background:CARD, border:B, boxShadow:shadow }}>
                  <Box sx={{ display:'flex', gap:0.7, mb:1.4, alignItems:'center' }}>
                    <WarningAmberIcon sx={{ color: isDark?'#f59e0b':'#d97706', fontSize:17 }} />
                    <Typography sx={{ fontWeight:700, fontSize:'0.84rem', color: isDark?'#f1f5f9':'#0f172a' }}>Troubleshooting</Typography>
                  </Box>
                  {[['Convert to plain SQL','pg_restore -Fp yourfile.dump > yourfile.sql\nUpload the .sql file instead'],['Check table names','Parser extracts: bom, engineers,\nconsolidated_data, component_data,\npcb_data, pcb_master, status_data'],['File timeout (>200 MB)','Split the dump or use direct\npsql import into the database']].map(([title, desc]) => (
                    <Box key={title} sx={{ mb:1.2, p:1.3, borderRadius:'9px', background: isDark?'rgba(245,158,11,0.06)':'rgba(217,119,6,0.05)', border: isDark?'1px solid rgba(245,158,11,0.15)':'1px solid rgba(217,119,6,0.15)' }}>
                      <Typography sx={{ fontSize:'0.72rem', fontWeight:700, color: isDark?'#f59e0b':'#d97706', mb:0.3 }}>{title}</Typography>
                      <Typography sx={{ fontSize:'0.62rem', color: isDark?'#94a3b8':'#374151', fontFamily:"'JetBrains Mono',monospace", lineHeight:1.55, whiteSpace:'pre-line' }}>{desc}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* ══ TAB 4 — Data Cleaner ══ */}
          {tab===4 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Box sx={{ p:2.8, borderRadius:'16px', background:CARD, border:'1px solid rgba(139,92,246,0.2)', boxShadow:shadow }}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.6}>
                    <Box sx={{ width:32, height:32, borderRadius:'9px', background:'rgba(124,58,237,0.12)', display:'grid', placeItems:'center', flexShrink:0 }}><AutoFixHighIcon sx={{ color:'#7c3aed', fontSize:17 }} /></Box>
                    <Box>
                      <Typography sx={{ fontWeight:700, fontSize:'0.92rem', color: isDark?'#f1f5f9':'#0f172a', letterSpacing:'-0.01em' }}>Excel Data Cleaner</Typography>
                      <Typography sx={{ fontSize:'0.63rem', color: isDark?'#475569':'#64748b' }}>Upload raw Excel → download a fully cleaned version</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my:1.8, borderColor: isDark?'rgba(255,255,255,0.07)':'rgba(124,58,237,0.1)' }} />
                  <Grid container spacing={1.5} mb={2.5}>
                    {['Converts NULL / NA → empty cells','Normalizes 180+ branch variants → 29 cities','Fixes status values → OK / NFF / WIP','Normalizes defects (Dead/DEAD → DEAD)','Adds Issues Log sheet to output'].map((t,i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box sx={{ width:5, height:5, borderRadius:'50%', background:'#7c3aed', flexShrink:0, mt:0.9 }} />
                          <Typography sx={{ fontSize:'0.7rem', color: isDark?'#94a3b8':'#374151', lineHeight:1.4 }}>{t}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Button fullWidth variant="contained" onClick={()=>cleanRef.current?.click()} disabled={cleaning} startIcon={cleaning ? null : <DownloadIcon />}
                    sx={{ py:1.3, borderRadius:'10px', fontWeight:700, textTransform:'none', fontSize:'0.85rem', background:'#7c3aed', boxShadow:'0 3px 10px rgba(124,58,237,0.3)', '&:hover':{ background:'#6d28d9', boxShadow:'0 5px 16px rgba(124,58,237,0.4)' }, '&:disabled':{ background: isDark?'rgba(124,58,237,0.3)':'rgba(124,58,237,0.2)' } }}>
                    {cleaning ? 'Cleaning your file…' : 'Choose File & Download Cleaned Excel'}
                  </Button>
                  <input ref={cleanRef} type="file" accept=".xlsx,.xlsm" onChange={handleClean} style={{ display:'none' }} />
                </Box>
              </Grid>
            </Grid>
          )}

          {/* ══ Upload History ══ */}
          <Box sx={{ mt:3.5, p:2.5, borderRadius:'16px', background:CARD, border:B, boxShadow:shadow }}>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color: isDark?'#f1f5f9':'#0f172a', mb:2, letterSpacing:'-0.01em' }}>Upload History</Typography>
            {history.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography sx={{ fontSize:'1.5rem', mb:1, opacity:0.5 }}>📂</Typography>
                <Typography sx={{ color: isDark?'#334155':'#94a3b8', fontSize:'0.8rem' }}>No uploads yet. Start by uploading an Excel file or importing a dump.</Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius:'10px', border:B, overflow:'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['#','Filename','Total','OK','NFF','WIP','Status','Uploaded At'].map(h => <TableCell key={h} sx={th}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row,i) => (
                      <TableRow key={row.id} sx={{ background: isDark?(i%2?'rgba(255,255,255,0.015)':'transparent'):(i%2?'#f9fafb':'#fff'), '&:hover':{ background: isDark?'rgba(59,130,246,0.05)':'rgba(37,99,235,0.03)' } }}>
                        <TableCell sx={{ ...td, color: isDark?'#334155':'#94a3b8', fontSize:'0.68rem' }}>{i+1}</TableCell>
                        <TableCell sx={{ ...td, fontWeight:600, color: isDark?'#f1f5f9':'#1e293b', maxWidth:200 }}>{row.original_name}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: isDark?'#60a5fa':'#2563eb' }}>{fmt(row.total_rows)}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#16a34a' }}>{fmt(row.ok_rows)}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: isDark?'#f59e0b':'#d97706' }}>{fmt(row.nff_rows)}</TableCell>
                        <TableCell sx={{ ...td, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: isDark?'#a78bfa':'#7c3aed' }}>{fmt(row.wip_rows)}</TableCell>
                        <TableCell sx={{ ...td, py:0.9 }}>
                          <Chip label={row.status||'pending'} size="small" sx={{ height:19, fontSize:'0.6rem', fontWeight:700, background: row.status==='success'?(isDark?'rgba(34,197,94,0.1)':'rgba(22,163,74,0.09)'):(isDark?'rgba(245,158,11,0.1)':'rgba(217,119,6,0.09)'), border:`1px solid ${row.status==='success'?(isDark?'rgba(34,197,94,0.25)':'rgba(22,163,74,0.22)'):(isDark?'rgba(245,158,11,0.25)':'rgba(217,119,6,0.22)')}`, color: row.status==='success'?(isDark?'#22c55e':'#15803d'):(isDark?'#f59e0b':'#b45309'), '& .MuiChip-label':{px:0.9} }} />
                        </TableCell>
                        <TableCell sx={{ ...td, fontSize:'0.68rem', whiteSpace:'nowrap', color: isDark?'#64748b':'#64748b' }}>
                          {row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString('en-IN')+' '+new Date(row.uploaded_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      </Layout>
    </>
  )
}
