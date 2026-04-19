import { Box, Typography, Select, MenuItem, TextField, InputAdornment, Button, Chip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'

const B = '1px solid rgba(148,163,184,0.14)'
const CARD = 'linear-gradient(180deg, rgba(13,20,34,0.96) 0%, rgba(9,14,25,0.96) 100%)'

export default function FilterBar({ filters, onFilterChange, onReset, pcbList = [] }) {
  const hasActive = filters.status !== 'all' || filters.part_code !== 'all' || filters.search

  return (
    <Box sx={{ p:2, borderRadius:'12px', background:CARD, border:B, mb:2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <FilterListIcon sx={{ color:'#475569', fontSize:16 }} />
        <Typography sx={{ fontWeight:600, fontSize:'0.78rem', color:'#f1f5f9' }}>Filters</Typography>
        {hasActive && <Chip label="Active" size="small" sx={{ height:18, fontSize:'0.55rem', fontWeight:700, background:'rgba(59,130,246,0.1)', color:'#3b82f6', border:'1px solid rgba(59,130,246,0.2)' }} />}
      </Box>
      <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
        <TextField size="small" placeholder="Search PCB, branch..." value={filters.search||''} onChange={e => onFilterChange({ search: e.target.value })}
          sx={{ minWidth:200, '& .MuiOutlinedInput-root':{ color:'#f1f5f9', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'0.76rem', '& fieldset':{ borderColor:'rgba(255,255,255,0.08)' }, '&:hover fieldset':{ borderColor:'rgba(59,130,246,0.3)' }, '&.Mui-focused fieldset':{ borderColor:'#3b82f6' } }, '& input::placeholder':{ color:'#475569', opacity:1 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color:'#334155', fontSize:15 }} /></InputAdornment> }} />

        <Select size="small" value={filters.status||'all'} onChange={e => onFilterChange({ status: e.target.value })}
          sx={{ minWidth:145, color:'#e2e8f0', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'0.76rem', '.MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.08)' }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(59,130,246,0.3)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline':{ borderColor:'#3b82f6' }, '.MuiSvgIcon-root':{ color:'#475569' } }}
          MenuProps={{ PaperProps:{ sx:{ background:'#0d1626', border:'1px solid rgba(59,130,246,0.12)', borderRadius:'10px', '& .MuiMenuItem-root':{ color:'#94a3b8', fontSize:'0.76rem', '&:hover':{ background:'rgba(59,130,246,0.08)' } } } } }}>
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="OK">✅ OK</MenuItem>
          <MenuItem value="NFF">⚠️ NFF</MenuItem>
          <MenuItem value="WIP">⏳ WIP</MenuItem>
        </Select>

        <Select size="small" value={filters.part_code||'all'} onChange={e => onFilterChange({ part_code: e.target.value })}
          sx={{ minWidth:165, color:'#e2e8f0', borderRadius:'8px', background:'rgba(255,255,255,0.04)', fontSize:'0.76rem', '.MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(255,255,255,0.08)' }, '&:hover .MuiOutlinedInput-notchedOutline':{ borderColor:'rgba(59,130,246,0.3)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline':{ borderColor:'#3b82f6' }, '.MuiSvgIcon-root':{ color:'#475569' } }}
          MenuProps={{ PaperProps:{ sx:{ background:'#0d1626', border:'1px solid rgba(59,130,246,0.12)', borderRadius:'10px', maxHeight:240, '& .MuiMenuItem-root':{ color:'#94a3b8', fontSize:'0.76rem', '&:hover':{ background:'rgba(59,130,246,0.08)' } } } } }}>
          <MenuItem value="all">All Part Codes</MenuItem>
          {Array.from(new Set(pcbList.map(r => r.part_code))).map(pc => (
            <MenuItem key={pc} value={pc}>{pc}</MenuItem>
          ))}
        </Select>

        {hasActive && (
          <Button onClick={onReset} size="small" sx={{ color:'#64748b', border:B, borderRadius:'8px', textTransform:'none', fontSize:'0.72rem', px:1.5, '&:hover':{ color:'#ef4444', borderColor:'rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.05)' } }}>
            Clear Filters
          </Button>
        )}
      </Box>
    </Box>
  )
}
