import React, { useState, useEffect } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import { Box, IconButton, Typography, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import PushPinIcon from '@mui/icons-material/PushPin';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ClipboardHistory from './ClipboardHistory';
import SideMenu from './SideMenu';
import ShellCommands from './ShellCommands';
import Settings from './Settings';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#1c1c1e', paper: '#2c2c2e' },
    primary: { main: '#0a84ff' },
    text: { primary: '#f5f5f7', secondary: '#98989d' },
  },
  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    fontSize: 13,
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { background: '#1c1c1e' } },
    },
  },
});

const DRAWER_WIDTH = 200;

function AppShell() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(true);

  useEffect(() => {
    const unsub = window.electron.ipcRenderer.on(
      'navigate',
      (...args: unknown[]) => {
        const path = args[0] as string;
        if (path) navigate(path);
      },
    );
    return () => unsub();
  }, [navigate]);

  const togglePin = () => {
    const next = !isPinned;
    setIsPinned(next);
    window.electron.window.toggleAlwaysOnTop(next);
  };

  const maximizeWindow = () => window.electron.window.maximize();

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <SideMenu
        width={DRAWER_WIDTH}
        open={drawerOpen}
        setOpen={setDrawerOpen}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 40,
            px: 1,
            gap: 0.5,
            background: '#2c2c2e',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            WebkitAppRegion: 'drag',
            flexShrink: 0,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="toggle menu"
            sx={{
              flexShrink: 0,
              color: '#98989d',
              WebkitAppRegion: 'no-drag',
              '&:hover': { color: '#f5f5f7' },
            }}
          >
            <MenuIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography
            variant="body2"
            noWrap
            sx={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              color: '#98989d',
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: 0.3,
              userSelect: 'none',
            }}
          >
            Stash
          </Typography>
          <IconButton
            size="small"
            onClick={togglePin}
            aria-label="toggle pin to top"
            sx={{
              flexShrink: 0,
              color: isPinned ? '#0a84ff' : '#98989d',
              WebkitAppRegion: 'no-drag',
              '&:hover': { color: '#0a84ff' },
            }}
          >
            <PushPinIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={maximizeWindow}
            aria-label="maximize window"
            sx={{
              flexShrink: 0,
              color: '#98989d',
              WebkitAppRegion: 'no-drag',
              '&:hover': { color: '#f5f5f7' },
            }}
          >
            <OpenInFullIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<ClipboardHistory />} />
            <Route path="/shell" element={<ShellCommands />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppShell />
      </Router>
    </ThemeProvider>
  );
}

export default App;
