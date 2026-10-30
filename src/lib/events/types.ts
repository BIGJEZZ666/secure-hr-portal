export const EVENT_AUDIENCES = [
  "ALL_STAFF",
  "LEADERS",
  "EMPLOYEES",
] as const;

export type EventAudience = (typeof EVENT_AUDIENCES)[number];

export interface PortalEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  audience: EventAudience;
  startsAt: string;
  endsAt: string;
  createdByName: string;
  createdByRole: "CEO" | "HR" | "EMPLOYEE";
}

export interface EventInput {
  title: string;
  description: string;
  location: string;
  audience: EventAudience;
  startsAt: string;
  endsAt: string;
}
