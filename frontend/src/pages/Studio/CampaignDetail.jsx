import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Head, router } from "@inertiajs/react";

import { formatDate, priorityColors, statusColors } from "../../lib/campaignUi";
import AppShell from "../../layouts/AppShell";

function DetailRow({ primary, secondary }) {
  return (
    <ListItem disableGutters divider>
      <ListItemText primary={primary} secondary={secondary} />
    </ListItem>
  );
}

export default function CampaignDetail({ item, pathDemo, relatedItems, routes }) {
  return (
    <>
      <Head title={item.title} />

      <Stack spacing={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link component="button" underline="hover" onClick={() => router.get(routes.dashboard)}>
            Dashboard
          </Link>
          <Link component="button" underline="hover" onClick={() => router.get(routes.library)}>
            Campaign library
          </Link>
          <Typography color="text.primary">{item.title}</Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.6fr) minmax(320px, 1fr)" },
          }}
        >
          <Card>
            <CardHeader
              action={
                <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
                  <Chip
                    color={statusColors[item.status] || "default"}
                    label={item.statusLabel}
                    size="small"
                    variant={item.status === "backlog" ? "outlined" : "filled"}
                  />
                  <Chip
                    color={priorityColors[item.priority] || "default"}
                    label={item.priorityLabel}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              }
              subheader={`Owned by ${item.owner} • ${item.channelLabel}`}
              title={item.title}
            />
            <CardContent sx={{ pt: 0 }}>
              <Typography sx={{ mb: 3 }} variant="body1">
                {item.summary || "No summary has been added to this campaign yet."}
              </Typography>

              <List disablePadding>
                <DetailRow
                  primary="Due date"
                  secondary={formatDate(item.dueDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <DetailRow primary="Created" secondary={item.createdAt} />
                <DetailRow primary="Last updated" secondary={item.updatedAt} />
                <DetailRow
                  primary="Pinned"
                  secondary={item.isFeatured ? "Yes, this campaign is featured." : "Not pinned."}
                />
              </List>

              <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: "wrap" }}>
                <Button variant="contained" onClick={() => router.get(routes.library)}>
                  Back to library
                </Button>
                <Button variant="text" onClick={() => router.get(routes.dashboard)}>
                  Open dashboard
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={3}>
            <Card>
              <CardHeader
                subheader="Django matched the integer parameter and passed the item back to React through Inertia."
                title="Route parameter demo"
              />
              <CardContent sx={{ pt: 0 }}>
                <List disablePadding>
                  <DetailRow primary="item_id parameter" secondary={String(pathDemo.itemId)} />
                  <DetailRow primary="Current path" secondary={pathDemo.currentPath} />
                  <DetailRow primary="Route pattern" secondary={pathDemo.routePattern} />
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                subheader="Open another route-parameter page from the same dataset."
                title="Related campaigns"
              />
              {relatedItems.length > 0 ? (
                <List dense sx={{ pt: 0 }}>
                  {relatedItems.map((relatedItem) => (
                    <ListItemButton
                      key={relatedItem.id}
                      onClick={() => router.get(relatedItem.detailUrl)}
                    >
                      <ListItemText
                        primary={relatedItem.title}
                        secondary={`${relatedItem.owner} • ${relatedItem.channelLabel}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <CardContent sx={{ pt: 0 }}>
                  <Typography color="text.secondary">
                    No related campaigns are available yet.
                  </Typography>
                </CardContent>
              )}
            </Card>
          </Stack>
        </Box>
      </Stack>
    </>
  );
}

CampaignDetail.layout = (page) => <AppShell>{page}</AppShell>;
