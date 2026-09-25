'use client';

import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod/v4';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SwapButton } from '@/components/form/swap-button';
import { useFormAction } from '@/components/form/use-form-action';
import { IconArrowDown, IconPencil } from '@/components/icons';
import type { ColorClassification } from '@/features/master';
import type { SubTypeCard, TypeCard } from '@/features/type-method';
import {
  deleteTypeAction,
  swapSubTypeAction,
  upsertTypeAction
} from '@/features/type-method/actions';
import { typeUpsertSchema } from '@/features/type-method/schemas';
import { InitialCircle } from '@/v2/components/initial-circle';
import { ScreenHeader } from '@/v2/components/screen-header';
import { ColorGrid } from '@/v2/components/ui/color-grid';
import { TextField } from '@/v2/components/ui/text-field';
import { SheetDeleteButton } from './sheet-delete-button';
import { SubTypeAddRow } from './sub-type-add-row';
import { SubTypeSheet } from './sub-type-sheet';

// 設定 › カテゴリを編集（新デザイン）。新規追加も同じ画面で行う。
//
// 名前と色はヘッダの「保存」で一度に送る 1 つのフォーム。
// サブカテゴリは行ごとに独立した操作（追加・改名・削除・並べ替え）で、
// 押した時点で反映される。デザインでも「保存」を挟まない作りになっている。
//
// 新規のときはサブカテゴリの親 id がまだ無いので、その節は出さない。
// 先にカテゴリを保存してから開き直す。

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

  // 保存できたら一覧へ戻す。シートと違って画面なので、閉じる代わりに戻る。
  useEffect(() => {
    if (result?.toast?.type === 'success') {
      router.push('/v2/setting/type');
    }
  }, [result, router]);

  const isEdit = type !== undefined;
  // 見出しの丸は入力中の名前・色に追従させたいが、色は ColorGrid が内部で持つ。
  // ここでは保存済みの値だけを映す（入力中のプレビューは持たない）。
  const previewName = type?.name ?? 'あ';
  const previewColor = type?.colorName ?? 'grey';

  return (
    <div className='flex flex-col pb-6'>
      <form {...getFormProps(form)} action={action}>
        <input name='isPay' readOnly type='hidden' value={String(isPay)} />
        <input name='isPair' readOnly type='hidden' value={String(isPair)} />
        {isEdit ? (
          <input name='id' readOnly type='hidden' value={type.id} />
        ) : null}

        <ScreenHeader
          action={
            <button
              className='h-11 px-2 font-bold text-base text-primary'
              type='submit'
            >
              保存
            </button>
          }
          backHref='/v2/setting/type'
          backLabel='カテゴリ'
        />

        <div className='flex flex-col gap-4 px-4'>
          <div className='flex items-center gap-3.5 py-1'>
            <InitialCircle
              colorName={previewColor}
              name={previewName}
              size={56}
            />
            <div className='flex-grow'>
              <TextField
                defaultValue={type?.name}
                errorId={fields.name.errorId}
                errors={fields.name.errors}
                key={fields.name.key}
                label='名前'
                name={fields.name.name}
                placeholder='例：食費'
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
          />
        </div>
      </form>

      {isEdit ? (
        <div className='mt-4 flex flex-col gap-4 px-4'>
          <section className='flex flex-col gap-2'>
            <div className='flex items-baseline px-1'>
              <span className='text-[13px] text-muted-foreground'>
                サブカテゴリ
              </span>
              <span className='ml-auto text-muted-foreground text-xs'>
                鉛筆で名前の変更・削除
              </span>
            </div>
            <div className='overflow-hidden rounded-2xl bg-card'>
              {type.subTypes.map((sub, index) => (
                <SubTypeRow
                  isFirst={index === 0}
                  key={sub.id}
                  nextId={type.subTypes[index + 1]?.id}
                  onEdit={() => setEditingSub(sub)}
                  subType={sub}
                />
              ))}
              <SubTypeAddRow
                hasDivider={type.subTypes.length > 0}
                typeId={type.id}
              />
            </div>
          </section>

          <SheetDeleteButton
            action={deleteTypeAction}
            confirmMessage='このカテゴリを削除します。元に戻せません。'
            id={type.id}
            label='このカテゴリを削除'
            onDeleted={() => router.push('/v2/setting/type')}
          />
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

function SubTypeRow({
  subType,
  isFirst,
  nextId,
  onEdit
}: {
  subType: SubTypeCard;
  isFirst: boolean;
  nextId?: number;
  onEdit: () => void;
}) {
  return (
    <div
      className={`flex h-12 items-center pr-1.5 pl-3.5 ${isFirst ? '' : 'border-t'}`}
    >
      <span className='flex-grow truncate text-base'>{subType.name}</span>
      <button
        aria-label={`${subType.name}を編集`}
        className='flex size-11 items-center justify-center text-primary'
        onClick={onEdit}
        type='button'
      >
        <IconPencil aria-hidden='true' className='size-4' />
      </button>
      {nextId === undefined ? null : (
        <SwapButton
          action={swapSubTypeAction}
          icon={<IconArrowDown className='size-4' />}
          label='下と入れ替え'
          nextId={nextId}
          prevId={subType.id}
        />
      )}
    </div>
  );
}
