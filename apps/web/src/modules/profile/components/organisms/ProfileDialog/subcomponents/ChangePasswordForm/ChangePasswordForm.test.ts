import { describe, expect, it } from "vitest";

import { PASSWORD_FIELD_ERRORS } from "./ChangePasswordForm.constants";
import { firstInvalidField, validatePasswordChange } from "./ChangePasswordForm.utils";

describe("change password form", () => {
  it("accepts a long new password, different from the current one and confirmed", () => {
    expect(
      validatePasswordChange({ current: "antiga", next: "nova-senha-1", confirm: "nova-senha-1" }),
    ).toEqual({});
  });

  it("flags every invalid field and points to the first one", () => {
    const errors = validatePasswordChange({ current: "", next: "curta", confirm: "outra" });
    expect(errors).toEqual({
      current: PASSWORD_FIELD_ERRORS.currentRequired,
      next: PASSWORD_FIELD_ERRORS.nextTooShort,
      confirm: PASSWORD_FIELD_ERRORS.confirmMismatch,
    });
    expect(firstInvalidField(errors)).toBe("current");
  });

  it("refuses keeping the same password", () => {
    expect(
      validatePasswordChange({
        current: "mesma-senha",
        next: "mesma-senha",
        confirm: "mesma-senha",
      }).next,
    ).toBe(PASSWORD_FIELD_ERRORS.nextUnchanged);
  });
});
