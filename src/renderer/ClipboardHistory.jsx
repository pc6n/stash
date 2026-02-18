import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  InputBase,
  Snackbar,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import useClipboardCopy from './hooks/useClipboardCopy';

function ClipboardHistory() {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('clipboardHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [query, setQuery] = useState('');
  const { copy, snackbar } = useClipboardCopy();

  useEffect(() => {
    localStorage.setItem('clipboardHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const text = window.electron.clip.read();
        if (text && !history.includes(text)) {
          setHistory((prev) => [text, ...prev]);
        }
      } catch {
        /* silent */
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [history]);

  const filtered = query
    ? history.filter((e) => e.toLowerCase().includes(query.toLowerCase()))
    : history;

  const handleKeyDown = (e, text) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copy(text);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Spotlight-style search */}
      <Box sx={{ p: 1.5, pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            '&:focus-within': {
              border: '1px solid rgba(10,132,255,0.5)',
              background: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: '#636366' }} />
          <InputBase
            placeholder="Search clipboard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            fullWidth
            sx={{
              fontSize: 13,
              color: '#f5f5f7',
              '& ::placeholder': { color: '#636366', opacity: 1 },
            }}
          />
        </Box>
      </Box>

      {/* Entries list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75 }}>
        {filtered.length === 0 && (
          <Typography
            sx={{
              color: '#636366',
              fontSize: 12,
              textAlign: 'center',
              mt: 4,
            }}
          >
            {query ? 'No matches' : 'Clipboard is empty'}
          </Typography>
        )}
        <List dense disablePadding>
          {filtered.map((item, index) => (
            <ListItemButton
              key={`clip-${index}`}
              onClick={() => copy(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              sx={{
                borderRadius: 1.5,
                mx: 0.5,
                mb: 0.25,
                py: 0.75,
                px: 1.5,
                minWidth: 0,
                '&:hover': { background: 'rgba(255,255,255,0.06)' },
                '&:focus-visible': { outline: '2px solid #0a84ff' },
              }}
            >
              <ListItemText
                primary={item}
                sx={{ minWidth: 0 }}
                primaryTypographyProps={{
                  fontSize: 12.5,
                  color: '#f5f5f7',
                  noWrap: true,
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  copy(item);
                }}
                aria-label="copy"
                sx={{
                  flexShrink: 0,
                  ml: 0.5,
                  color: '#636366',
                  '&:hover': { color: '#0a84ff' },
                }}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={1500}
        onClose={snackbar.close}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            background: '#3a3a3c',
            color: '#f5f5f7',
            fontSize: 12,
            borderRadius: 2,
            minWidth: 'auto',
            py: 0.5,
          },
        }}
      />
    </Box>
  );
}

export default ClipboardHistory;
