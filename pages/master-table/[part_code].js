import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import MemoryIcon from '@mui/icons-material/Memory'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import Layout from '../../components/common/Layout'

// ── Constants (user's original design — preserved exactly) ───
const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#ff6b6b', '#2dd4bf', '#facc15', '#f472b6', '#7dd3fc', '#86efac']
const STATUS_COLORS = { OK: '#22c55e', NFF: '#f59e0b', WIP: '#a78bfa' }
const PANEL_BORDER = '1px solid rgba(148, 163, 184, 0.14)'

const TT = {
  contentStyle: {
    background: '#091423',
    border: '1px solid rgba(56,189,248,0.22)',
    borderRadius: '12px',
    color: '#eaf3ff',
    fontSize: '0.75rem',
    boxShadow: '0 16px 32px rgba(0,0,0,0.45)',
    padding: '10px 14px',
  },
  itemStyle: { color: '#eaf3ff' },
  labelStyle: { color: 'rgba(160,200,255,0.6)', fontWeight: 600 },
}

const tableCellSx = {
  color: 'rgba(160,200,255,0.72)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  fontSize: '0.76rem',
  py: 1.2,
  px: 1.5,
}

const menuProps = {
  PaperProps: {
    sx: {
      background: '#0d1626',
      border: '1px solid rgba(56,189,248,0.16)',
      borderRadius: '12px',
      '& .MuiMenuItem-root': {
        color: 'rgba(226,232,240,0.9)',
        fontSize: '0.76rem',
      },
    },
  },
}

