export type ApiOk<T> = {
  status: 'ok';
  data: T;
};

export type ApiError = {
  status: 'error';
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiOk<T> | ApiError;

export function ok<T>(data: T): ApiOk<T> {
  return { status: 'ok', data };
}
