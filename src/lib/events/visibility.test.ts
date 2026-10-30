import { describe, expect, it } from "vitest";
import { filterEventsForRole } from "./visibility";

const events = [
  { id: "1", audience: "ALL_STAFF" },
  { id: "2", audience: "LEADERS" },
  { id: "3", audience: "EMPLOYEES" },
] as const;

describe("filterEventsForRole", () => {
  it("limits employees to employee and all-staff events", () => {
    expect(filterEventsForRole([...events], "EMPLOYEE").map(({ id }) => id))
      .toEqual(["1", "3"]);
  });

  it("allows HR and CEO to see all events", () => {
    expect(filterEventsForRole([...events], "HR")).toHaveLength(3);
    expect(filterEventsForRole([...events], "CEO")).toHaveLength(3);
  });
});
