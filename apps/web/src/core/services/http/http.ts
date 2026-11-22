import { CLIENT_ID_HEADER, type ControllerResult } from "@magista/shared";

import { versionedUrl } from "@/core/services/version";

import { API_URL, CLIENT_ID, NETWORK_ERROR } from "./http.constants";
import type { IApiRequestOptions } from "./http.types";

/**
 * Calls the Magista API with the session cookie and returns its response envelope.
 */
export async function apiRequest<T>(
  path: string,
  { method = "GET", body, formData }: IApiRequestOptions = {},
): Promise<ControllerResult<T>> {
  try {
    const headers: Record<string, string> = { [CLIENT_ID_HEADER]: CLIENT_ID };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    return (await response.json()) as ControllerResult<T>;
  } catch {
    return { error: NETWORK_ERROR };
  }
}

/**
 * Turns a media path stored by the API ("/media/...") into an absolute URL.
 */
export function toMediaUrl(path: string | null): string | null {
  return path ? versionedUrl(`${API_URL}${path}`) : null;
}

/**
 * Downloads a public media file (absolute URL from `toMediaUrl`) without credentials, as needed for WebGL
 * textures (CORS-clean images).
 */
export async function fetchMediaBlob(url: string): Promise<Blob> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) throw new Error(`Mídia indisponível (${response.status})`);
  return response.blob();
}
