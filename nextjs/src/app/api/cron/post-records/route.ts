import { postRecordsForAllUsers } from '@/features/planned-record/server/services';
import { serverEnv } from '@/lib/server/env.server';

// 定期実体化 Cron の入口。Vercel Cron（日次 1 回）で全ユーザーの未登録の定期レコードを実体化する。
// 表示コード（calendar 等）からは副作用を排除し、実体化はここだけが行う（多重 INSERT の防止）。
//
// 認証: Vercel Cron は Authorization: Bearer <CRON_SECRET> を付与する。CRON_SECRET を
// 検証し、一致しなければ 401（認証なしで実体化 INSERT を叩かせない）。CRON_SECRET 未設定は
// 誤設定なので 503（無防備な公開を避ける）。この Route は /api なのでログインガードを通らず、
// ここでの Bearer 検証が唯一の防御となる。

// 実体化は毎回異なる結果になりうる副作用処理のため、静的化・キャッシュを禁止する。
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const secret = serverEnv.cronSecret;
  if (!secret) {
    return Response.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 503 }
    );
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await postRecordsForAllUsers();
  return Response.json({ ok: true, ...result });
}
