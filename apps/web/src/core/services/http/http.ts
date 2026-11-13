import type { ControllerResult } from "@magista/shared";

import { API_URL, NETWORK_ERROR } from "./http.constants";
import type { IApiRequestOptions } from "./http.types";

/**
 * Calls the Magista API with the session cookie and returns its response envelope.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body }: IApiRequestOptions = {},
): Promise<ControllerResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await response.json()) as ControllerResult<T>;
  } catch {
    return { error: NETWORK_ERROR };
  }
}
