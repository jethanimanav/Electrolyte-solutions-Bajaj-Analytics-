import { useEffect, useState, useCallback } from 'react'
import Head from 'next/head'
import { Alert, Box, Button, Chip, Divider, Grid, LinearProgress, MenuItem, Select, Stack, Typography } from '@mui/material'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import HourglassBottomOutlinedIcon from '@mui/icons-material/HourglassBottomOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import { useRouter } from 'next/router'
import Layout from '../components/common/Layout'
import { fetchJson } from '../lib/fetch-json'
import { useTheme } from '../lib/ThemeContext'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const fmt = v => Number(v || 0).toLocaleString('en-IN')
const SC = { OK: '#22c55e', NFF: '#f59e0b', SCRAP: '#ef4444', WIP: '#a78bfa' }
const COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#f97316', '#ef4444']

// ── Shared card component ──────────────────────────────────
function Card({ children, sx = {}, onClick }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  return (
    <Box onClick={onClick} sx={{
      borderRadius: '14px',
      background: isDark
        ? 'linear-gradient(180deg,rgba(13,20,34,0.97)0%,rgba(9,14,25,0.97)100%)'
        : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`,
      boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.08)',
      transition: 'all 0.2s',
      ...(onClick ? { cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.5)' : '0 6px 20px rgba(15,23,42,0.13), 0 2px 6px rgba(15,23,42,0.06)' } } : {}),
      ...sx,
    }}>
      {children}
    </Box>
  )
}

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({ title, value, subtitle, accent, icon: Icon, onClick, badge }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  return (
    <Card onClick={onClick} sx={{ p: 2.2, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8}>
        <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: '11px', color: accent, background: `${accent}18`, border: `1px solid ${accent}25` }}>
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Chip label={badge || 'Drill down'} size="small"
          sx={{ background: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(37,99,235,0.08)', color: isDark ? '#bae6fd' : '#1d4ed8', fontSize: '0.6rem', height: 20, fontWeight: 600, border: `1px solid ${isDark ? 'rgba(56,189,248,0.2)' : 'rgba(37,99,235,0.2)'}` }} />
      </Box>
      <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontSize: '2rem', fontWeight: 800, lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" }}>{value}</Typography>
      <Typography sx={{ color: theme.text2, fontSize: '0.88rem', mt: 0.8 }}>{title}</Typography>
      <Typography sx={{ color: theme.text3, fontSize: '0.73rem', mt: 0.5 }}>{subtitle}</Typography>
    </Card>
  )
}

// ── Section Card ───────────────────────────────────────────
function SectionCard({ title, subtitle, actionLabel, onAction, children, minHeight = 320 }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  return (
    <Card sx={{ p: 2.5, minHeight, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} mb={2.2}>
        <Box>
          <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{title}</Typography>
          <Typography sx={{ color: theme.text3, fontSize: '0.74rem', mt: 0.4 }}>{subtitle}</Typography>
        </Box>
        {actionLabel && (
          <Button onClick={onAction} size="small" sx={{ color: theme.text2, border, borderRadius: 999, textTransform: 'none', fontSize: '0.7rem', px: 1.4, py: 0.55, flexShrink: 0 }}>
            {actionLabel}
          </Button>
        )}
      </Box>
      {children}
    </Card>
  )
}

// ── Transparency Card ──────────────────────────────────────
function TransparencyCard({ transparency }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const inner = isDark ? 'rgba(15,23,42,0.6)' : '#f8fafc'
  if (!transparency) return null
  const metrics = [
    { label: 'Total Uploaded', value: transparency.uploadedTotal, hint: 'Raw Excel rows', color: '#38bdf8' },
    { label: 'Analytics Records', value: transparency.analyticsTotal, hint: 'Cleaned & usable', color: '#22c55e' },
    { label: 'Geo-Mapped', value: transparency.mappedTotal, hint: 'Valid city/state', color: '#a78bfa' },
    { label: 'Unmapped', value: transparency.unmappedTotal, hint: 'No city match', color: '#f59e0b' },
  ]
  return (
    <Card sx={{ p: 2.2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box>
          <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>Data Pipeline</Typography>
          <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem', mt: 0.3 }}>Raw → Cleaned → Analytics → Geo-Mapped</Typography>
        </Box>
        <Box display="flex" gap={0.8}>
          {[`${transparency.analyticsCoverage||0}% usable`, `${transparency.mappedCoverage||0}% mapped`].map((l,i) => (
            <Chip key={l} label={l} size="small" sx={{ background: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.08)', color: '#22c55e', fontSize: '0.58rem', height: 20 }} />
          ))}
        </Box>
      </Box>
      <Grid container spacing={1.2} mb={1.5}>
        {metrics.map(m => (
          <Grid item xs={6} md={3} key={m.label}>
            <Box sx={{ p: 1.3, borderRadius: '10px', border, background: inner, boxShadow: isDark?'none':'0 1px 2px rgba(15,23,42,0.05)' }}>
              <Typography sx={{ color: m.color, fontWeight: 800, fontSize: '1.1rem', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(m.value)}</Typography>
              <Typography sx={{ color: theme.text1, fontSize: '0.7rem', fontWeight: 600, mt: 0.2 }}>{m.label}</Typography>
              <Typography sx={{ color: isDark ? theme.text4 : '#64748b', fontSize: '0.6rem' }}>{m.hint}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      {(transparency.unmappedBreakdown||[]).some(b => b.count > 0) && (
        <Box sx={{ p: 1.3, borderRadius: '10px', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(217,119,6,0.2)'}`, background: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.04)' }}>
          <Typography sx={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, mb: 0.8 }}>
            ⚠ Why are {fmt(transparency.unmappedTotal)} records unmapped?
          </Typography>
          {(transparency.unmappedBreakdown||[]).filter(b=>b.count>0).map(b => (
            <Box key={b.reason} display="flex" justifyContent="space-between" mb={0.3}>
              <Typography sx={{ color: theme.text3, fontSize: '0.66rem' }}>• {b.reason}</Typography>
              <Typography sx={{ color: '#f59e0b', fontSize: '0.66rem', fontWeight: 600 }}>{fmt(b.count)} ({b.pct}%)</Typography>
            </Box>
          ))}
          <Typography sx={{ color: isDark ? theme.text4 : '#64748b', fontSize: '0.6rem', mt: 0.6 }}>These records still count in OK/NFF/WIP — only excluded from the map view.</Typography>
        </Box>
      )}
    </Card>
  )
}

