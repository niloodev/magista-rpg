export interface BaseResponse<T> {
  message: string;
  payload: T;
}

export interface BaseError<E extends string = string> {
  error: E;
}

export type ControllerResult<T, E extends string = string> = BaseResponse<T> | BaseError<E>;

/**
 * Narrows a controller result to its error branch.
 */
export function isErrorResult<T, E extends string>(
  result: ControllerResult<T, E>,
): result is BaseError<E> {
  return "error" in result;
}