const getSelectSx = (isDarkMode) => ({
  color: '#eaf3ff',
  borderRadius: '10px',
  background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff',
  fontSize: '0.76rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(56,189,248,0.26)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
  '& .MuiSvgIcon-root': { color: 'rgba(160,200,255,0.54)' },
})

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Sub-components (user's originals — preserved exactly) ────
function StatChip({ label, value, color }) {
  return (
    <Chip
      label={`${Number(value || 0).toLocaleString('en-IN')} ${label}`}
      sx={{
        height: 30,
        borderRadius: '10px',
        color,
        fontWeight: 800,
        fontSize: '0.74rem',
        background: `${color}14`,
        border: `1px solid ${color}2c`,
      }}
    />
  )
}

function SummaryCard({ label, value, accent, caption }) {
  return (
    <Box sx={{ p: 1.6, borderRadius: 3, border: PANEL_BORDER, background: 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)' }}>
      <Typography sx={{ color: accent, fontWeight: 800, fontSize: '1.08rem', fontFamily: "'JetBrains Mono', monospace" }}>
        {Number(value || 0).toLocaleString('en-IN')}
      </Typography>
      <Typography sx={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.76rem', mt: 0.35 }}>
        {label}
      </Typography>
      {caption ? (
        <Typography sx={{ color: '#94a3b8', fontSize: '0.67rem', mt: 0.3 }}>
          {caption}
        </Typography>
      ) : null}
    </Box>
  )
}

function bomStatusVisual(row) {
  if (!row.in_bom) return { label: 'Not In BOM', color: '#ef4444', bar: '#ef4444' }
  if (row.actual_count <= 0) return { label: 'Not Replaced', color: '#22c55e', bar: '#22c55e' }
  if (row.failure_rate >= 10) return { label: 'Moderate', color: '#f59e0b', bar: '#f59e0b' }
  return { label: 'Occasional', color: '#38bdf8', bar: '#38bdf8' }
}

// ── Main page component ──────────────────────────────────────
export default function PCBDetailPage() {
  const isDark = true // dark-only for this page
  const selectSx = getSelectSx(isDark)
  const router = useRouter()
  const { part_code } = router.query

  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [page, setPage]           = useState(0)
  const [rpp, setRpp]             = useState(10)
  const [filterStatus, setFilterStatus]       = useState('all')
  const [filterBranch, setFilterBranch]       = useState('all')
  const [filterComponent, setFilterComponent] = useState('all')
  const [activeTab, setActiveTab] = useState(0)
  const [bomSearch, setBomSearch] = useState('')

  const fetchDetail = async () => {
    if (!part_code) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ part_code, page: page + 1, limit: rpp })
      if (filterStatus    !== 'all') params.append('status',    filterStatus)
      if (filterBranch    !== 'all') params.append('branch',    filterBranch)
      if (filterComponent !== 'all') params.append('component', filterComponent)

      const response = await fetch(`/api/pcb-detail?${params}`)
      const payload  = await response.json()
      if (payload.error) throw new Error(payload.error)
      setData(payload)
    } catch (e) {
      setError(e.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (router.query.component) setFilterComponent(String(router.query.component))
  }, [router.query.component])

  useEffect(() => { fetchDetail() }, [part_code, page, rpp, filterStatus, filterBranch, filterComponent])

  const handleExport = () => {
    if (!data?.data?.length) return
    const headers = ['#', 'DC No', 'Branch', 'Defect', 'Testing', 'Status', 'Analysis', 'Components', 'Engg']
    const csv = [
      headers.join(','),
      ...data.data.map((row, index) =>
        [
          index + 1,
          row.dc_no || '',
          row.branch || '',
          row.defect_normalized || row.defect || '',
          row.testing || '',
          row.status || '',
          `"${(row.analysis || '').replace(/"/g, '""')}"`,
          `"${(row.component_change || '').replace(/"/g, '""')}"`,
          row.engg_name || '',
        ].join(',')
      ),
    ].join('\n')

    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = `PCB_${part_code}.csv`
    link.click()
  }

  // ── Card style (user's original) ────────────────────────────
  const cardStyle = {
    p: 2.5,
    borderRadius: '18px',
    background: 'linear-gradient(180deg, rgba(13,20,34,0.98) 0%, rgba(9,14,25,0.98) 100%)',
    border: PANEL_BORDER,
    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
  }

  // ── Derived data ─────────────────────────────────────────────
  const statusBreakdown = (data?.status_breakdown || []).map(item => ({ ...item, count: Number(item.count || 0) }))
  const componentBreakdown = (data?.component_breakdown || []).map(item => ({ ...item, count: Number(item.count || 0) }))
  const branchBreakdown = (data?.branch_breakdown || []).map(item => ({
    ...item,
    count:     Number(item.count     || 0),
    ok_count:  Number(item.ok_count  || 0),
    nff_count: Number(item.nff_count || 0),
    wip_count: Number(item.wip_count || 0),
  }))
  const defectBreakdown = data?.defect_breakdown || []
  const wipFocus    = data?.wip_focus    || {}
  const bomSummary  = data?.bom_summary  || { total_designed: 0, replaced_in_bom: 0, not_replaced: 0, not_in_bom: 0 }
  const bomComparison = data?.bom_comparison || []

  const okCount  = statusBreakdown.find(item => item.status === 'OK')?.count  || 0
  const nffCount = statusBreakdown.find(item => item.status === 'NFF')?.count || 0
  const wipCount = statusBreakdown.find(item => item.status === 'WIP')?.count || 0

  const filteredBomRows = useMemo(() => {
    if (!bomSearch.trim()) return bomComparison
    const query = bomSearch.trim().toLowerCase()
    return bomComparison.filter(row =>
      String(row.component   || '').toLowerCase().includes(query) ||
      String(row.description || '').toLowerCase().includes(query)
    )
  }, [bomComparison, bomSearch])

  const topComponentRows  = useMemo(() => filteredBomRows.filter(row => Number(row.actual_count || 0) > 0).slice(0, 15), [filteredBomRows])
  const bomMaxFailureRate = useMemo(() => filteredBomRows.reduce((max, row) => Math.max(max, Number(row.failure_rate || 0)), 0), [filteredBomRows])

  if (!part_code) return null

  return (
    <>
      <Head>
        <title>Part {part_code} — Electrolyte Bajaj</title>
      </Head>
      <Layout>
        <Box>
          {/* ── Back + Header ──────────────────────────────── */}
          <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/master-table')}
              sx={{
                color: 'rgba(160,200,255,0.62)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '11px',
                fontSize: '0.78rem',
                textTransform: 'none',
                '&:hover': { color: '#eaf3ff', borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              Back
            </Button>
            <Box sx={{ p: 0.9, borderRadius: '10px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-flex' }}>
              <MemoryIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1.34rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
                Part {part_code}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', maxWidth: 760 }}>
                {data?.master?.product_description || 'Loading product information...'}
              </Typography>
            </Box>
            {bomSummary.total_designed > 0 && (
              <Chip
                label={`BOM: ${bomSummary.total_designed} components`}
                size="small"
                sx={{ height: 24, fontSize: '0.64rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}
              />
            )}
          </Box>

          {/* ── Error alert ────────────────────────────────── */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', '& .MuiAlert-icon': { color: '#ef4444' } }}>
              {error}
            </Alert>
          )}

          {/* ── Loading spinner ─────────────────────────────── */}
          {loading && !data ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={380}>
              <Box textAlign="center">
                <CircularProgress sx={{ color: '#38bdf8', mb: 2 }} />
                <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>Loading part-code analytics...</Typography>
              </Box>
            </Box>
          ) : data ? (
            <>
              {/* ── KPI stat chips ──────────────────────────── */}
              <Box display="flex" gap={1.5} flexWrap="wrap" mb={2.2}>
                <StatChip label="records"    value={data.total || 0}            color="#38bdf8" />
                <StatChip label="OK"         value={okCount}                    color="#22c55e" />
                <StatChip label="NFF"        value={nffCount}                   color="#f59e0b" />
                <StatChip label="WIP"        value={wipCount}                   color="#a78bfa" />
                <StatChip label="branches"   value={branchBreakdown.length || 0} color="#7dd3fc" />
                <StatChip label="components" value={componentBreakdown.length || 0} color="#f87171" />
                {bomSummary.total_designed > 0 && (
                  <StatChip label="BOM entries" value={bomSummary.total_designed} color="#86efac" />
                )}
              </Box>

              {/* ── WIP alert banner ────────────────────────── */}
              {wipFocus?.total_wip ? (
                <Box sx={{ ...cardStyle, mb: 2.4, py: 1.8, background: 'linear-gradient(180deg, rgba(42,26,66,0.95) 0%, rgba(22,20,40,0.96) 100%)', border: '1px solid rgba(167,139,250,0.18)' }}>
                  <Typography sx={{ color: '#e9d5ff', fontWeight: 800, fontSize: '0.94rem', mb: 0.55 }}>
                    ⏳ {Number(wipFocus.total_wip).toLocaleString('en-IN')} records are Work In Progress
                  </Typography>
                  <Typography sx={{ color: 'rgba(233,213,255,0.78)', fontSize: '0.74rem' }}>
                    {Number(wipFocus.missing_component_rows || 0).toLocaleString('en-IN')} have no component data · {Number(wipFocus.missing_analysis_rows || 0).toLocaleString('en-IN')} have no analysis notes.
                    {(wipFocus.top_wip_cities || []).length
                      ? ` Top WIP: ${wipFocus.top_wip_cities.map(item => `${item.branch}(${item.total_wip})`).join(', ')}`
                      : ''}
                  </Typography>
                </Box>
              ) : null}

              {/* ── Main tabbed panel ───────────────────────── */}
              <Box sx={{ ...cardStyle, p: 0, overflow: 'hidden', mb: 2.4 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => { setActiveTab(value); setPage(0) }}
                  sx={{
                    px: 1.6,
                    pt: 1.2,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    '& .MuiTabs-indicator': { backgroundColor: '#38bdf8', height: 3, borderRadius: 999 },
                  }}
                >
                  <Tab label="BOM & Components"   sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.88rem', fontWeight: 800, '&.Mui-selected': { color: '#7dd3fc' } }} />
                  <Tab label="Status & Branches"  sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.88rem', fontWeight: 800, '&.Mui-selected': { color: '#7dd3fc' } }} />
                  <Tab label={`All Records (${Number(data.total || 0).toLocaleString('en-IN')})`} sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.88rem', fontWeight: 800, '&.Mui-selected': { color: '#7dd3fc' } }} />
                </Tabs>

                <Box sx={{ p: 2.2 }}>

                  {/* ════════════ TAB 0 — BOM & Components ════════════ */}
                  {activeTab === 0 ? (
                    <>
                      {/* BOM Full Table */}
                      <Box sx={{ ...cardStyle, mb: 2.2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} flexDirection={{ xs: 'column', md: 'row' }} gap={1.4} mb={2}>
                          <Box>
                            <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem' }}>
                              Bill of Materials — Full Component List
                            </Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.45 }}>
                              {bomSummary.total_designed} designed components · {bomSummary.not_in_bom} unexpected replacements
                            </Typography>
                          </Box>
                          <TextField
                            value={bomSearch}
                            onChange={event => setBomSearch(event.target.value)}
                            placeholder="Search component or description..."
                            size="small"
                            sx={{
                              minWidth: { xs: '100%', md: 260 },
                              '& .MuiOutlinedInput-root': {
                                color: '#e2e8f0',
                                borderRadius: 3,
                                background: 'rgba(15,23,42,0.9)',
                                '& fieldset': { borderColor: 'rgba(148,163,184,0.14)' },
                                '&:hover fieldset': { borderColor: 'rgba(56,189,248,0.3)' },
                                '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                              },
                              '& input::placeholder': { color: '#475569', opacity: 1 },
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchRoundedIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>

                        {/* BOM summary chips */}
                        <Box display="flex" gap={1.2} flexWrap="wrap" mb={2.2}>
                          <Chip label={`✓ ${bomSummary.not_replaced} not replaced`}       sx={{ background: 'rgba(34,197,94,0.12)',  border: '1px solid rgba(34,197,94,0.24)',  color: '#22c55e', fontWeight: 800 }} />
                          <Chip label={`↻ ${bomSummary.replaced_in_bom} replaced (BOM)`} sx={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.24)', color: '#38bdf8', fontWeight: 800 }} />
                          <Chip label={`⚠ ${bomSummary.not_in_bom} not in BOM`}          sx={{ background: 'rgba(239,68,68,0.12)',  border: '1px solid rgba(239,68,68,0.24)',  color: '#ef4444', fontWeight: 800 }} />
                        </Box>

                        {bomComparison.length === 0 ? (
                          <Box sx={{ py: 5, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '2rem', opacity: 0.12, mb: 1 }}>📋</Typography>
                            <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem', mb: 0.5 }}>No BOM data for Part {part_code}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: '#475569' }}>
                              Import the nexscan dump file from Upload → DB Dump Import
                            </Typography>
                          </Box>
                        ) : (
                          <TableContainer sx={{ borderRadius: '14px', border: PANEL_BORDER, maxHeight: 520, overflow: 'auto' }}>
                            <Table stickyHeader size="small">
                              <TableHead>
                                <TableRow sx={{ background: 'rgba(8,17,31,0.96)' }}>
                                  {['#', 'Location / Code', 'Component Description', 'Actual Replacements', 'Failure Rate %', 'Status'].map(header => (
                                    <TableCell
                                      key={header}
                                      sx={{
                                        color: '#64748b',
                                        fontSize: '0.65rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1,
                                        fontWeight: 800,
                                        borderBottom: PANEL_BORDER,
                                        background: 'rgba(8,17,31,0.96)',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1,
                                      }}
                                    >
                                      {header}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {filteredBomRows.map((row, index) => {
                                  const visual   = bomStatusVisual(row)
                                  const progress = bomMaxFailureRate > 0
                                    ? Math.max((Number(row.failure_rate || 0) / bomMaxFailureRate) * 100, row.failure_rate > 0 ? 6 : 0)
                                    : 0
                                  return (
                                    <TableRow
                                      key={`${row.component}-${index}`}
                                      sx={{ '&:hover': { background: 'rgba(56,189,248,0.04)' }, background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                                    >
                                      <TableCell sx={{ ...tableCellSx, color: '#475569' }}>{index + 1}</TableCell>
                                      <TableCell sx={{ ...tableCellSx, minWidth: 110 }}>
                                        <Typography sx={{ color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.15 }}>
                                          {row.component}
                                        </Typography>
                                        {!row.in_bom ? (
                                          <Chip
                                            label="Not In BOM"
                                            size="small"
                                            sx={{ mt: 0.75, height: 18, fontSize: '0.57rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}
                                          />
                                        ) : null}
                                      </TableCell>
                                      <TableCell sx={{ ...tableCellSx, color: '#e2e8f0', minWidth: 240 }}>{row.description || '—'}</TableCell>
                                      <TableCell sx={{ ...tableCellSx, color: '#38bdf8', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                                        {Number(row.actual_count || 0).toLocaleString('en-IN')}
                                      </TableCell>
                                      <TableCell sx={{ ...tableCellSx, minWidth: 180 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                          <Box sx={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(148,163,184,0.16)', overflow: 'hidden' }}>
                                            <Box sx={{ width: `${Math.min(progress, 100)}%`, height: '100%', borderRadius: 999, background: visual.bar, transition: 'width 0.8s ease' }} />
                                          </Box>
                                          <Typography sx={{ color: visual.bar, fontSize: '0.74rem', fontWeight: 800, minWidth: 42 }}>
                                            {Number(row.failure_rate || 0).toFixed(1)}%
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell sx={tableCellSx}>
                                        <Chip
                                          label={visual.label}
                                          size="small"
                                          sx={{ height: 22, fontSize: '0.62rem', fontWeight: 800, color: visual.color, background: `${visual.color}16`, border: `1px solid ${visual.color}2e` }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                                {!filteredBomRows.length ? (
                                  <TableRow>
                                    <TableCell colSpan={6} sx={{ color: '#94a3b8', textAlign: 'center', py: 5 }}>
                                      No BOM rows matched this search.
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>

                      {/* Component Consumption Chart */}
                      <Box sx={cardStyle}>
                        <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', mb: 0.35 }}>
                          Component Consumption Chart
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.74rem', mb: 2.2 }}>
                          Most replaced components with full names and replacement counts.
                        </Typography>
                        {topComponentRows.length ? (
                          <ResponsiveContainer width="100%" height={Math.max(320, topComponentRows.length * 36)}>
                            <BarChart data={topComponentRows} layout="vertical" margin={{ top: 0, right: 60, left: 30, bottom: 0 }} barSize={20}>
                              <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis
                                dataKey="component"
                                type="category"
                                width={170}
                                tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <RTooltip
                                {...TT}
                                content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const row = payload[0].payload
                                  return (
                                    <Box sx={{ background: '#091423', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px', p: 1.5, minWidth: 210 }}>
                                      <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.82rem', mb: 0.4, fontFamily: "'JetBrains Mono',monospace" }}>
                                        {row.component}
                                      </Typography>
                                      {row.description && row.description !== row.component && (
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', mb: 0.55 }}>
                                          {row.description}
                                        </Typography>
                                      )}
                                      <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.78rem' }}>
                                        {Number(row.actual_count || 0).toLocaleString('en-IN')} replacements
                                      </Typography>
                                      {row.failure_rate > 0 && (
                                        <Typography sx={{ color: '#f59e0b', fontSize: '0.68rem', mt: 0.3 }}>
                                          Failure rate: {row.failure_rate}%
                                        </Typography>
                                      )}
                                    </Box>
                                  )
                                }}
                              />
                              <Bar dataKey="actual_count" radius={[0, 6, 6, 0]}
                                label={{ position: 'right', fill: '#475569', fontSize: 10, formatter: v => v > 0 ? Number(v).toLocaleString('en-IN') : '' }}>
                                {topComponentRows.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '1.5rem', opacity: 0.15, mb: 0.5 }}>📊</Typography>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              No component consumption rows are available for this part code yet.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </>
                  ) : null}

                  {/* ════════════ TAB 1 — Status & Branches ════════════ */}
                  {activeTab === 1 ? (
                    <>
                      <Grid container spacing={2} mb={2}>
                        {/* Status donut */}
                        <Grid item xs={12} md={4}>
                          <Box sx={cardStyle}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc', mb: 0.25 }}>
                              Status Breakdown
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 2 }}>
                              OK, NFF, and WIP distribution for this selected part code.
                            </Typography>
                            <ResponsiveContainer width="100%" height={260}>
                              <PieChart>
                                <Pie
                                  data={statusBreakdown}
                                  cx="50%" cy="46%"
                                  innerRadius={58} outerRadius={90}
                                  paddingAngle={3}
                                  dataKey="count" nameKey="status"
                                  labelLine={false} label={renderPieLabel}
                                  animationDuration={900}
                                >
                                  {statusBreakdown.map((item, index) => <Cell key={index} fill={STATUS_COLORS[item.status] || '#7dd3fc'} />)}
                                </Pie>
                                <RTooltip {...TT} formatter={(value, name) => [Number(value).toLocaleString('en-IN'), name]} />
                                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                              </PieChart>
                            </ResponsiveContainer>
                            {/* Count badges below donut */}
                            <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap" mt={0.5}>
                              {statusBreakdown.map(s => (
                                <Box key={s.status} sx={{ px: 1.2, py: 0.6, borderRadius: '8px', background: `${STATUS_COLORS[s.status] || '#64748b'}10`, border: `1px solid ${STATUS_COLORS[s.status] || '#64748b'}22`, textAlign: 'center' }}>
                                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: STATUS_COLORS[s.status] || '#64748b', fontFamily: "'JetBrains Mono',monospace" }}>
                                    {Number(s.count).toLocaleString('en-IN')}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.6rem', color: '#64748b' }}>{s.status} · {s.percentage}%</Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Grid>

                        {/* Branch stacked bar */}
                        <Grid item xs={12} md={8}>
                          <Box sx={cardStyle}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc', mb: 0.25 }}>
                              Branch / Location Distribution
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mb: 2 }}>
                              Where this PCB is coming from with OK, NFF, and WIP split per city.
                            </Typography>
                            <ResponsiveContainer width="100%" height={Math.max(240, branchBreakdown.slice(0,10).length * 30)}>
                              <BarChart data={branchBreakdown.slice(0, 10)} layout="vertical" barSize={15} margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis dataKey="branch" type="category" width={88} tick={{ fill: '#cbd5e1', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <RTooltip {...TT} formatter={(value, name) => [Number(value).toLocaleString('en-IN'), name]} />
                                <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
                                <Bar dataKey="ok_count"  name="OK"  stackId="a" fill="#22c55e" animationDuration={800} />
                                <Bar dataKey="nff_count" name="NFF" stackId="a" fill="#f59e0b" animationDuration={900} />
                                <Bar dataKey="wip_count" name="WIP" stackId="a" fill="#a78bfa" radius={[0, 3, 3, 0]} animationDuration={1000} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* WIP summary cards */}
                      <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} md={3}><SummaryCard label="Total WIP"           value={wipFocus?.total_wip || 0}                accent="#a78bfa" /></Grid>
                        <Grid item xs={12} md={3}><SummaryCard label="Missing Components"  value={wipFocus?.missing_component_rows || 0}   accent="#f59e0b" /></Grid>
                        <Grid item xs={12} md={3}><SummaryCard label="Missing Analysis"    value={wipFocus?.missing_analysis_rows || 0}    accent="#38bdf8" /></Grid>
                        <Grid item xs={12} md={3}><SummaryCard label="Total Records"       value={wipFocus?.total_records || data.total || 0} accent="#22c55e" /></Grid>
                      </Grid>

                      {/* Top WIP Cities */}
                      <Box sx={{ ...cardStyle, mb: 2 }}>
                        <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.9rem', mb: 1 }}>
                          Top WIP Cities
                        </Typography>
                        {(wipFocus?.top_wip_cities || []).length ? (
                          <Grid container spacing={1.4}>
                            {wipFocus.top_wip_cities.map(item => (
                              <Grid item xs={12} md={6} key={item.branch}>
                                <Box sx={{ p: 1.3, borderRadius: '12px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
                                  <Typography sx={{ color: '#e9d5ff', fontWeight: 800, fontSize: '0.8rem' }}>{item.branch}</Typography>
                                  <Typography sx={{ color: 'rgba(233,213,255,0.78)', fontSize: '0.68rem', mt: 0.25 }}>
                                    {Number(item.total_wip || 0).toLocaleString('en-IN')} pending records
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography sx={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                            No city-level WIP concentration found for this part code.
                          </Typography>
                        )}
                      </Box>

                      {/* Defect types */}
                      {defectBreakdown.length > 0 && (
                        <Box sx={cardStyle}>
                          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '0.9rem', mb: 1.2 }}>
                            Defect Types
                          </Typography>
                          <Box display="flex" gap={1} flexWrap="wrap">
                            {defectBreakdown.map((d, i) => (
                              <Box key={d.defect} sx={{ px: 1.3, py: 0.8, borderRadius: '9px', background: `${COLORS[i % COLORS.length]}10`, border: `1px solid ${COLORS[i % COLORS.length]}22` }}>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: COLORS[i % COLORS.length], fontFamily: "'JetBrains Mono',monospace" }}>
                                  {Number(d.count).toLocaleString('en-IN')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.2 }}>{d.defect}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </>
                  ) : null}

                  {/* ════════════ TAB 2 — All Records ════════════ */}
                  {activeTab === 2 ? (
                    <Box sx={cardStyle}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.2} flexWrap="wrap" gap={1.2}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc' }}>Repair Records</Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            {Number(data.total || 0).toLocaleString('en-IN')} records · page {page + 1}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1.3} alignItems="center" flexWrap="wrap">
                          <FormControl size="small" sx={{ minWidth: 110 }}>
                            <InputLabel sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Status</InputLabel>
                            <Select value={filterStatus} label="Status" onChange={event => { setFilterStatus(event.target.value); setPage(0) }} sx={selectSx} MenuProps={menuProps}>
                              <MenuItem value="all">All</MenuItem>
                              <MenuItem value="OK">✅ OK</MenuItem>
                              <MenuItem value="NFF">⚠️ NFF</MenuItem>
                              <MenuItem value="WIP">⏳ WIP</MenuItem>
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 145 }}>
                            <InputLabel sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Branch</InputLabel>
                            <Select value={filterBranch} label="Branch" onChange={event => { setFilterBranch(event.target.value); setPage(0) }} sx={selectSx} MenuProps={menuProps}>
                              <MenuItem value="all">All Branches</MenuItem>
                              {branchBreakdown.map(branch => (
                                <MenuItem key={branch.branch} value={branch.branch}>
                                  {branch.branch} ({branch.count})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Component</InputLabel>
                            <Select value={filterComponent} label="Component" onChange={event => { setFilterComponent(event.target.value); setPage(0) }} sx={selectSx} MenuProps={menuProps}>
                              <MenuItem value="all">All Components</MenuItem>
                              {componentBreakdown.map(item => (
                                <MenuItem key={item.component} value={item.component}>
                                  {item.component} ({item.count})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Tooltip title="Export CSV">
                            <IconButton
                              onClick={handleExport}
                              size="small"
                              sx={{
                                color: 'rgba(160,200,255,0.48)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '10px',
                                p: 0.8,
                                '&:hover': { color: '#22c55e', borderColor: 'rgba(34,197,94,0.24)', background: 'rgba(34,197,94,0.06)' },
                              }}
                            >
                              <FileDownloadOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {loading ? <LinearProgress sx={{ mb: 1.3, borderRadius: 999, background: 'rgba(56,189,248,0.08)', '& .MuiLinearProgress-bar': { background: '#38bdf8' } }} /> : null}

                      <TableContainer sx={{ borderRadius: '12px', border: PANEL_BORDER, maxHeight: 560, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ background: 'rgba(0,0,0,0.28)' }}>
                              {['#', 'DC No', 'Branch', 'Defect', 'Testing', 'Status', 'Analysis', 'Components', 'Engg'].map(header => (
                                <TableCell
                                  key={header}
                                  sx={{
                                    color: '#64748b',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    fontSize: '0.61rem',
                                    fontWeight: 800,
                                    letterSpacing: '1.1px',
                                    textTransform: 'uppercase',
                                    py: 1.2, px: 1.5,
                                    whiteSpace: 'nowrap',
                                    background: 'rgba(8,17,31,0.96)',
                                    position: 'sticky', top: 0, zIndex: 1,
                                  }}
                                >
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(data.data || []).map((row, index) => (
                              <TableRow
                                key={row.id || index}
                                sx={{ '&:hover': { background: 'rgba(56,189,248,0.05)' }, background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                              >
                                <TableCell sx={{ ...tableCellSx, color: '#475569' }}>{page * rpp + index + 1}</TableCell>
                                <TableCell sx={{ ...tableCellSx, color: '#38bdf8', fontWeight: 700, fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                                  {row.dc_no || '—'}
                                </TableCell>
                                <TableCell sx={tableCellSx}>{row.branch || '—'}</TableCell>
                                <TableCell sx={tableCellSx}>{row.defect_normalized || row.defect || '—'}</TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5 }}>
                                  {row.testing ? (
                                    <Chip
                                      label={row.testing}
                                      size="small"
                                      sx={{
                                        height: 18, fontSize: '0.6rem', fontWeight: 800,
                                        background: (row.testing === 'Pass' || row.testing === 'PASS') ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                        border: (row.testing === 'Pass' || row.testing === 'PASS') ? '1px solid rgba(34,197,94,0.24)' : '1px solid rgba(239,68,68,0.22)',
                                        color: (row.testing === 'Pass' || row.testing === 'PASS') ? '#22c55e' : '#ef4444',
                                      }}
                                    />
                                  ) : <span style={{ color: '#475569' }}>—</span>}
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5 }}>
                                  {row.status ? (
                                    <Chip
                                      label={row.status}
                                      size="small"
                                      sx={{
                                        height: 18, fontSize: '0.6rem', fontWeight: 800,
                                        color: STATUS_COLORS[row.status] || '#a78bfa',
                                        background: `${STATUS_COLORS[row.status] || '#a78bfa'}16`,
                                        border: `1px solid ${(STATUS_COLORS[row.status] || '#a78bfa')}28`,
                                      }}
                                    />
                                  ) : <span style={{ color: '#475569' }}>—</span>}
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5, maxWidth: 190 }}>
                                  <Tooltip title={row.analysis || ''} arrow>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 175, cursor: row.analysis ? 'help' : 'default' }}>
                                      {row.analysis || '—'}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5, maxWidth: 155 }}>
                                  <Tooltip title={row.component_change || ''} arrow>
                                    <Typography sx={{ fontSize: '0.68rem', color: '#c4b5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 145, cursor: row.component_change ? 'help' : 'default' }}>
                                      {row.component_change || '—'}
                                    </Typography>
                                  </Tooltip>
                                </TableCell>
                                <TableCell sx={tableCellSx}>{row.engg_name || '—'}</TableCell>
                              </TableRow>
                            ))}
                            {(data.data || []).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
                                  No records found for the selected filters.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component="div"
                        count={data.total || 0}
                        page={page}
                        onPageChange={(_, nextPage) => setPage(nextPage)}
                        rowsPerPage={rpp}
                        onRowsPerPageChange={event => { setRpp(parseInt(event.target.value, 10)); setPage(0) }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        sx={{
                          color: '#94a3b8',
                          borderTop: '1px solid rgba(255,255,255,0.05)',
                          mt: 0.5,
                          '& .MuiIconButton-root': { color: '#94a3b8' },
                          '& .MuiSelect-icon':     { color: '#94a3b8' },
                          '& .MuiTablePagination-select': { color: '#e2e8f0' },
                        }}
                      />
                    </Box>
                  ) : null}

                </Box>
              </Box>
            </>
          ) : !loading ? (
            <Box sx={{ ...cardStyle, textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2rem', opacity: 0.12, mb: 1 }}>📋</Typography>
              <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.9rem' }}>
                No data found for Part {part_code}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Layout>
    </>
  )
}
