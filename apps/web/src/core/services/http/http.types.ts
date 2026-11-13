export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface IApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
}
