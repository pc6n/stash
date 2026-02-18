import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AddCommandForm from './AddCommandForm';
import useClipboardCopy from './hooks/useClipboardCopy';
import useSnackbar from './hooks/useSnackbar';

function ShellCommands() {
  const [commands, setCommands] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const { copy, snackbar: copySnack } = useClipboardCopy();
  const actionSnack = useSnackbar();

  const refresh = useCallback(async () => {
    try {
      setCommands(await window.electron.commands.getAll());
    } catch {
      actionSnack.show('Failed to load commands');
    }
  }, [actionSnack]);

  useEffect(() => {
    refresh();
    const unsub = window.electron.ipcRenderer.on('commands:changed', refresh);
    return () => unsub();
  }, [refresh]);

  const addCommand = async (cmd) => {
    try {
      await window.electron.commands.add(cmd);
      await refresh();
    } catch {
      actionSnack.show('Failed to add command');
    }
  };

  const removeCommand = async (index) => {
    try {
      await window.electron.commands.remove(index);
      await refresh();
      actionSnack.show('Command removed');
    } catch {
      actionSnack.show('Failed to remove command');
    }
  };

  const handleKeyDown = (e, text) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copy(text);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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
          Commands
        </Typography>
        <IconButton
          size="small"
          onClick={() => setOpenDialog(true)}
          aria-label="add command"
          sx={{
            color: '#0a84ff',
            '&:hover': { background: 'rgba(10,132,255,0.1)' },
          }}
        >
          <AddIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Add dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="add-cmd-title"
        PaperProps={{
          sx: {
            background: '#2c2c2e',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.08)',
            width: '90vw',
            maxWidth: 360,
          },
        }}
      >
        <DialogTitle
          id="add-cmd-title"
          sx={{ fontSize: 15, fontWeight: 600, color: '#f5f5f7', pb: 0 }}
        >
          Add Command
        </DialogTitle>
        <DialogContent>
          <AddCommandForm
            onAddCommand={(cmd) => {
              addCommand(cmd);
              setOpenDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Commands list */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 0.75 }}>
        {commands.length === 0 && (
          <Typography
            sx={{ color: '#636366', fontSize: 12, textAlign: 'center', mt: 4 }}
          >
            No commands yet
          </Typography>
        )}
        <List dense disablePadding>
          {commands.map((item, index) => (
            <ListItemButton
              key={`${item.command}-${item.description}`}
              onClick={() => copy(item.command)}
              onKeyDown={(e) => handleKeyDown(e, item.command)}
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
                primary={item.command}
                secondary={item.description}
                sx={{ minWidth: 0 }}
                primaryTypographyProps={{
                  fontSize: 12.5,
                  color: '#f5f5f7',
                  fontFamily: "'SF Mono', 'Menlo', monospace",
                  noWrap: true,
                }}
                secondaryTypographyProps={{
                  fontSize: 11,
                  color: '#636366',
                  noWrap: true,
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.25,
                  ml: 1,
                  flexShrink: 0,
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    copy(item.command);
                  }}
                  aria-label="copy command"
                  sx={{ color: '#636366', '&:hover': { color: '#0a84ff' } }}
                >
                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCommand(index);
                  }}
                  aria-label="delete command"
                  sx={{ color: '#636366', '&:hover': { color: '#ff453a' } }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Snackbar
        open={copySnack.open || actionSnack.open}
        autoHideDuration={1500}
        onClose={() => {
          copySnack.close();
          actionSnack.close();
        }}
        message={copySnack.message || actionSnack.message}
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

export default ShellCommands;
