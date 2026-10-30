import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    query: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { ACTIVITY_ACTIONS, recordActivity } from "./activity-log";

const query = vi.mocked(db.query);

describe("recordActivity", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("inserts an activity using the configured action and actor", async () => {
    query.mockResolvedValueOnce([{ action_id: 1 }]);
    query.mockResolvedValueOnce({});

    await recordActivity({
      employeeId: "2",
      action: ACTIVITY_ACTIONS.LOGIN,
      resourceType: "employee",
      resourceId: "2",
      details: { twoFactorVerified: false },
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("FROM tb_action"),
      [ACTIVITY_ACTIONS.LOGIN],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO tb_activity_log"),
      [2, 1, null, "employee", "2", '{"twoFactorVerified":false}'],
    );
  });

  it("rejects malformed employee IDs before querying the database", async () => {
    await expect(
      recordActivity({
        employeeId: "EMP002",
        action: ACTIVITY_ACTIONS.LOGIN,
      }),
    ).rejects.toThrow("Invalid activity actor ID");
    expect(query).not.toHaveBeenCalled();
  });

  it("surfaces an action that is missing from the catalog", async () => {
    query.mockResolvedValueOnce([]);

    await expect(
      recordActivity({
        employeeId: "2",
        action: ACTIVITY_ACTIONS.LOGIN,
      }),
    ).rejects.toThrow("Activity action is not configured");
    expect(query).toHaveBeenCalledTimes(1);
  });
});
