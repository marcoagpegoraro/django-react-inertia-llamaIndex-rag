import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  FormControlLabel,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

import { formatDate, priorityColors, statusColors } from "../../lib/campaignUi";
import AppShell from "../../layouts/AppShell";

function MetricCard({ stat }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {stat.label}
        </Typography>
        <Typography variant="h4">{stat.value}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {stat.caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

function ItemCard({ item, currentUrl, statusFlow }) {
  const [status, setStatus] = useState(item.status);

  useEffect(() => {
    setStatus(item.status);
  }, [item.status]);

  const saveStatus = () => {
    router.post(
      item.statusUrl,
      { status, return_to: currentUrl },
      { preserveScroll: true },
    );
  };

  const toggleFeatured = () => {
    router.post(item.featureUrl, { return_to: currentUrl }, { preserveScroll: true });
  };

  return (
    <Card>
      <CardHeader
        action={
          <Stack spacing={1} sx={{ alignItems: "flex-end" }}>
            <Chip
              label={item.statusLabel}
              color={statusColors[item.status] || "default"}
              size="small"
              variant={item.status === "backlog" ? "outlined" : "filled"}
            />
            <Chip
              label={item.priorityLabel}
              color={priorityColors[item.priority] || "default"}
              size="small"
              variant="outlined"
            />
          </Stack>
        }
        subheader={`Owned by ${item.owner} • ${item.channelLabel}`}
        title={<Typography variant="h6">{item.title}</Typography>}
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography color="text.secondary" variant="body2">
          {item.summary || "No summary yet."}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 2.5, alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TodayRoundedIcon color={item.isOverdue ? "error" : "action"} fontSize="small" />
            <Typography color={item.isOverdue ? "error.main" : "text.secondary"} variant="body2">
              Due {formatDate(item.dueDate)}
            </Typography>
            {item.isFeatured ? (
              <Chip
                color="secondary"
                icon={<PushPinRoundedIcon />}
                label="Pinned"
                size="small"
                variant="outlined"
              />
            ) : null}
          </Stack>

          <TextField
            select
            label="Stage"
            size="small"
            value={status}
            sx={{ minWidth: 180 }}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statusFlow.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </CardContent>

      <CardActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
        <Button size="small" onClick={() => router.get(item.detailUrl)}>
          View details
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" variant="outlined" color="secondary" onClick={toggleFeatured}>
          {item.isFeatured ? "Unpin" : "Pin"}
        </Button>
        <Button size="small" variant="contained" onClick={saveStatus}>
          Save stage
        </Button>
      </CardActions>
    </Card>
  );
}

function CreateItemCard({ defaults, options, createItemUrl, currentUrl }) {
  const form = useForm(defaults);

  useEffect(() => {
    form.setDefaults(defaults);
  }, [defaults]);

  const submit = (event) => {
    event.preventDefault();
    form.transform((data) => ({ ...data, return_to: currentUrl }));
    form.post(createItemUrl, {
      errorBag: "createItem",
      preserveScroll: true,
      onSuccess: () => {
        form.setDefaults(defaults);
        form.setData({ ...defaults });
      },
      onFinish: () => form.transform((data) => data),
    });
  };

  return (
    <Card>
      <CardHeader
        subheader="Post a form to Django and come back through Inertia."
        title="Add a campaign item"
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack component="form" spacing={2} onSubmit={submit}>
          <TextField
            label="Title"
            value={form.data.title}
            error={Boolean(form.errors.title)}
            helperText={form.errors.title}
            required
            onChange={(event) => form.setData("title", event.target.value)}
          />
          <TextField
            label="Owner"
            value={form.data.owner}
            error={Boolean(form.errors.owner)}
            helperText={form.errors.owner}
            required
            onChange={(event) => form.setData("owner", event.target.value)}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Channel"
              value={form.data.channel}
              sx={{ flex: 1 }}
              onChange={(event) => form.setData("channel", event.target.value)}
            >
              {options.channel
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Priority"
              value={form.data.priority}
              sx={{ flex: 1 }}
              onChange={(event) => form.setData("priority", event.target.value)}
            >
              {options.priority
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Stage"
              value={form.data.status}
              sx={{ flex: 1 }}
              onChange={(event) => form.setData("status", event.target.value)}
            >
              {options.status
                .filter((option) => option.value !== "all")
                .map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Due date"
              type="date"
              value={form.data.due_date}
              error={Boolean(form.errors.due_date)}
              helperText={form.errors.due_date}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
              onChange={(event) => form.setData("due_date", event.target.value)}
            />
          </Stack>
          <TextField
            label="Summary"
            multiline
            minRows={4}
            value={form.data.summary}
            onChange={(event) => form.setData("summary", event.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(form.data.is_featured)}
                onChange={(event) => form.setData("is_featured", event.target.checked)}
              />
            }
            label="Pin in the sidebar spotlight"
          />
          <Button disabled={form.processing} type="submit" variant="contained">
            {form.processing ? "Saving..." : "Create item"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function FilterCard({ filters, options, dashboardUrl }) {
  const filterForm = useForm(filters);

  useEffect(() => {
    filterForm.setData(filters);
  }, [filters]);

  const applyFilters = (event) => {
    event.preventDefault();
    router.get(dashboardUrl, filterForm.data, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const resetFilters = () => {
    router.get(
      dashboardUrl,
      { search: "", status: "all", priority: "all", channel: "all" },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  return (
    <Card>
      <CardHeader
        subheader="Use server-side filters without leaving the page."
        title="Filters"
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack
          component="form"
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { md: "center" } }}
          onSubmit={applyFilters}
        >
          <TextField
            label="Search"
            value={filterForm.data.search}
            placeholder="Title, owner, or summary"
            sx={{ flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            onChange={(event) => filterForm.setData("search", event.target.value)}
          />
          <TextField
            select
            label="Status"
            value={filterForm.data.status}
            sx={{ minWidth: 160 }}
            onChange={(event) => filterForm.setData("status", event.target.value)}
          >
            {options.status.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Priority"
            value={filterForm.data.priority}
            sx={{ minWidth: 160 }}
            onChange={(event) => filterForm.setData("priority", event.target.value)}
          >
            {options.priority.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Channel"
            value={filterForm.data.channel}
            sx={{ minWidth: 180 }}
            onChange={(event) => filterForm.setData("channel", event.target.value)}
          >
            {options.channel.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained">
            Apply
          </Button>
          <Button type="button" variant="text" onClick={resetFilters}>
            Reset
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Dashboard({
  headline,
  stats,
  filters,
  filterOptions,
  statusFlow,
  statusBreakdown,
  upcomingItems,
  items,
  formDefaults,
  routes,
}) {
  const currentUrl = usePage().url;

  return (
    <>
      <Head title="Dashboard" />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
            >
              <Box>
                <Typography variant="h5">{headline.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {headline.description}
                </Typography>
              </Box>
              <Button variant="contained" onClick={() => router.get(routes.library)}>
                Open campaign library
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {stats.map((stat) => (
            <MetricCard key={stat.label} stat={stat} />
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.7fr) minmax(320px, 1fr)" },
          }}
        >
          <Stack spacing={3}>
            <FilterCard filters={filters} options={filterOptions} dashboardUrl={routes.dashboard} />

            <Card>
              <CardHeader
                subheader="Update status, pin priorities, and open routed detail pages."
                title="Campaign board"
              />
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <ItemCard
                        key={item.id}
                        currentUrl={currentUrl}
                        item={item}
                        statusFlow={statusFlow}
                      />
                    ))
                  ) : (
                    <Alert severity="info" variant="outlined">
                      No items match the current filters right now.
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Stack spacing={3}>
            <CreateItemCard
              createItemUrl={routes.createItem}
              currentUrl={currentUrl}
              defaults={formDefaults}
              options={filterOptions}
            />

            <Card>
              <CardHeader
                subheader="A small aggregate generated by Django."
                title="Pipeline snapshot"
              />
              <List dense sx={{ pt: 0 }}>
                {statusBreakdown.map((status) => (
                  <ListItemButton key={status.value} disableRipple sx={{ cursor: "default" }}>
                    <ListItemText primary={status.label} secondary={`${status.count} item(s)`} />
                  </ListItemButton>
                ))}
              </List>
            </Card>

            <Card>
              <CardHeader
                subheader="Jump into a routed detail page from these items."
                title="Upcoming deadlines"
              />
              <List dense sx={{ pt: 0 }}>
                {upcomingItems.length > 0 ? (
                  upcomingItems.map((item) => (
                    <ListItemButton key={item.id} onClick={() => router.get(item.detailUrl)}>
                      <ListItemText
                        primary={item.title}
                        secondary={`${item.owner} • ${formatDate(item.dueDate)}`}
                      />
                    </ListItemButton>
                  ))
                ) : (
                  <ListItemText
                    primary="No upcoming deadlines yet."
                    sx={{ px: 3, pb: 2 }}
                  />
                )}
              </List>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </>
  );
}

Dashboard.layout = (page) => <AppShell>{page}</AppShell>;
