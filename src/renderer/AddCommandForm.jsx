import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

// eslint-disable-next-line react/prop-types
function AddCommandForm({ onAddCommand }) {
  const [command, setCommand] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!command.trim()) return;
    onAddCommand({ command: command.trim(), description: description.trim() });
    setCommand('');
    setDescription('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <TextField
        margin="dense"
        required
        fullWidth
        label="Command"
        autoFocus
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            fontSize: 13,
            fontFamily: "'SF Mono', 'Menlo', monospace",
          },
        }}
      />
      <TextField
        margin="dense"
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 },
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disableElevation
        sx={{
          mt: 2,
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: 13,
          fontWeight: 500,
          py: 0.75,
        }}
      >
        Add Command
      </Button>
    </Box>
  );
}

export default AddCommandForm;