// ── Data Quality Card ──────────────────────────────────────
function DataQualityCard({ quality }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const inner = isDark ? 'rgba(15,23,42,0.6)' : '#f8fafc'
  if (!quality) return null
  return (
    <Card sx={{ p: 2.2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box>
          <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>Data Quality</Typography>
          <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem', mt: 0.3 }}>Latest upload learning summary</Typography>
        </Box>
        <Chip label={quality.originalName || 'Last upload'} size="small" sx={{ background: isDark ? 'rgba(56,189,248,0.1)' : 'rgba(2,132,199,0.1)', color: isDark ? '#bae6fd' : '#0369a1', maxWidth: 200, fontSize: '0.6rem', height: 20 }} />
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} useFlexGap flexWrap="wrap">
        {[
          { label: 'Auto-fixed', value: fmt(quality.autoFixed), color: '#22c55e' },
          { label: 'Flagged', value: fmt(quality.flagged), color: '#f59e0b' },
          { label: 'Uploaded', value: quality.uploadedAt ? new Date(quality.uploadedAt).toLocaleDateString('en-IN') : '—', color: '#38bdf8' },
        ].map(item => (
          <Box key={item.label} sx={{ flex: '1 1 0', minWidth: 120, p: 1.3, borderRadius: '10px', border, background: inner }}>
            <Typography sx={{ color: item.color, fontWeight: 800, fontSize: '1rem', fontFamily: "'JetBrains Mono',monospace" }}>{item.value}</Typography>
            <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mt: 0.3 }}>{item.label}</Typography>
          </Box>
        ))}
      </Stack>
    </Card>
  )
}

