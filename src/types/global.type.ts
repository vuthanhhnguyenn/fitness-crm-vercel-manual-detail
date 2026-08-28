export interface ApiRequest extends Request {
  _clone: Request;
}

/** Error thrown by the API client, augmented with the response's HTTP status by useClientRequest. */
export interface ApiErrorWithStatus {
  status?: number;
}
