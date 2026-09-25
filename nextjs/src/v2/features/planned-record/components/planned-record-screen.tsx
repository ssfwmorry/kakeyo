import { colorVar } from '@/features/master';
import type { PlannedRecordListItem } from '@/features/planned-record';
import { AddRowLink } from '@/v2/components/add-row';
import { ListCellLink } from '@/v2/components/list-cell';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ScreenTitle } from '@/v2/components/screen-title';
import { SectionList } from '@/v2/components/section-list';

// 設定 › 定期の記録（新デザイン）。
//
// 旧タブは記録一覧と同じ RecordCard を並べていたが、新デザインでは
// 毎月の収入・支出をまず 2 枚のカードで見せ、その下に日付つきのリストを置く。
// 並べ替えは新デザインに現れないため持たない（必要なら旧画面と同じく編集モードで足す）。
//
// リストは編集画面（/note?plannedRecordId=）へ進む。編集フォーム自体は旧画面のままで、
// 入力フローの作り直し（T12・T13）でまとめて新デザインに寄せる。

export function PlannedRecordScreen({
  items,
  isPair
}: {
  items: PlannedRecordListItem[];
  isPair: boolean;
}) {
  // 毎月の増減。定期は毎月必ず 1 回なので、金額をそのまま足すだけでよい。
  const incomeTotal = items
    .filter((item) => !item.isPay)
    .reduce((sum, item) => sum + item.price, 0);
  const payTotal = items
    .filter((item) => item.isPay)
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <div className='flex flex-col pb-6'>
      <ScreenHeader backHref='/v2/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge={isPair ? '共有の設定' : '個人の設定'}>
          定期の記録
        </ScreenTitle>
        <p className='px-1 text-[13px] text-muted-foreground leading-relaxed'>
          毎月決まった日に、自動で記録されます
        </p>

        <div className='grid grid-cols-2 gap-2'>
          <TotalCard amount={incomeTotal} isIncome label='毎月の収入' />
          <TotalCard amount={payTotal} isIncome={false} label='毎月の支出' />
        </div>

        {items.length > 0 ? (
          <SectionList>
            {items.map((item, index) => (
              <PlannedRecordRow
                isFirst={index === 0}
                item={item}
                key={item.id}
              />
            ))}
          </SectionList>
        ) : (
          <p className='px-1 text-muted-foreground text-sm'>
            定期の記録はまだありません。
          </p>
        )}

        <AddRowLink href='/note?planned=new' label='定期の記録を追加' />
      </div>
    </div>
  );
}

// 毎月の収入 / 支出。収入はアクセント、支出は本文色（デザイン基礎の金額表示）。
function TotalCard({
  label,
  amount,
  isIncome
}: {
  label: string;
  amount: number;
  isIncome: boolean;
}) {
  return (
    <div className='flex flex-col gap-0.5 rounded-2xl bg-card px-3.5 py-3'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span
        className={`font-bold text-lg tabular-nums ${isIncome ? 'text-primary' : ''}`}
      >
        {isIncome ? '+' : '−'}
        {amount.toLocaleString('ja-JP')}
      </span>
    </div>
  );
}

function PlannedRecordRow({
  item,
  isFirst
}: {
  item: PlannedRecordListItem;
  isFirst: boolean;
}) {
  // カテゴリ › サブカテゴリ。サブが無ければカテゴリだけ。
  const title =
    item.subTypeName === null
      ? item.typeName
      : `${item.typeName} › ${item.subTypeName}`;

  // 補足は「方法 · メモ」。メモが無ければ方法だけ。
  const description =
    item.memo === null ? item.methodName : `${item.methodName} · ${item.memo}`;

  return (
    <ListCellLink
      description={description}
      height={64}
      href={`/note?plannedRecordId=${item.id}`}
      isFirst={isFirst}
      label={
        <span className='flex items-center gap-1.5'>
          <span
            aria-hidden='true'
            className='size-2 shrink-0 rounded-full'
            style={{
              backgroundColor: colorVar(item.typeColorClassificationName)
            }}
          />
          {title}
        </span>
      }
      leading={<DayBadge name={item.dayClassificationName} />}
      value={
        <span
          className={`font-semibold text-base tabular-nums ${item.isPay ? 'text-foreground' : 'text-primary'}`}
        >
          {item.isPay ? '−' : '+'}
          {item.price.toLocaleString('ja-JP')}
        </span>
      }
    />
  );
}

// 行頭の日付。「毎月」を小さく上に載せ、日を大きく出すと一覧で縦に揃って読みやすい。
// dayClassificationName は「毎月 1 日」の形なので、日の部分だけを取り出して使う。
function DayBadge({ name }: { name: string }) {
  const day = name.replace(/^毎月\s*/, '');
  return (
    <span className='flex w-11 shrink-0 flex-col items-center'>
      <span className='text-[10px] text-muted-foreground'>毎月</span>
      <span className='font-bold text-[17px] leading-tight'>{day}</span>
    </span>
  );
}
