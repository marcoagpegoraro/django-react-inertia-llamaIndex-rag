import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

const drawerWidth = 280;

const iconMap = {
  dashboard: <DashboardRoundedIcon />,
  library: <FolderOpenRoundedIcon />,
  policy: <PolicyRoundedIcon />,
  route: <RouteRoundedIcon />,
};

function normalizeUrl(url) {
  return (url || "/").split("?")[0];
}

function isActiveLink(currentPath, href) {
  const normalizedHref = normalizeUrl(href);

  if (normalizedHref === "/") {
    return currentPath === normalizedHref;
  }

  return currentPath === normalizedHref || currentPath.startsWith(normalizedHref);
}

function NavigationSection({ currentPath, items, onNavigate, title }) {
  if (!items?.length) {
    return null;
  }

  return (
    <List
      dense
      subheader={
        <ListSubheader disableGutters disableSticky sx={{ px: 2.5, py: 1.5 }}>
          {title}
        </ListSubheader>
      }
    >
      {items.map((item) => (
        <ListItemButton
          key={item.href}
          selected={isActiveLink(currentPath, item.href)}
          sx={{ borderRadius: 2, mx: 1.5, mb: 0.5 }}
          onClick={() => onNavigate(item.href)}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {iconMap[item.icon] || <DashboardRoundedIcon />}
          </ListItemIcon>
          <ListItemText primary={item.label} secondary={item.caption} />
        </ListItemButton>
      ))}
    </List>
  );
}

export default function AppShell({ children }) {
  const page = usePage();
  const { app = {}, flash = [], routes = {}, shell = {} } = page.props;
  const currentPath = normalizeUrl(page.url);
  const [mobileOpen, setMobileOpen] = useState(false);

  const exampleNavigation = routes.exampleCampaign
    ? [
        {
          label: "Path parameter demo",
          href: routes.exampleCampaign,
          icon: "route",
          caption: "Open a routed detail page",
        },
      ]
    : [];

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPath]);

  const handleNavigate = (href) => {
    if (!href) {
      return;
    }

    if (normalizeUrl(href) === currentPath) {
      setMobileOpen(false);
      return;
    }

    router.get(href);
  };

  const drawerContent = (
    <Box sx={{ display: "flex", minHeight: "100%", flexDirection: "column" }}>
      <Toolbar sx={{ alignItems: "flex-start", px: 2.5, py: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>P</Avatar>
          <Box>
            <Typography variant="h6">{app.name || "Pulseboard"}</Typography>
            <Typography variant="body2" color="text.secondary">
              Django, React, and Inertia
            </Typography>
          </Box>
        </Stack>
      </Toolbar>

      <Divider />

      <NavigationSection
        currentPath={currentPath}
        items={app.navigation || []}
        onNavigate={handleNavigate}
        title="Workspace"
      />

      {exampleNavigation.length > 0 ? (
        <>
          <Divider />
          <NavigationSection
            currentPath={currentPath}
            items={exampleNavigation}
            onNavigate={handleNavigate}
            title="Examples"
          />
        </>
      ) : null}

      <Box sx={{ mt: "auto", px: 2.5, py: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          {app.tagline}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          ml: { sm: `${drawerWidth}px` },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            sx={{ display: { sm: "none" } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuRoundedIcon />
          </IconButton>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {shell.title || app.name || "Pulseboard"}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
              {shell.description || app.tagline}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          open={mobileOpen}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          onClose={() => setMobileOpen(false)}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          open
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          {flash.length > 0 ? (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {flash.map((message, index) => (
                <Alert
                  key={`${message.text}-${index}`}
                  severity={message.level || "info"}
                  variant="filled"
                >
                  {message.text}
                </Alert>
              ))}
            </Stack>
          ) : null}

          {children}
        </Container>
      </Box>
    </Box>
  );
}
