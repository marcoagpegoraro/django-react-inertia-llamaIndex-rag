export const statusColors = {
  backlog: "default",
  writing: "primary",
  review: "warning",
  scheduled: "secondary",
  live: "success",
};

export const priorityColors = {
  low: "default",
  medium: "warning",
  high: "error",
};

export function formatDate(dateString, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en", options).format(new Date(`${dateString}T00:00:00`));
}
