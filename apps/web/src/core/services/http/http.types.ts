export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface IApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Multipart body (file uploads); sent as is, without a JSON content type. */
  formData?: FormData;
}
