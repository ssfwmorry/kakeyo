import type { ApiOutput } from '~/api/supabase/common.interface';

export function assertApiResponse<S, T>(
  apiRes: ApiOutput<S, T>
): asserts apiRes is ApiOutput<S, T> & { data: S; error: null } {
  if (apiRes.data === undefined || apiRes.error !== null) {
    const message = `Message: ${apiRes.message} ,Error: ${JSON.stringify(apiRes.error)})`;

    alert(message);
    throw new Error(message);
  }
}
