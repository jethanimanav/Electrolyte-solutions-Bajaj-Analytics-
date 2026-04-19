import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import {
  Box, Typography, Grid, Chip, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Alert, Tooltip, Tabs, Tab,
  LinearProgress, IconButton
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import PsychologyIcon from '@mui/icons-material/Psychology'
import VerifiedIcon from '@mui/icons-material/Verified'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Layout from '../components/common/Layout'
import { fetchJson } from '../lib/fetch-json'
import { useTheme } from '../lib/ThemeContext'

// th and td are defined inside the component using live theme values

const FIELD_COLORS = { branch: '#3b82f6', defect: '#f59e0b', status: '#22c55e', component: '#8b5cf6' }
const confColor = (c) => c >= 85 ? '#22c55e' : c >= 60 ? '#f59e0b' : '#ef4444'

export default function CorrectionsPage() {
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
  const th = { color: theme.text5, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', py: 1.2, px: 1.5, fontFamily: 'Inter', background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', whiteSpace: 'nowrap' }
  const td = { color: theme.text2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'}`, fontSize: '0.78rem', py: 1.2, px: 1.5, fontFamily: 'Inter' }
  const [tab, setTab] = useState(0)
  const [flagged, setFlagged] = useState([])
  const [corrections, setCorrections] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fieldFilter, setFieldFilter] = useState('all')
  const [editValues, setEditValues] = useState({}) // flagId -> custom value
  const [saving, setSaving] = useState({})
  const [message, setMessage] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [flagRes, corrRes, statRes] = await Promise.all([
        fetchJson('/api/corrections?type=flagged&status=pending'),
        fetchJson('/api/corrections?type=corrections'),
        fetchJson('/api/corrections?type=stats'),
      ])
      setFlagged(flagRes.flagged || [])
      setCorrections(corrRes.corrections || [])
      setStats(statRes)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const act = async (flagId, action, item) => {
    setSaving(s => ({ ...s, [flagId]: true }))
    const correctedValue = editValues[flagId] || item.suggested_value
    try {
      const data = await fetchJson('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagId, action, correctedValue, field: item.field, originalValue: item.original_value })
      })
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Saved!' })
        setFlagged(f => f.filter(x => x.id !== flagId))
        loadData()
      }
    } catch { setMessage({ type: 'error', text: 'Failed to save' }) }
    finally { setSaving(s => ({ ...s, [flagId]: false })) }
  }

  const deleteCorrection = async (id) => {
    await fetchJson(`/api/corrections?id=${id}`, { method: 'DELETE' })
    loadData()
  }

  const filtered = flagged.filter(f => fieldFilter === 'all' || f.field === fieldFilter)

  return (
    <>
      <Head><title>Corrections — Electrolyte Bajaj</title></Head>
      <Layout>
        <Box>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                <PsychologyIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: theme.text1, fontFamily: 'Inter', letterSpacing: '-0.3px' }}>
                  Auto-Correction System
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.68rem', color: isDark ? theme.text4 : '#64748b' }}>
                Review flagged values · Approve corrections · System learns and auto-fixes future uploads
              </Typography>
            </Box>
            <Button onClick={loadData} size="small" sx={{ color: theme.text3, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontFamily: 'Inter', fontSize: '0.72rem' }}>Refresh</Button>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2, borderRadius: '10px', fontFamily: 'Inter', fontSize: '0.78rem',
              background: message.type === 'success' ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: message.type === 'success' ? '#22c55e' : '#ef4444' }}
              onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {/* Stats cards */}
          {stats && (
            <Grid container spacing={2} mb={3}>
              {[
                { label: 'Pending Review', value: stats.flagged?.pending || 0, color: '#f59e0b', icon: '⚠️', sub: 'Need your decision' },
                { label: 'Auto Fixed', value: parseInt(stats.quality?.auto_fixed || 0) + parseInt(stats.quality?.fuzzy_fixed || 0), color: '#22c55e', icon: '🤖', sub: 'Fixed automatically' },
                { label: 'Rules Learned', value: stats.corrections?.total || 0, color: '#3b82f6', icon: '🧠', sub: 'Corrections stored' },
                { label: 'Times Applied', value: parseInt(stats.corrections?.total_applied || 0), color: '#8b5cf6', icon: '✅', sub: 'Fixes deployed' },
              ].map((s, i) => (
                <Grid item xs={6} md={3} key={i}>
                  <Box sx={{ p: 2.2, borderRadius: '12px', background: '#111827', border: `1px solid ${s.color}18` }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Typography sx={{ fontSize: '1.1rem' }}>{s.icon}</Typography>
                      <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono'" }}>{Number(s.value).toLocaleString()}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: theme.text1, fontFamily: 'Inter' }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: isDark ? theme.text4 : '#64748b' }}>{s.sub}</Typography>
                  </Box>
                </Grid>
              ))}
              {stats.latestUpload && (
                <Grid item xs={12}>
                  <Box sx={{ p: 2.2, borderRadius: '12px', background: '#111827', border: '1px solid rgba(34,197,94,0.18)' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: theme.text1, mb: 0.3, fontFamily: 'Inter' }}>Last Upload Summary</Typography>
                    <Typography sx={{ fontSize: '0.64rem', color: theme.text3, mb: 1.5, fontFamily: 'Inter' }}>
                      {stats.latestUpload.original_name} on {new Date(stats.latestUpload.uploaded_at).toLocaleDateString('en-IN')} {new Date(stats.latestUpload.uploaded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Grid container spacing={1.2}>
                      {[
                        { label: 'Rows', value: stats.latestUpload.total_rows, color: '#3b82f6' },
                        { label: 'Auto-fixed', value: Number(stats.latestUpload.auto_fixed || 0) + Number(stats.latestUpload.fuzzy_fixed || 0), color: '#22c55e' },
                        { label: 'Flagged', value: stats.latestUpload.flagged || 0, color: '#f59e0b' },
                        { label: 'WIP', value: stats.latestUpload.wip_rows || 0, color: '#a78bfa' },
                      ].map((item) => (
                        <Grid item xs={6} md={3} key={item.label}>
                          <Box sx={{ p: 1.2, borderRadius: '9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Typography sx={{ color: item.color, fontWeight: 800, fontSize: '0.95rem', fontFamily: "'JetBrains Mono'" }}>{Number(item.value || 0).toLocaleString()}</Typography>
                            <Typography sx={{ color: theme.text3, fontSize: '0.62rem', mt: 0.25, fontFamily: 'Inter' }}>{item.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {/* How it works banner */}
          <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {[
              { icon: '📤', step: '1', title: 'Upload Excel', desc: 'System reads every cell value' },
              { icon: '🔍', step: '2', title: 'Fuzzy Match', desc: '≥85% confidence → auto-fixed silently' },
              { icon: '⚠️', step: '3', title: 'Flag Unknown', desc: '60–84% confidence → flagged here for you' },
              { icon: '✅', step: '4', title: 'You Approve', desc: 'Decision saved → never flagged again' },
              { icon: '🧠', step: '5', title: 'System Learns', desc: 'Auto-fixed in all future uploads' },
            ].map((s, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <Typography sx={{ fontSize: '1.2rem' }}>{s.icon}</Typography>
                <Box>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#c4b5fd', fontFamily: 'Inter' }}>Step {s.step}: {s.title}</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: theme.text3, fontFamily: 'Inter' }}>{s.desc}</Typography>
                </Box>
                {i < 4 && <Typography sx={{ color: theme.text5, ml: 1, fontSize: '0.8rem' }}>→</Typography>}
              </Box>
            ))}
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.07)', mb: 2.5 }}>
            <Tabs value={tab} onChange={(e, v) => setTab(v)}
              sx={{ '& .MuiTab-root': { color: isDark ? theme.text4 : '#64748b', fontSize: '0.8rem', textTransform: 'none', minWidth: 0, mr: 3 }, '& .Mui-selected': { color: theme.text1 }, '& .MuiTabs-indicator': { background: '#3b82f6' } }}>
              <Tab label={`Pending Review (${flagged.length})`} />
              <Tab label={`Correction Rules (${corrections.length})`} />
            </Tabs>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#3b82f6' }} /></Box>
          ) : tab === 0 ? (
            /* ── PENDING REVIEW TAB ── */
            <Box>
              {/* Field filter */}
              <Box display="flex" gap={1.5} mb={2} alignItems="center">
                <Typography sx={{ fontSize: '0.72rem', color: isDark ? theme.text4 : '#64748b' }}>Filter by field:</Typography>
                {['all','branch','defect','status','component'].map(f => (
                  <Chip key={f} label={f === 'all' ? 'All' : f} size="small" onClick={() => setFieldFilter(f)}
                    sx={{ height: 24, fontSize: '0.65rem', fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer',
                      background: fieldFilter === f ? `${FIELD_COLORS[f] || '#3b82f6'}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${fieldFilter === f ? `${FIELD_COLORS[f] || '#3b82f6'}35` : 'rgba(255,255,255,0.08)'}`,
                      color: fieldFilter === f ? (FIELD_COLORS[f] || '#3b82f6') : '#64748b' }} />
                ))}
              </Box>

              {filtered.length === 0 ? (
                <Box sx={{ p: 4, borderRadius: '12px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1 }}>🎉</Typography>
                  <Typography sx={{ fontWeight: 600, color: '#22c55e', fontSize: '0.9rem', fontFamily: 'Inter' }}>All clear! No pending reviews.</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: isDark ? theme.text4 : '#64748b', mt: 0.5 }}>Upload new data to check for issues.</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 2.5, borderRadius: '12px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: theme.text1, fontFamily: 'Inter', mb: 0.3 }}>
                    {filtered.length} values need your decision
                  </Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: isDark ? theme.text4 : '#64748b', mb: 2 }}>
                    Approve with the suggested fix, type your own, or reject to ignore permanently
                  </Typography>
                  <TableContainer sx={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: 'rgba(0,0,0,0.2)' }}>
                          {['Field','Original Value','Suggested Fix','Confidence','Seen','Your Decision'].map(h => (
                            <TableCell key={h} sx={th}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filtered.map(item => {
                          const conf = parseFloat(item.confidence || 0)
                          const cc = confColor(conf)
                          const isSaving = saving[item.id]
                          return (
                            <TableRow key={item.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                              <TableCell sx={{ ...td }}>
                                <Chip label={item.field} size="small" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, background: `${FIELD_COLORS[item.field] || '#64748b'}12`, color: FIELD_COLORS[item.field] || '#64748b', border: `1px solid ${FIELD_COLORS[item.field] || '#64748b'}22` }} />
                              </TableCell>
                              <TableCell sx={{ ...td, color: '#ef4444', fontFamily: "'JetBrains Mono'" }}>
                                {item.original_value}
                              </TableCell>
                              <TableCell sx={{ ...td, minWidth: 200 }}>
                                <TextField
                                  size="small"
                                  defaultValue={item.suggested_value || ''}
                                  placeholder={item.suggested_value ? '' : 'Type correct value...'}
                                  onChange={e => setEditValues(v => ({ ...v, [item.id]: e.target.value }))}
                                  sx={{ width: '100%',
                                    '& .MuiOutlinedInput-root': { color: '#22c55e', fontSize: '0.76rem', fontFamily: "'JetBrains Mono'", background: 'rgba(34,197,94,0.04)', borderRadius: '7px',
                                      '& fieldset': { borderColor: 'rgba(34,197,94,0.2)' },
                                      '&:hover fieldset': { borderColor: 'rgba(34,197,94,0.4)' },
                                      '&.Mui-focused fieldset': { borderColor: '#22c55e' } },
                                    '& input::placeholder': { color: theme.text5, opacity: 1 }
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={td}>
                                {item.suggested_value ? (
                                  <Box>
                                    <Box display="flex" alignItems="center" gap={0.5} mb={0.3}>
                                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cc, fontFamily: "'JetBrains Mono'" }}>{conf}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={conf}
                                      sx={{ height: 3, borderRadius: 2, background: isDark?'rgba(255,255,255,0.07)':'rgba(15,23,42,0.08)', '& .MuiLinearProgress-bar': { background: cc } }} />
                                  </Box>
                                ) : (
                                  <Typography sx={{ fontSize: '0.65rem', color: '#ef4444', fontFamily: 'Inter' }}>No match found</Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ ...td, fontFamily: "'JetBrains Mono'", color: theme.text3 }}>
                                {item.occurrences}×
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5 }}>
                                {isSaving ? (
                                  <CircularProgress size={16} sx={{ color: '#3b82f6' }} />
                                ) : (
                                  <Box display="flex" gap={0.8}>
                                    <Tooltip title="Approve — save and auto-fix in future">
                                      <IconButton onClick={() => act(item.id, 'approve', item)} size="small"
                                        sx={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', borderRadius: '7px', p: 0.6, '&:hover': { background: 'rgba(34,197,94,0.15)' } }}>
                                        <CheckIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Reject — keep original, never flag again">
                                      <IconButton onClick={() => act(item.id, 'reject', item)} size="small"
                                        sx={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: '7px', p: 0.6, '&:hover': { background: 'rgba(239,68,68,0.15)' } }}>
                                        <CloseIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Ignore for now">
                                      <IconButton onClick={() => act(item.id, 'ignore', item)} size="small"
                                        sx={{ color: theme.text4, background: 'rgba(255,255,255,0.04)', borderRadius: '7px', p: 0.6, '&:hover': { background: 'rgba(255,255,255,0.08)' } }}>
                                        <RemoveCircleOutlineIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            /* ── CORRECTION RULES TAB ── */
            <Box>
              <Box sx={{ p: 2.5, borderRadius: '12px', background: '#111827', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: theme.text1, fontFamily: 'Inter', mb: 0.3 }}>
                  {corrections.length} active correction rules
                </Typography>
                <Typography sx={{ fontSize: '0.62rem', color: isDark ? theme.text4 : '#64748b', mb: 2 }}>
                  These rules are applied automatically to every future upload
                </Typography>
                <TableContainer sx={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: 'rgba(0,0,0,0.2)' }}>
                        {['Field','Original','Fixed To','Confidence','Method','Applied','Action'].map(h => (
                          <TableCell key={h} sx={th}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {corrections.map(c => (
                        <TableRow key={c.id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                          <TableCell sx={td}>
                            <Chip label={c.field} size="small" sx={{ height: 18, fontSize: '0.58rem', fontWeight: 700, background: `${FIELD_COLORS[c.field] || '#64748b'}12`, color: FIELD_COLORS[c.field] || '#64748b', border: `1px solid ${FIELD_COLORS[c.field] || '#64748b'}22` }} />
                          </TableCell>
                          <TableCell sx={{ ...td, color: '#ef4444', fontFamily: "'JetBrains Mono'" }}>{c.original_value}</TableCell>
                          <TableCell sx={{ ...td, color: '#22c55e', fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{c.corrected_value}</TableCell>
                          <TableCell sx={{ ...td, color: confColor(c.confidence), fontFamily: "'JetBrains Mono'" }}>{c.confidence}%</TableCell>
                          <TableCell sx={td}>
                            <Chip label={c.method} size="small" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: theme.text3, border: '1px solid rgba(255,255,255,0.07)' }} />
                          </TableCell>
                          <TableCell sx={{ ...td, fontFamily: "'JetBrains Mono'", color: '#3b82f6' }}>{c.times_applied}×</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)', py: 1.2, px: 1.5 }}>
                            <Tooltip title="Delete this rule">
                              <IconButton onClick={() => deleteCorrection(c.id)} size="small"
                                sx={{ color: theme.text5, p: 0.5, '&:hover': { color: '#ef4444', background: 'rgba(239,68,68,0.08)' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </Box>
      </Layout>
    </>
  )
}
