import { SectionList } from '@/components/section-list';
import { Skeleton, skeletonKeys } from '@/components/ui/skeleton';

// 設定トップの骨格。行数もタイルもシェブロンも確定しているので実寸で置く
// （共有モードでは口座の行が減るが、1 行の差はスケルトンの役目を損なわない）。

const KAKEI_ROWS = 4;
const PLAN_ROWS = 2;
const OTHER_ROWS = 2;

function CellSkeleton({ isFirst }: { isFirst: boolean }) {
  return (
    <div className='flex h-12 items-center gap-3 px-3.5'>
      <Skeleton className='size-[30px] rounded-lg' />
      <div
        className={`flex flex-grow items-center gap-2 self-stretch ${isFirst ? '' : 'border-t'}`}
      >
        <Skeleton className='h-4 w-24' />
      </div>
    </div>
  );
}

function ListSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <SectionList title={title}>
      {skeletonKeys(rows).map((key, index) => (
        <CellSkeleton isFirst={index === 0} key={key} />
      ))}
    </SectionList>
  );
}

export default function SettingLoading() {
  return (
    <div className='flex flex-col gap-2 px-4'>
      <div className='flex h-11 items-center justify-between' />

      <div className='flex items-center gap-2.5'>
        <Skeleton className='h-9 w-24' />
      </div>

      <div className='mt-1 flex flex-col gap-3.5'>
        <ListSkeleton rows={KAKEI_ROWS} title='家計管理' />
        <ListSkeleton rows={PLAN_ROWS} title='予定管理' />
        <ListSkeleton rows={OTHER_ROWS} title='その他' />
      </div>
    </div>
  );
}
