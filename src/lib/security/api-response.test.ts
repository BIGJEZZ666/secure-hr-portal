import { describe, expect, it } from "vitest";
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "./api-response";

describe("API security responses", () => {
  it.each([
    [unauthorizedResponse, 401, "UNAUTHENTICATED"],
    [forbiddenResponse, 403, "FORBIDDEN"],
    [notFoundResponse, 404, "NOT_FOUND"],
    [validationErrorResponse, 400, "INVALID_REQUEST"],
    [internalErrorResponse, 500, "INTERNAL_SERVER_ERROR"],
  ] as const)(
    "returns status %i with a generic error code",
    async (createResponse, expectedStatus, expectedError) => {
      const response = createResponse();

      expect(response.status).toBe(expectedStatus);
      expect(await response.json()).toEqual({
        error: expectedError,
      });
    },
  );
});
