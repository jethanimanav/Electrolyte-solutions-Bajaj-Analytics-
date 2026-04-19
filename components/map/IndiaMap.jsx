import { useState, useEffect, useMemo, memo } from 'react'
import { Box, Typography, Skeleton, Fade, Stack } from '@mui/material'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps'
import { geoCentroid } from 'd3-geo'
import { findBestStateMatch } from '../../lib/map-utils'

const GEO_URL = '/maps/india-states.geojson'

// Major Indian states/UTs that should always show labels
const LABELED_STATES = new Set([
  'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan',
  'Gujarat', 'Karnataka', 'Tamil Nadu', 'West Bengal',
  'Bihar', 'Odisha', 'Chhattisgarh', 'Jharkhand',
  'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab',
  'Haryana', 'Uttarakhand', 'Assam', 'Delhi'
])

const getFill = (total, max, isActive, hasData) => {
  if (isActive) return '#38bdf8'
  if (!total) return hasData ? '#1a2744' : '#141e30'
  const ratio = Math.max(0.15, total / max)
  return `rgba(56, 189, 248, ${Math.min(0.92, ratio * 0.7 + 0.22)})`
}

const IndiaMap = ({ states = [], activeState, onStateClick }) => {
  const [geoData, setGeoData] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [loading, setLoading] = useState(true)

  const stateMap = useMemo(() => {
    return Object.fromEntries(states.map(s => [s.state, s]))
  }, [states])

  const max = useMemo(() => Math.max(...states.map(s => s.total), 1), [states])
  const hasAnyData = states.length > 0

  useEffect(() => {
    fetch(GEO_URL)
      .then(res => res.json())
      .then(data => {
        const stateKeys = Object.keys(stateMap)
        const enrichedFeatures = data.features.map(feature => {
          const geoName = feature.properties.NAME_1
          const matchedName = findBestStateMatch(geoName, stateKeys)
          return {
            ...feature,
            properties: {
              ...feature.properties,
              _matchedName: matchedName,
              _centroid: geoCentroid(feature)
            }
          }
        })
        setGeoData({ ...data, features: enrichedFeatures })
        setLoading(false)
      })
      .catch(err => {
        console.error('Map loading error:', err)
        setLoading(false)
      })
  }, [stateMap])

  if (loading) {
    return (
      <Box sx={{ width: '100%', height: 740 }}>
        <Skeleton variant="text" sx={{ width: '40%', height: 40, mb: 1, borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={680} sx={{ borderRadius: 4 }} animation="wave" />
      </Box>
    )
  }

  const hoveredMetrics = hovered ? stateMap[hovered.properties?._matchedName] : null
  const hoveredName = hovered?.properties?.NAME_1
  const hoveredMatchedName = hovered?.properties?._matchedName

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
        <Box>
          <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
            Geographic PCB Distribution
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mt: 0.5 }}>
            Interactive state-wise analysis · hover for insights, click to drill down.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ 
        position: 'relative', 
        borderRadius: 5, 
        background: 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 30%), linear-gradient(180deg, #0b1526 0%, #030812 100%)', 
        minHeight: 740, 
        border: '1px solid rgba(56, 189, 248, 0.12)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
        cursor: 'default'
      }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1100, center: [82.5, 23.5] }}
          style={{ width: '100%', height: '740px' }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const { _matchedName, _centroid, NAME_1 } = geo.properties
                const metrics = stateMap[_matchedName]
                const isActive = activeState === _matchedName
                const isHovered = hovered?.properties?.NAME_1 === NAME_1
                const shouldLabel = LABELED_STATES.has(NAME_1) || LABELED_STATES.has(_matchedName)
                const hasDataForState = !!metrics

                return (
                  <g key={geo.rsmKey}>
                    <Geography
                      geography={geo}
                      onMouseEnter={() => setHovered(geo)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => _matchedName && onStateClick?.(_matchedName)}
                      style={{
                        default: {
                          fill: getFill(metrics?.total, max, isActive, hasAnyData),
                          stroke: isActive ? '#f8fafc' : 'rgba(148, 163, 184, 0.12)',
                          strokeWidth: isActive ? 1.2 : 0.4,
                          outline: 'none',
                        },
                        hover: {
                          fill: hasDataForState ? '#38bdf8' : '#253552',
                          stroke: '#f8fafc',
                          strokeWidth: 0.8,
                          outline: 'none',
                          cursor: _matchedName ? 'pointer' : 'default',
                        },
                        pressed: { fill: '#0ea5e9', outline: 'none' }
                      }}
                    />
                    
                    {/* Show labels for major states */}
                    {shouldLabel && !isHovered && (
                      <Marker coordinates={_centroid}>
                        <text
                          textAnchor="middle"
                          y={metrics ? -2 : 2}
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: metrics ? '8px' : '7px',
                            fontWeight: metrics ? 700 : 500,
                            fill: metrics ? 'rgba(241, 245, 249, 0.7)' : 'rgba(148, 163, 184, 0.35)',
                            pointerEvents: 'none',
                          }}
                        >
                          {NAME_1}
                        </text>
                        {metrics && (
                          <text
                            textAnchor="middle"
                            y={10}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '7px',
                              fontWeight: 600,
                              fill: 'rgba(56, 189, 248, 0.6)',
                              pointerEvents: 'none',
                            }}
                          >
                            {metrics.total.toLocaleString('en-IN')}
                          </text>
                        )}
                      </Marker>
                    )}
                  </g>
                )
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Dynamic Tooltip */}
        <Fade in={!!hovered}>
          <Box sx={{ 
            position: 'absolute', 
            top: 24, right: 24, width: 280, p: 2.2, 
            borderRadius: 4, 
            backgroundColor: 'rgba(11, 21, 38, 0.94)', 
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(125, 211, 252, 0.18)', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            {hovered && (
              <>
                <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '1rem', mb: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: hoveredMetrics ? '#38bdf8' : '#475569', boxShadow: hoveredMetrics ? '0 0 8px #38bdf8' : 'none' }} />
                  {hoveredName}
                </Typography>
                
                {hoveredMetrics ? (
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>Repair Load</Typography>
                      <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.85rem' }}>{hoveredMetrics.total.toLocaleString('en-IN')} PCBs</Typography>
                    </Box>
                    <Box sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${(hoveredMetrics.total/max)*100}%`, bgcolor: '#38bdf8', transition: 'width 0.4s ease' }} />
                    </Box>
                    <Stack spacing={0.8}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: '#4ade80', fontSize: '0.74rem' }}>✓ OK Volume</Typography>
                        <Typography sx={{ color: '#f8fafc', fontSize: '0.74rem', fontWeight: 600 }}>{hoveredMetrics.ok.toLocaleString('en-IN')}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: '#fbbf24', fontSize: '0.74rem' }}>⚠ NFF Issues</Typography>
                        <Typography sx={{ color: '#f8fafc', fontSize: '0.74rem', fontWeight: 600 }}>{hoveredMetrics.nff.toLocaleString('en-IN')}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography sx={{ color: '#a78bfa', fontSize: '0.74rem' }}>◉ In Progress</Typography>
                        <Typography sx={{ color: '#f8fafc', fontSize: '0.74rem', fontWeight: 600 }}>{hoveredMetrics.wip.toLocaleString('en-IN')}</Typography>
                      </Box>
                    </Stack>
                    {hoveredMatchedName && (
                      <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.65rem' }}>Click to explore cities in {hoveredMatchedName}</Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ width: 20, height: 20, borderRadius: '6px', background: 'rgba(71, 85, 105, 0.3)', display: 'grid', placeItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.6rem' }}>📍</Typography>
                      </Box>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                        State summary
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.72rem', lineHeight: 1.5 }}>
                      No PCB repair records mapped to this state yet. Data appears here once service center branches in {hoveredName} report repairs.
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Fade>

        <Box sx={{ position: 'absolute', bottom: 20, left: 24, pointerEvents: 'none' }}>
          <Typography sx={{ color: 'rgba(148, 163, 184, 0.3)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
            Geospatial Analysis Layer
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default memo(IndiaMap)
