export class RequestResponse {
  statusCode: number;
  message: string;
  data?: any;
  meta?: any;
}

export class CaughtError {
  code: number;
  errorCode: string;
  message: string;
}
