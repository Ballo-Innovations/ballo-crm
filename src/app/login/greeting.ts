const lusakaHour = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "Africa/Lusaka",
});

/** Time-of-day greeting for the login page, by the clock in Lusaka. Before 04:00 still counts as evening. */
export function greetingFor(now: Date): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = Number(lusakaHour.format(now));
  if (hour >= 4 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}
