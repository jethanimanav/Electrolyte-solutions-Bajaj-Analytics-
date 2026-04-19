import { Box } from '@mui/material'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useTheme } from '../../lib/ThemeContext'

export default function Layout({ children, onRefresh }) {
  const router = useRouter()
  const { theme, mode } = useTheme()
  const [key, setKey] = useState(0)

  useEffect(() => { setKey(k => k + 1) }, [router.asPath])

  useEffect(() => {
    document.body.setAttribute('data-theme', mode)
    document.body.style.backgroundColor = theme.bg
  }, [mode, theme.bg])

  const isDark = mode === 'dark'

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: isDark
        ? '#0b0f19'
        : 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 50%, #eff6ff 100%)',
      transition: 'background 0.3s ease',
    }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar onRefresh={onRefresh} />
        <Box
          key={key}
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: { xs: 2, md: 2.5 },
            animation: 'fadeUp 0.3s ease forwards',
            '@keyframes fadeUp': {
              from: { opacity: 0, transform: 'translateY(12px)' },
              to: { opacity: 1, transform: 'translateY(0)' }
            }
          }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
