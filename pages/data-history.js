import { useState, useEffect } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, LinearProgress, Tooltip
} from '@mui/material'
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import Layout from '../components/common/Layout'
import { fetchJson } from '../lib/fetch-json'
import { useTheme } from '../lib/ThemeContext'

const fmt = v => Number(v || 0).toLocaleString('en-IN')

export default function DataHistoryPage() {
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const B = `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.1)'}`
  const CARD = isDark
    ? 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)'
    : '#ffffff'
  const th = {
    color: isDark ? '#334155' : theme.text4,
    borderBottom: B, fontSize: '0.6rem', fontWeight: 700,
    letterSpacing: '1px', textTransform: 'uppercase',
    py: 1.2, px: 1.5, fontFamily: 'Inter',
    background: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
  }
  const td = {
    color: isDark ? '#94a3b8' : theme.text2,
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.07)'}`,
    fontSize: '0.78rem', py: 1.2, px: 1.5, fontFamily: 'Inter',
  }

  useEffect(() => {
    fetchJson('/api/data-history')
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <>
      <Head><title>Data History — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" height={380}>
          <Box textAlign="center">
            <CircularProgress sx={{ color: '#3b82f6', mb: 2 }} />
            <Typography sx={{ color: isDark ? '#475569' : theme.text4, fontSize: '0.82rem', fontFamily: 'Inter' }}>
              Loading database stats...
            </Typography>
          </Box>
        </Box>
      </Layout>
    </>
  )

  const counts = stats?.counts || {}
  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0)

  // Table groups with enhanced labels
  const tableGroups = [
    {
      label: 'Core PCB Data',
      color: '#3b82f6',
      icon: MemoryOutlinedIcon,
      tables: [
        { key: 'pcb_data',           label: 'PCB Repair Records',   desc: 'All repair entries from Excel / dump' },
        { key: 'consolidated_data',  label: 'Consolidated Data',    desc: 'Raw nexscan source table' },
        { key: 'bom',                label: 'Bill of Materials',     desc: 'Component registry per part code' },
        { key: 'dc_numbers',         label: 'DC Numbers',           desc: 'Dispatch challan references' },
      ],
    },
    {
      label: 'Reference Tables',
      color: '#22c55e',
      icon: TableChartOutlinedIcon,
      tables: [
        { key: 'pcb_master',         label: 'PCB Master',           desc: 'Part codes & product descriptions' },
        { key: 'component_data',     label: 'Component Data',       desc: 'Aggregated component consumption' },
        { key: 'engineers',          label: 'Engineers',            desc: 'Technician / engineer registry' },
        { key: 'users',              label: 'Users',                desc: 'System user accounts' },
        { key: 'status_data',        label: 'Status Data',          desc: 'Status categorization reference' },
        { key: 'sheets',             label: 'Sheets',               desc: 'Source sheet tracking' },
      ],
    },
    {
      label: 'System & Quality',
      color: '#8b5cf6',
      icon: StorageOutlinedIcon,
      tables: [
        { key: 'corrections',        label: 'Corrections',          desc: 'Approved auto-correction rules' },
        { key: 'flagged_values',     label: 'Flagged Values',       desc: 'Pending human review' },
        { key: 'upload_history',     label: 'Upload History',       desc: 'All import log entries' },
        { key: 'upload_quality_log', label: 'Quality Issues',       desc: 'Legacy upload issue records' },
      ],
    },
  ]

  // Largest tables for visual bar chart
  const allTableEntries = tableGroups.flatMap(g => g.tables.map(t => ({ ...t, color: g.color, count: counts[t.key] || 0 })))
  const maxCount = Math.max(...allTableEntries.map(t => t.count), 1)

  return (
    <>
      <Head><title>Data History — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* Header */}
          <Box mb={3}>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: isDark ? '#f1f5f9' : theme.text1, letterSpacing: '-0.3px', mb: 0.2, fontFamily: 'Inter' }}>
              Data History
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: isDark ? '#475569' : isDark ? theme.text4 : '#64748b' }}>
              Overview of all database tables, record counts, and import activity
            </Typography>
          </Box>

          {/* Top KPI cards */}
          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Records',  value: fmt(totalRows),                                                                                icon: StorageOutlinedIcon,      color: '#3b82f6' },
              { label: 'Tables',         value: Object.keys(counts).filter(k => counts[k] > 0).length,                                        icon: TableChartOutlinedIcon,   color: '#22c55e' },
              { label: 'Database Size',  value: stats?.dbSize || 'N/A',                                                                        icon: CloudDoneOutlinedIcon,    color: '#8b5cf6' },
              { label: 'Last Import',    value: stats?.lastFetch ? new Date(stats.lastFetch).toLocaleDateString('en-IN') : 'No data yet',      icon: AccessTimeOutlinedIcon,   color: '#f59e0b' },
            ].map(card => {
              const Icon = card.icon
              return (
                <Grid item xs={6} md={3} key={card.label}>
                  <Box sx={{ p: 2.2, borderRadius: '12px', background: CARD, border: `1px solid ${card.color}22`,
                    transition: 'all 0.2s', '&:hover': { transform: 'translateY(-1px)', boxShadow: isDark ? `0 6px 20px rgba(0,0,0,0.4)` : `0 4px 14px rgba(0,0,0,0.09)` } }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Icon sx={{ color: card.color, fontSize: 18 }} />
                      <Typography sx={{ fontSize: '0.65rem', color: isDark ? '#475569' : isDark ? theme.text4 : '#64748b' }}>{card.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: card.color, fontFamily: "'JetBrains Mono',monospace" }}>
                      {card.value}
                    </Typography>
                  </Box>
                </Grid>
              )
            })}
          </Grid>

          {/* Table groups */}
          <Grid container spacing={2} mb={3}>
            {tableGroups.map(group => {
              const Icon = group.icon
              const groupTotal = group.tables.reduce((s, t) => s + (counts[t.key] || 0), 0)
              return (
                <Grid item xs={12} md={4} key={group.label}>
                  <Box sx={{ p: 2.5, borderRadius: '14px', background: CARD, border: `1px solid ${group.color}22`, height: '100%' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.4}>
                      <Icon sx={{ color: group.color, fontSize: 17 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: isDark ? '#f1f5f9' : theme.text1, fontFamily: 'Inter' }}>{group.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.62rem', color: isDark ? '#475569' : isDark ? theme.text4 : '#64748b', mb: 1.8 }}>
                      {fmt(groupTotal)} total records
                    </Typography>
                    {group.tables.map(t => {
                      const count = counts[t.key] || 0
                      const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0
                      return (
                        <Box key={t.key} sx={{ mb: 1.4 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.4}>
                            <Box>
                              <Typography sx={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : theme.text2, fontFamily: 'Inter', fontWeight: 500 }}>{t.label}</Typography>
                              <Typography sx={{ fontSize: '0.6rem', color: isDark ? '#334155' : theme.text5, fontFamily: 'Inter' }}>{t.desc}</Typography>
                            </Box>
                            <Chip label={fmt(count)} size="small"
                              sx={{ background: `${group.color}15`, border: `1px solid ${group.color}30`,
                                color: group.color, fontFamily: "'JetBrains Mono',monospace",
                                fontSize: '0.68rem', fontWeight: 700, height: 22 }} />
                          </Box>
                          <Box sx={{ height: 3, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <Box sx={{ width: `${Math.min(barPct, 100)}%`, height: '100%', background: group.color, borderRadius: 999, transition: 'width 1s ease', opacity: count === 0 ? 0.2 : 1 }} />
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Grid>
              )
            })}
          </Grid>

          {/* Upload History */}
          <Box sx={{ p: 2.5, borderRadius: '12px', background: CARD, border: B }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: isDark ? '#f1f5f9' : theme.text1, mb: 2, fontFamily: 'Inter' }}>
              Upload History
            </Typography>
            {(!stats?.uploads || stats.uploads.length === 0) ? (
              <Box textAlign="center" py={4}>
                <Typography sx={{ color: isDark ? '#334155' : theme.text5, fontSize: '0.78rem', fontFamily: 'Inter' }}>
                  No upload records yet — import a file to see history here
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'}` }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['#','Filename','Total Rows','OK','NFF','WIP','Auto-Fixed','Status','Uploaded At'].map(h => (
                        <TableCell key={h} sx={th}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.uploads.map((row, i) => (
                      <TableRow key={row.id} sx={{ '&:hover': { background: isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.03)' } }}>
                        <TableCell sx={{ ...td, color: isDark ? '#334155' : theme.text5 }}>{i + 1}</TableCell>
                        <TableCell sx={{ ...td, color: isDark ? '#f1f5f9' : theme.text1, fontWeight: 500, maxWidth: 200 }}>
                          <Typography sx={{ fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.original_name || row.filename}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...td, color: '#3b82f6', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{fmt(row.total_rows)}</TableCell>
                        <TableCell sx={{ ...td, color: '#22c55e', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(row.ok_rows)}</TableCell>
                        <TableCell sx={{ ...td, color: '#f59e0b', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(row.nff_rows)}</TableCell>
                        <TableCell sx={{ ...td, color: '#a78bfa', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(row.wip_rows)}</TableCell>
                        <TableCell sx={{ ...td, color: '#22c55e', fontFamily: "'JetBrains Mono',monospace" }}>
                          {fmt((row.auto_fixed || 0) + (row.fuzzy_fixed || 0))}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.07)'}`, py: 1.2, px: 1.5 }}>
                          <Chip label={row.status || 'pending'} size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'Inter',
                              background: row.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                              border: `1px solid ${row.status === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
                              color: row.status === 'success' ? '#22c55e' : '#f59e0b' }} />
                        </TableCell>
                        <TableCell sx={{ ...td, fontSize: '0.7rem', whiteSpace: 'nowrap', color: isDark ? '#475569' : theme.text4 }}>
                          {row.uploaded_at ? (
                            new Date(row.uploaded_at).toLocaleDateString('en-IN') + ' ' +
                            new Date(row.uploaded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          ) : '—'}
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
