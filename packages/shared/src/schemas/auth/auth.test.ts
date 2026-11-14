import { describe, expect, it } from "vitest";

import { changePasswordInputSchema } from "./auth.schemas";

describe("auth schemas", () => {
  it("accepts a new password with the minimum length, different from the current one", () => {
    expect(
      changePasswordInputSchema.safeParse({
        currentPassword: "antiga",
        newPassword: "nova-senha-1",
      }).success,
    ).toBe(true);
  });

  it("refuses short or unchanged new passwords", () => {
    expect(
      changePasswordInputSchema.safeParse({ currentPassword: "antiga", newPassword: "curta" })
        .success,
    ).toBe(false);
    expect(
      changePasswordInputSchema.safeParse({
        currentPassword: "mesma-senha-1",
        newPassword: "mesma-senha-1",
      }).success,
    ).toBe(false);
  });
});
