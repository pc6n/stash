import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import TerminalIcon from '@mui/icons-material/Terminal';

interface SideMenuProps {
  width: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ITEMS = [
  { label: 'Clipboard', icon: ContentPasteIcon, to: '/' },
  { label: 'Commands', icon: TerminalIcon, to: '/shell' },
];

function SideMenu({ width, open, setOpen }: SideMenuProps) {
  const location = useLocation();

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={() => setOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          width,
          background: '#1c1c1e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          pt: '48px',
        },
        '& .MuiBackdrop-root': { background: 'transparent' },
      }}
    >
      <List sx={{ px: 1, py: 0.5 }}>
        {ITEMS.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to;
          return (
            <ListItemButton
              key={to}
              component={Link}
              to={to}
              onClick={() => setOpen(false)}
              sx={{
                borderRadius: 1.5,
                mb: 0.25,
                py: 0.75,
                px: 1.5,
                color: active ? '#f5f5f7' : '#98989d',
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&:hover': { background: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                <Icon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}

export default SideMenu;
