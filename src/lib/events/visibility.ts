import type { Role } from "@/types/auth";
import type { PortalEvent } from "@/lib/events/types";

export function filterEventsForRole<T extends Pick<PortalEvent, "audience">>(
  events: T[],
  role: Role,
): T[] {
  if (role !== "EMPLOYEE") {
    return events;
  }

  return events.filter(
    (event) =>
      event.audience === "EMPLOYEES" ||
      event.audience === "ALL_STAFF",
  );
}
