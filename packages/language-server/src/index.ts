export const enum RequestTypes {
  RunQuery = 'runQuery',
}

export interface RunQueryResponse {
  result?: string;
  error?: RunQueryError;
}

export interface RunQueryError {
  name: string;
  errorCode: string;
  message: string;
}
