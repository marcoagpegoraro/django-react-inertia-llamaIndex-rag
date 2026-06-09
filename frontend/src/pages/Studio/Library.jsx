import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Head, router, useForm } from "@inertiajs/react";
import { useEffect } from "react";

import { formatDate, priorityColors, statusColors } from "../../lib/campaignUi";
import AppShell from "../../layouts/AppShell";

function SummaryCard({ item }) {
  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">
          {item.label}
        </Typography>
        <Typography variant="h4">{item.value}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          {item.caption}
        </Typography>
      </CardContent>
    </Card>
  );
}

function FiltersCard({ filterOptions, filters, routes }) {
  const filterForm = useForm(filters);

  useEffect(() => {
    filterForm.setData(filters);
  }, [filters]);

  const applyFilters = (event) => {
    event.preventDefault();
    router.get(routes.library, filterForm.data, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const resetFilters = () => {
    router.get(
      routes.library,
      { search: "", status: "all", priority: "all", channel: "all" },
      { preserveScroll: true, preserveState: true, replace: true },
    );
  };

  return (
    <Card>
      <CardHeader
        subheader="Apply filters with Django, then keep browsing without a full page reload."
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
            {filterOptions.status.map((option) => (
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
            {filterOptions.priority.map((option) => (
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
            {filterOptions.channel.map((option) => (
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

export default function Library({ filterOptions, filters, items, pathDemo, routes, summary }) {
  return (
    <>
      <Head title="Campaign library" />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
            >
              <Box>
                <Typography variant="h5">Browse campaigns</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Open a detail page to verify Inertia navigation and Django path parameters.
                </Typography>
              </Box>
              {pathDemo.examplePath ? (
                <Button variant="contained" onClick={() => router.get(pathDemo.examplePath)}>
                  Open path parameter demo
                </Button>
              ) : null}
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
              Route pattern: {pathDemo.routePattern}
            </Typography>
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
          {summary.map((item) => (
            <SummaryCard key={item.label} item={item} />
          ))}
        </Box>

        <FiltersCard filterOptions={filterOptions} filters={filters} routes={routes} />

        <Card>
          <CardHeader
            subheader="Each detail action opens /campaigns/<item_id>/ through Inertia."
            title="Campaign library"
          />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Channel</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell align="right">Route</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow hover key={item.id}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography fontWeight={600}>{item.title}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            {item.summary || "No summary yet."}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.owner}</TableCell>
                      <TableCell>{item.channelLabel}</TableCell>
                      <TableCell>
                        <Chip
                          color={statusColors[item.status] || "default"}
                          label={item.statusLabel}
                          size="small"
                          variant={item.status === "backlog" ? "outlined" : "filled"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={priorityColors[item.priority] || "default"}
                          label={item.priorityLabel}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(item.dueDate)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => router.get(item.detailUrl)}>
                          /campaigns/{item.id}/
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Alert severity="info" variant="outlined">
                        No campaigns match the current filters.
                      </Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Stack>
    </>
  );
}

Library.layout = (page) => <AppShell>{page}</AppShell>;
