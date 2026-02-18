import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Slider } from '@mui/material';

const MARKS = [
  { value: 10, label: '10' },
  { value: 100, label: '100' },
  { value: 250, label: '250' },
  { value: 500, label: '500' },
];

function Settings() {
  const [maxClipboard, setMaxClipboard] = useState(50);

  useEffect(() => {
    window.electron.settings.get().then((s) => {
      setMaxClipboard(s.maxClipboardHistory);
    });
  }, []);

  const handleChange = useCallback((_e, value) => {
    setMaxClipboard(value);
    window.electron.settings.update({ maxClipboardHistory: value });
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#98989d' }}>
          Settings
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, py: 1.5 }}>
        <Typography sx={{ fontSize: 12.5, color: '#f5f5f7', mb: 0.5 }}>
          Max clipboard entries
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#636366', mb: 2 }}>
          How many clipboard items to keep in history
        </Typography>
        <Slider
          value={maxClipboard}
          onChange={handleChange}
          min={10}
          max={500}
          step={10}
          marks={MARKS}
          valueLabelDisplay="auto"
          sx={{
            color: '#0a84ff',
            '& .MuiSlider-markLabel': {
              fontSize: 10,
              color: '#636366',
            },
            '& .MuiSlider-valueLabel': {
              background: '#3a3a3c',
              fontSize: 11,
              borderRadius: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default Settings;
