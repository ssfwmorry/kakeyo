'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { cn } from 'cn';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { DeleteAlerts, useDeleteFlow } from '@/components/delete-flow';
import { useFormAction } from '@/components/form/use-form-action';
import { IconPencil } from '@/components/icons';
import { InitialCircle } from '@/components/initial-circle';
import { ScreenHeader, ScreenHeaderAction } from '@/components/screen-header';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import { ColorGrid } from '@/components/ui/color-grid';
import { TextField } from '@/components/ui/text-field';
import type { ColorClassification } from '@/features/master';
import type { SubTypeCard, TypeCard } from '@/features/type-method';
import {
  deleteTypeAction,
  reorderSubTypeAction,
  upsertTypeAction
} from '@/features/type-method/actions';
import { typeUpsertSchema } from '@/features/type-method/schemas';
import { SubTypeAddRow } from './sub-type-add-row';
import { SubTypeSheet } from './sub-type-sheet';

// 設定 › カテゴリを編集（原典 SetTypeEdit）。新規追加も同じ画面で行う。
//
// 名前と色はヘッダの「保存」で一度に送る 1 つのフォーム。見出しの大きな丸は
// 入力中の名前と選択中の色にその場で追従させる。
// サブカテゴリは行ごとに独立した操作（追加・改名・削除・並べ替え）で、押した時点で反映される。
//
// 新規のときはサブカテゴリの親 id がまだ無いので、その節は出さない。
// 先にカテゴリを保存してから開き直す。

const LIST_PATH = '/setting/type';

export function TypeEditScreen({
  type,
  isPay,
  isPair,
  colors
}: {
  // 編集対象。新規のときは undefined。
  type?: TypeCard;
  isPay: boolean;
  isPair: boolean;
  colors: ColorClassification[];
}) {
  const router = useRouter();
  const [result, action] = useFormAction(upsertTypeAction);
  const [form, fields] = useForm({
    lastResult: result?.submission,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: typeUpsertSchema })
  });
  const [editingSub, setEditingSub] = useState<SubTypeCard | null>(null);
  const [name, setName] = useState(type?.name ?? '');
  const [colorName, setColorName] = useState(
    type?.colorName ?? colors[0]?.name ?? ''
  );
  const remove = useDeleteFlow({
    deleteAction: deleteTypeAction,
    onDeleted: () => router.push(LIST_PATH)
  });

  // 保存できたら一覧へ戻す。シートと違って画面なので、閉じる代わりに戻る。
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      router.push(LIST_PATH);
    }
  }, [result, router]);

  const isEdit = type !== undefined;

  return (
    <div className='flex flex-col'>
      <form {...getFormProps(form)} action={action}>
        <input name='isPay' readOnly type='hidden' value={String(isPay)} />
        <input name='isPair' readOnly type='hidden' value={String(isPair)} />
        {isEdit ? (
          <input name='id' readOnly type='hidden' value={type.id} />
        ) : null}

        <ScreenHeader
          action={
            <ScreenHeaderAction bold type='submit'>
              保存
            </ScreenHeaderAction>
          }
          backHref={LIST_PATH}
          backLabel='カテゴリ'
          title={isEdit ? 'カテゴリを編集' : 'カテゴリを追加'}
        />

        <div className='flex flex-col gap-4.5 px-4 pt-2'>
          <div className='flex items-center gap-3.5 py-1'>
            <InitialCircle colorName={colorName} name={name} size={56} />
            <div className='flex-grow'>
              <TextField
                aria-label='カテゴリ名'
                errorId={fields.name.errorId}
                errors={fields.name.errors}
                key={fields.name.key}
                label='名前'
                maxLength={10}
                name={fields.name.name}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>
          </div>

          <ColorGrid
            colors={colors}
            defaultColorId={type?.colorClassificationId}
            errorId={fields.colorId.errorId}
            errors={fields.colorId.errors}
            label='色'
            name={fields.colorId.name}
            onChange={(color) => setColorName(color.name)}
          />
        </div>
      </form>

      {isEdit ? (
        <div className='mt-4.5 flex flex-col gap-4.5 px-4 pb-8.5'>
          <SubTypeSection onEdit={setEditingSub} type={type} />

          <button
            className='h-12 rounded-[14px] bg-card font-semibold text-base text-destructive disabled:opacity-50'
            disabled={remove.isPending}
            onClick={() => remove.ask({ id: type.id, name: type.name })}
            type='button'
          >
            このカテゴリを削除
          </button>
          <DeleteAlerts entity='カテゴリ' remove={remove} />
        </div>
      ) : null}

      {editingSub === null || !isEdit ? null : (
        <SubTypeSheet
          isOpen
          // 編集対象ごとにフォームを作り直す（useForm の defaultValue は
          // マウント時にしか取り込まれないため）。
          key={editingSub.id}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingSub(null);
            }
          }}
          subType={editingSub}
          typeId={type.id}
        />
      )}
    </div>
  );
}

// サブカテゴリの一覧。ハンドルは常に出ていて、いつでもドラッグで並べ替えられる
// （編集モードを持たない。原典 SetTypeEdit）。
function SubTypeSection({
  type,
  onEdit
}: {
  type: TypeCard;
  onEdit: (sub: SubTypeCard) => void;
}) {
  const { ordered, reorder } = useSortableOrder(type.subTypes, (ids) =>
    reorderSubTypeAction(type.id, ids)
  );

  return (
    <section className='flex flex-col gap-2'>
      <div className='flex items-baseline px-1'>
        <span className='text-[13px] text-muted-foreground'>サブカテゴリ</span>
        <span className='ml-auto text-muted-foreground text-xs'>
          ✎ で名前の変更・削除 / ≡ で並べ替え
        </span>
      </div>
      <div className='overflow-hidden rounded-[14px] bg-card'>
        <SortableList
          items={ordered}
          onReorder={reorder}
          renderItem={(sub, { handleProps }) => (
            <SubTypeRow
              handle={<SortableHandle {...handleProps} />}
              isFirst={sub.id === ordered[0]?.id}
              onEdit={() => onEdit(sub)}
              subType={sub}
            />
          )}
        />
        <SubTypeAddRow hasDivider={ordered.length > 0} typeId={type.id} />
      </div>
    </section>
  );
}

function SubTypeRow({
  subType,
  isFirst,
  onEdit,
  handle
}: {
  subType: SubTypeCard;
  isFirst: boolean;
  onEdit: () => void;
  handle: ReactNode;
}) {
  return (
    <div
      className={cn(
        'ml-3.5 flex h-12 items-center pr-1.5',
        !isFirst && 'border-t'
      )}
    >
      <span className='flex-grow truncate text-base'>{subType.name}</span>
      <button
        aria-label={`${subType.name}を編集`}
        className='flex size-11 shrink-0 items-center justify-center text-primary'
        onClick={onEdit}
        type='button'
      >
        <IconPencil aria-hidden='true' className='size-4' strokeWidth={2} />
      </button>
      {handle}
    </div>
  );
}
