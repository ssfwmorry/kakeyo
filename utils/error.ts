// TODO  data: nullを追加して、dataもチェックできるように
type ApiResponse<T> = { message: string; error: T | null };

export function assertApiResponse<T>(
  apiRes: ApiResponse<T>
): asserts apiRes is ApiResponse<T> & { error: null } {
  if (apiRes.error !== null) {
    const message = `Message: ${apiRes.message} ,Error: ${JSON.stringify(apiRes.error)})`;

    alert(message);
    throw new Error(message);
  }
}