// ── Health Card ────────────────────────────────────────────
function HealthCard({ health }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const inner = isDark ? 'rgba(15,23,42,0.6)' : '#f8fafc'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  if (!health) return null
  const tc = health.tone === 'healthy' ? '#22c55e' : health.tone === 'watch' ? '#f59e0b' : '#ef4444'
  return (
    <Card sx={{ p: 2.2 }}>
      <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.92rem' }}>Data Health</Typography>
      <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem', mt: 0.3, mb: 1.5 }}>Score based on WIP load, geo coverage, flagged values</Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={1.5}>
        <Box>
          <Typography sx={{ color: tc, fontWeight: 800, fontSize: '2.2rem', fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{health.score}</Typography>
          <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem' }}>/ 100 confidence</Typography>
        </Box>
        <Stack spacing={0.5} sx={{ minWidth: 160 }}>
          {[['WIP %', health.wipPct], ['Mapped %', health.mappedPct], ['Flagged %', health.flaggedPct]].map(([l, v]) => (
            <Box key={l}>
              <Box display="flex" justifyContent="space-between">
                <Typography sx={{ color: theme.text3, fontSize: '0.65rem' }}>{l}</Typography>
                <Typography sx={{ color: theme.text1, fontSize: '0.65rem', fontWeight: 600 }}>{v}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(parseFloat(v)||0, 100)} sx={{ height: 3, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.09)', '& .MuiLinearProgress-bar': { background: tc } }} />
            </Box>
          ))}
        </Stack>
      </Box>
      <Typography sx={{ color: tc, fontSize: '0.76rem', fontWeight: 600 }}>{health.message}</Typography>
    </Card>
  )
}

// ── Insights Card ──────────────────────────────────────────
function InsightsCard({ insights }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const inner = isDark ? 'rgba(15,23,42,0.58)' : '#f8fafc'
  if (!insights?.length) return null
  return (
    <SectionCard title="Smart Insights" subtitle="Auto-generated from current analytics and geographic data" minHeight={100}>
      <Grid container spacing={1.2}>
        {insights.map((item, i) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Box sx={{ p: 1.5, borderRadius: '10px', border: `1px solid ${(item.color||'#64748b')}22`, background: `${(item.color||'#64748b')}08`, height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', border: `1px solid ${(item.color||'#64748b')}35` } }}>
              <Typography sx={{ fontSize: '1.1rem', mb: 0.5 }}>{item.icon || '📊'}</Typography>
              <Typography sx={{ color: theme.text3, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.6, mb: 0.4 }}>{item.label}</Typography>
              <Typography sx={{ color: item.color || theme.text1, fontWeight: 700, fontSize: '0.9rem', mb: 0.4 }}>{item.value}</Typography>
              <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem' }}>{item.detail}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  )
}

// ── Drill-down Detail Card ─────────────────────────────────
function DetailCard({ detail, loading, onOpenState, onOpenCity, onOpenPartCode, onReset, onOpenAnalytics, onOpenTable }) {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const inner = isDark ? 'rgba(15,23,42,0.58)' : '#f8fafc'
  const hoverBorder = isDark ? 'rgba(56,189,248,0.28)' : 'rgba(37,99,235,0.28)'
  const level = detail?.level || 'dashboard'

  const MetricRow = ({ label, value, color }) => (
    <Grid item xs={6}>
      <Box sx={{ p: 1.3, borderRadius: '10px', border, background: inner, boxShadow: isDark?'none':'0 1px 2px rgba(15,23,42,0.05)' }}>
        <Typography sx={{ color, fontWeight: 700, fontSize: '0.95rem', fontFamily: "'JetBrains Mono',monospace" }}>{typeof value === 'string' && value.includes('%') ? value : fmt(value)}</Typography>
        <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.68rem', mt: 0.3 }}>{label}</Typography>
      </Box>
    </Grid>
  )

  const ItemRow = ({ item, label, sub, onClick }) => (
    <Box onClick={onClick} sx={{ p: 1.35, borderRadius: '10px', border, background: inner, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: hoverBorder, transform: 'translateX(3px)', boxShadow: isDark?'none':'0 2px 8px rgba(37,99,235,0.08)' } }}>
      <Box display="flex" justifyContent="space-between" gap={2}>
        <Box>
          <Typography sx={{ color: theme.text1, fontWeight: 600, fontSize: '0.84rem' }}>{label}</Typography>
          <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mt: 0.3 }}>{sub}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography sx={{ color: theme.text1, fontSize: '0.72rem', fontWeight: 600 }}>Total: {fmt(item.total)}</Typography>
          <Typography sx={{ color: SC.OK, fontSize: '0.7rem' }}>OK: {fmt(item.ok)}</Typography>
          <Typography sx={{ color: SC.NFF, fontSize: '0.7rem' }}>NFF: {fmt(item.nff)}</Typography>
          <Typography sx={{ color: SC.SCRAP, fontSize: '0.7rem' }}>Scrap: {fmt(item.scrap)}</Typography>
          <Typography sx={{ color: SC.WIP, fontSize: '0.7rem' }}>WIP: {fmt(item.wip)}</Typography>
        </Box>
      </Box>
    </Box>
  )

  const TT = { contentStyle: { background: isDark ? '#0d1626' : '#1e293b', border, borderRadius: 10, color: '#f1f5f9', fontSize: '0.74rem' }, labelStyle: { color: '#94a3b8', fontWeight: 600 } }

  return (
    <Card sx={{ p: 2.5, minHeight: 760, height: '100%' }}>
      <Typography sx={{ color: isDark ? theme.text1 : '#0f172a', fontWeight: 700, fontSize: '0.95rem', mb: 0.4 }}>{detail?.title || 'Drill-down Analytics'}</Typography>
      <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem', mb: 2 }}>Dashboard → Part Code → Component Consumption</Typography>

      {/* Breadcrumb */}
      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap mb={2}>
        <Button onClick={onReset} size="small" sx={{ borderRadius: 999, border, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>Dashboard</Button>
        {detail?.state && <Button onClick={() => onOpenState(detail.state)} size="small" sx={{ borderRadius: 999, border, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>{detail.state}</Button>}
        {detail?.city && <Button onClick={() => onOpenCity(detail.city)} size="small" sx={{ borderRadius: 999, border, color: theme.text2, textTransform: 'none', fontSize: '0.7rem', py: 0.3 }}>{detail.city}</Button>}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)', '& .MuiLinearProgress-bar': { background: isDark?'#3b82f6':'#2563eb' } }} />}

      {detail?.summary && (
        <Grid container spacing={1.2} mb={2}>
          {[['Total', detail.summary.total, theme.text1], ['OK', detail.summary.ok, SC.OK], ['NFF', detail.summary.nff, SC.NFF], ['Scrap', detail.summary.scrap, SC.SCRAP], ['WIP', detail.summary.wip, SC.WIP], ['OK Rate', `${detail.summary.okRate||0}%`, '#38bdf8']].map(([l,v,c]) => (
            <MetricRow key={l} label={l} value={v} color={c} />
          ))}
        </Grid>
      )}

      <Stack spacing={1}>
        {level === 'dashboard' && (detail?.items||[]).map(item => (
          <ItemRow key={item.partCode} item={item} label={`Part Code ${item.partCode}`} sub={item.productDescription||'PCB'} onClick={() => onOpenPartCode(item.partCode)} />
        ))}
        {level === 'state' && (detail?.items||[]).map(item => (
          <ItemRow key={item.city} item={item} label={item.city} sub="City PCB counts" onClick={() => onOpenCity(item.city)} />
        ))}
        {level === 'city' && (detail?.items||[]).map(item => (
          <ItemRow key={item.partCode} item={item} label={`Part Code ${item.partCode}`} sub={item.productDescription||'PCB'} onClick={() => onOpenPartCode(item.partCode)} />
        ))}
        {level === 'part-code' && (
          <Box>
            <Stack direction="row" spacing={0.8} mb={1.5}>
              <Button onClick={onOpenAnalytics} size="small" sx={{ border, borderRadius: 999, color: theme.text2, textTransform: 'none', fontSize: '0.7rem' }}>Open Analytics</Button>
              <Button onClick={onOpenTable} size="small" sx={{ border, borderRadius: 999, color: theme.text2, textTransform: 'none', fontSize: '0.7rem' }}>Open Part Detail</Button>
            </Stack>
            <Typography sx={{ color: theme.text1, fontWeight: 700, fontSize: '0.9rem', mb: 0.4 }}>Component Consumption</Typography>
            <Typography sx={{ color: theme.text3, fontSize: '0.72rem', mb: 1.5 }}>Actual replacements for this part code</Typography>
            <Box sx={{ height: 280, mb: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={detail?.detail?.components||[]} layout="vertical" margin={{ top:4, right:10, left:8, bottom:4 }}>
                  <CartesianGrid horizontal={false} stroke={isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)'} />
                  <XAxis type="number" tick={{ fill: theme.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="component" type="category" width={130} tick={{ fill: theme.text2, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={v => [fmt(v), 'Usage']} />
                  <Bar dataKey="total_count" fill="#38bdf8" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.08)', mb: 1.5 }} />
            <Stack spacing={0.8}>
              {(detail?.detail?.samples||[]).map((item, i) => (
                <Box key={i} sx={{ p: 1.2, borderRadius: '9px', border, background: inner }}>
                  <Box display="flex" alignItems="center" gap={0.8} mb={0.3}>
                    <Typography sx={{ color: theme.text1, fontWeight: 600, fontSize: '0.78rem' }}>{item.branch}</Typography>
                    <Chip label={item.status||'WIP'} size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, background: `${SC[item.status]||SC.WIP}15`, color: SC[item.status]||SC.WIP, border: `1px solid ${SC[item.status]||SC.WIP}30` }} />
                  </Box>
                  <Typography sx={{ color: isDark ? theme.text3 : '#475569', fontSize: '0.7rem' }}>{item.analysis}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </Card>
  )
}

// ── Main Dashboard Page ────────────────────────────────────
export default function DashboardPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const router = useRouter()
  const [overview, setOverview] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: 'all', part_code: 'all' })

  const TT = {
    contentStyle: { background: isDark ? '#0d1626' : '#1e293b', border: `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`, borderRadius: 12, color: '#f1f5f9', fontSize: '0.74rem' },
    labelStyle: { color: '#94a3b8', fontWeight: 600 },
  }

  const loadOverview = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const p = new URLSearchParams()
      if (filters.status !== 'all') p.set('status', filters.status)
      if (filters.part_code !== 'all') p.set('part_code', filters.part_code)
      const data = await fetchJson(`/api/dashboard-overview?${p}`)
      setOverview(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [filters.status, filters.part_code])

  const openDetail = useCallback(async (next) => {
    setDetailLoading(true)
    try {
      const p = new URLSearchParams()
      p.set('level', next.level)
      if (next.state) p.set('state', next.state)
      if (next.city) p.set('city', next.city)
      if (next.partCode) p.set('part_code', next.partCode)
      if (next.status) p.set('status', next.status)
      const data = await fetchJson(`/api/drilldown?${p}`)
      setDetail({ ...data, state: next.state || data.summary?.state, city: next.city || data.summary?.city })
    } catch (e) { setDetail({ title: 'Unavailable', level: next.level, items: [], error: e.message }) }
    finally { setDetailLoading(false) }
  }, [])

  useEffect(() => { loadOverview() }, [loadOverview])
  useEffect(() => { if (overview) openDetail({ level: 'dashboard' }) }, [overview])

  const openState = s => s && openDetail({ level: 'state', state: s })
  const openCity  = c => c && openDetail({ level: 'city', state: detail?.state || overview?.kpis?.topState, city: c })
  const openPart  = p => { if (!p) return; openDetail({ level: 'part-code', state: detail?.state, city: detail?.city, partCode: p }) }

  const border = `1px solid ${isDark ? 'rgba(148,163,184,0.13)' : 'rgba(15,23,42,0.1)'}`
  const selSx = { minWidth: 145, color: theme.text1, borderRadius: '9px', background: isDark ? 'rgba(255,255,255,0.04)' : '#fff', fontSize: '0.76rem', '.MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.15)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' }, '.MuiSvgIcon-root': { color: theme.text4 } }
  const menuPaperSx = { sx: { background: isDark ? '#0d1626' : '#fff', border, borderRadius: '11px', '& .MuiMenuItem-root': { color: theme.text2, fontSize: '0.76rem', '&:hover': { background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(37,99,235,0.06)' } } } }

  return (
    <>
      <Head><title>Dashboard — Electrolyte Bajaj</title></Head>
      <Layout onRefresh={loadOverview}>
        <Box>
          {/* Header banner */}
          <Box sx={{ p: { xs: 2.2, md: 3 }, borderRadius: '16px', background: isDark ? 'radial-gradient(circle at top left,rgba(56,189,248,0.15),transparent 30%),radial-gradient(circle at top right,rgba(34,197,94,0.12),transparent 22%),linear-gradient(180deg,#0f172a 0%,#08111f 100%)' : 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 50%,#ede9fe 100%)', border, mb: 2.5, boxShadow: isDark ? 'none' : '0 2px 12px rgba(37,99,235,0.08)' }}>
            <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={2}>
              <Box>
                <Typography sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontSize: { xs: '1.3rem', md: '1.7rem' }, fontWeight: 800, letterSpacing: '-0.5px' }}>PCB Analytics Dashboard</Typography>
                <Typography sx={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '0.84rem', mt: 0.5 }}>Enterprise PCB repair intelligence · Bajaj Auto Limited</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Select size="small" value={filters.status} onChange={e => setFilters(p => ({...p, status: e.target.value}))} sx={selSx} MenuProps={menuPaperSx}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="OK">✅ OK</MenuItem>
                  <MenuItem value="NFF">⚠️ NFF</MenuItem>
                  <MenuItem value="SCRAP">🗑️ Scrap</MenuItem>
                  <MenuItem value="WIP">⏳ WIP</MenuItem>
                </Select>
                <Select size="small" value={filters.part_code} onChange={e => setFilters(p => ({...p, part_code: e.target.value}))} sx={selSx} MenuProps={menuPaperSx}>
                  <MenuItem value="all">All Part Codes</MenuItem>
                  {(overview?.filters?.partCodes||[]).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
                <Button onClick={() => setFilters({status:'all',part_code:'all'})} size="small" sx={{ borderRadius: '9px', color: theme.text2, border, textTransform: 'none', px: 1.8, fontSize: '0.74rem' }}>Reset</Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.8}>
              {[
                [`${fmt(overview?.transparency?.uploadedTotal||overview?.kpis?.totalEntries)} uploaded`, 'rgba(56,189,248,0.12)', isDark?'#bae6fd':'#1d4ed8'],
                [`${fmt(overview?.transparency?.mappedTotal)} geo-mapped`, 'rgba(167,139,250,0.12)', isDark?'#ddd6fe':'#5b21b6'],
                [`${fmt(overview?.kpis?.totalCities)} cities`, 'rgba(34,197,94,0.12)', isDark?'#bbf7d0':'#14532d'],
              ].map(([l,bg,c]) => (
                <Chip key={l} label={l} size="small" sx={{ background: bg, color: c, fontSize: '0.65rem', height: 22, border: 'none' }} />
              ))}
            </Stack>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '11px', fontSize: '0.8rem' }}>{error}</Alert>}
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { background: isDark?'#3b82f6':'#2563eb' } }} />}

          {/* System Alerts */}
          {(overview?.alerts||[]).length > 0 && (
            <Stack spacing={1} mb={2}>
              {overview.alerts.map((a, i) => (
                <Alert key={i} severity={a.severity||'info'} icon={<WarningAmberIcon fontSize="small" />} sx={{ borderRadius: '11px', fontSize: '0.78rem' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{a.title}</Typography>
                  <Typography sx={{ fontSize: '0.73rem', mt: 0.2 }}>{a.description}</Typography>
                </Alert>
              ))}
            </Stack>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} xl={8}>
              <Grid container spacing={2}>
                {/* Transparency + Quality + Health */}
                <Grid item xs={12}><TransparencyCard transparency={overview?.transparency} /></Grid>
                <Grid item xs={12} md={6}><DataQualityCard quality={overview?.dataQuality} /></Grid>
                <Grid item xs={12} md={6}><HealthCard health={overview?.health} /></Grid>

                {/* KPI Cards */}
                {[
                  { title:'Unique Part Codes', value:fmt(overview?.kpis?.uniquePartCodes), subtitle:`${fmt(overview?.kpis?.totalEntries)} analytics records`, accent:'#38bdf8', icon:MemoryOutlinedIcon, onClick:()=>openDetail({level:'dashboard'}) },
                  { title:'OK Count', value:fmt(overview?.kpis?.okCount), subtitle:'Inspect OK-heavy part codes', accent:'#22c55e', icon:TaskAltOutlinedIcon, onClick:()=>openDetail({level:'dashboard',status:'OK'}) },
                  { title:'NFF Count', value:fmt(overview?.kpis?.nffCount), subtitle:'Inspect NFF-heavy part codes', accent:'#f59e0b', icon:ReportProblemOutlinedIcon, onClick:()=>openDetail({level:'dashboard',status:'NFF'}) },
                  { title:'Scrap Count', value:fmt(overview?.kpis?.scrapCount), subtitle:'Scrapped / rejected PCBs', accent:'#ef4444', icon:ReportProblemOutlinedIcon, onClick:()=>openDetail({level:'dashboard',status:'SCRAP'}) },
                  { title:'WIP Count', value:fmt(overview?.kpis?.wipCount), subtitle:'Track pending / incomplete', accent:'#a78bfa', icon:HourglassBottomOutlinedIcon, badge:'In Progress', onClick:()=>openDetail({level:'dashboard',status:'WIP'}) },
                  { title:'Top State / City', value:overview?.kpis?.topState||'No data', subtitle:overview?.kpis?.topCity||'—', accent:'#a78bfa', icon:FmdGoodOutlinedIcon, onClick:()=>openState(overview?.kpis?.topState) },
                ].map((k,i) => (
                  <Grid item xs={12} sm={6} lg={i===5?12:4} key={k.title}>
                    <KpiCard {...k} />
                  </Grid>
                ))}

                {/* Insights */}
                <Grid item xs={12}><InsightsCard insights={overview?.insights} /></Grid>

                {/* Status Donut */}
                <Grid item xs={12} md={6}>
                  <SectionCard title="Status Split" subtitle="OK / NFF / Scrap / WIP across all records" actionLabel="Open part codes" onAction={() => router.push('/analytics')}>
                    <Box sx={{ height: 280 }}>
                      {(overview?.status||[]).some(s=>s.value>0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={overview.status} dataKey="value" nameKey="name" innerRadius={68} outerRadius={105} paddingAngle={3}
                              label={({cx,cy,midAngle,innerRadius,outerRadius,percent})=>{
                                if(percent<0.05)return null
                                const r=innerRadius+(outerRadius-innerRadius)*0.5
                                const x=cx+r*Math.cos(-midAngle*Math.PI/180)
                                const y=cy+r*Math.sin(-midAngle*Math.PI/180)
                                return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={800}>{`${(percent*100).toFixed(0)}%`}</text>
                              }} labelLine={false}>
                              {overview.status.map(e=><Cell key={e.name} fill={SC[e.name]||'#64748b'}/>)}
                            </Pie>
                            <Tooltip {...TT} formatter={v=>[fmt(v),'Records']} />
                            <Legend wrapperStyle={{color:theme.text2,paddingTop:12,fontSize:12}} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%" flexDirection="column" gap={1}>
                          <Typography sx={{fontSize:'1.5rem',opacity:0.15}}>📊</Typography>
                          <Typography sx={{color:theme.text4,fontSize:'0.76rem'}}>Upload data to see status breakdown</Typography>
                        </Box>
                      )}
                    </Box>
                  </SectionCard>
                </Grid>

                {/* Monthly Trend */}
                <Grid item xs={12} md={6}>
                  <SectionCard title="Monthly Repair Trend" subtitle="OK / NFF / Scrap / WIP by month" actionLabel="Open analytics" onAction={() => router.push('/analytics')}>
                    <Box sx={{ height: 280, overflow: 'hidden' }}>
                      {(overview?.trends||[]).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={overview.trends} margin={{top:8,right:12,left:0,bottom:6}}>
                            <CartesianGrid stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} vertical={false} />
                            <XAxis dataKey="month" tick={{fill:theme.text3,fontSize:10}} axisLine={false} tickLine={false} />
                            <YAxis tick={{fill:theme.text3,fontSize:10}} axisLine={false} tickLine={false} width={34} />
                            <Tooltip {...TT} formatter={(v,n)=>[fmt(v),n]} />
                            <Legend wrapperStyle={{color:theme.text2,fontSize:11}} />
                            <Line type="monotone" dataKey="ok_count"  stroke="#22c55e" strokeWidth={2.5} dot={{r:3,fill:'#22c55e'}} name="OK" />
                            <Line type="monotone" dataKey="nff_count" stroke="#f59e0b" strokeWidth={2.5} dot={{r:3,fill:'#f59e0b'}} name="NFF" />
                            <Line type="monotone" dataKey="scrap_count" stroke="#ef4444" strokeWidth={2.5} dot={{r:3,fill:'#ef4444'}} name="Scrap" />
                            <Line type="monotone" dataKey="wip_count" stroke="#a78bfa" strokeWidth={2.5} dot={{r:3,fill:'#a78bfa'}} name="WIP" />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%" flexDirection="column" gap={1}>
                          <Typography sx={{fontSize:'1.5rem',opacity:0.15}}>📈</Typography>
                          <Typography sx={{color:theme.text4,fontSize:'0.76rem'}}>Trend data appears after upload</Typography>
                        </Box>
                      )}
                    </Box>
                  </SectionCard>
                </Grid>

                {/* Components */}
                <Grid item xs={12} md={6}>
                  <SectionCard title="Component Consumption" subtitle="Most replaced components · sorted by frequency" actionLabel="Master Table" onAction={() => router.push('/master-table')}>
                    <Box sx={{ height: 300 }}>
                      {(overview?.components||[]).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={overview.components} layout="vertical" margin={{top:4,right:10,left:8,bottom:4}}>
                            <CartesianGrid horizontal={false} stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} />
                            <XAxis type="number" tick={{fill:theme.text3,fontSize:10}} axisLine={false} tickLine={false} />
                            <YAxis dataKey="component" type="category" width={145} tick={{fill:theme.text2,fontSize:10}} axisLine={false} tickLine={false} />
                            <Tooltip {...TT} formatter={v=>[fmt(v),'Usage']} />
                            <Bar dataKey="total_count" radius={[0,6,6,0]}>
                              {(overview.components).map((e,i)=><Cell key={e.component} fill={COLORS[i%COLORS.length]}/>)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height="100%" flexDirection="column" gap={1}>
                          <Typography sx={{fontSize:'1.5rem',opacity:0.15}}>🔧</Typography>
                          <Typography sx={{color:theme.text4,fontSize:'0.76rem'}}>Component data appears after upload</Typography>
                        </Box>
                      )}
                    </Box>
                  </SectionCard>
                </Grid>

                {/* Top States + Cities */}
                <Grid item xs={12} md={6}>
                  <SectionCard title="Top States & Cities" subtitle="PCB volume by geography" actionLabel="Map View" onAction={() => router.push('/map-analytics')}>
                    <Box sx={{ height: 140, mb: 1.5 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(overview?.topStates||[]).map(s=>({name:s.state,total:s.total}))} layout="vertical" margin={{top:4,right:10,left:8,bottom:4}}>
                          <CartesianGrid horizontal={false} stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} />
                          <XAxis type="number" tick={{fill:theme.text3,fontSize:9}} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" width={100} tick={{fill:theme.text2,fontSize:9}} axisLine={false} tickLine={false} />
                          <Tooltip {...TT} formatter={v=>[fmt(v),'PCBs']} />
                          <Bar dataKey="total" fill="#38bdf8" radius={[0,5,5,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                    <Divider sx={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.07)', mb: 1.5 }} />
                    <Box sx={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(overview?.topCities||[]).map(c=>({name:c.city,total:c.total}))} layout="vertical" margin={{top:4,right:10,left:8,bottom:4}}>
                          <CartesianGrid horizontal={false} stroke={isDark?'rgba(148,163,184,0.1)':'rgba(15,23,42,0.08)'} />
                          <XAxis type="number" tick={{fill:theme.text3,fontSize:9}} axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" width={100} tick={{fill:theme.text2,fontSize:9}} axisLine={false} tickLine={false} />
                          <Tooltip {...TT} formatter={v=>[fmt(v),'PCBs']} />
                          <Bar dataKey="total" fill="#a78bfa" radius={[0,5,5,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </SectionCard>
                </Grid>
              </Grid>
            </Grid>

            {/* Right: Drill-down panel */}
            <Grid item xs={12} xl={4}>
              <DetailCard
                detail={detail}
                loading={detailLoading}
                onOpenState={openState}
                onOpenCity={openCity}
                onOpenPartCode={openPart}
                onReset={() => openDetail({ level: 'dashboard' })}
                onOpenAnalytics={() => router.push('/analytics')}
                onOpenTable={() => detail?.summary?.partCode && router.push(`/master-table/${detail.summary.partCode}`)}
              />
            </Grid>
          </Grid>
        </Box>
      </Layout>
    </>
  )
}
