'use client';

import { type ReactNode, useState } from 'react';
import { DeleteAlerts, useDeleteFlow } from '@/components/delete-flow';
import { IconPencil } from '@/components/icons';
import { InitialCircle } from '@/components/initial-circle';
import { ListCellSortable } from '@/components/list-cell';
import { MasterSheet, MasterSheetPanel } from '@/components/master-sheet';
import { SheetHeader, SheetTrashButton } from '@/components/sheet-header';
import {
  SortableHandle,
  SortableList,
  useSortableOrder
} from '@/components/sortable-list';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import type { ColorClassification } from '@/features/master';
import type { SubTypeCard, TypeCard } from '@/features/type-method';
import {
  deleteSubTypeAction,
  deleteTypeAction,
  reorderSubTypeAction,
  upsertSubTypeAction,
  upsertTypeAction
} from '@/features/type-method/actions';
import { typeMethodLabels } from '@/features/type-method/labels';
import {
  subTypeUpsertSchema,
  typeUpsertSchema
} from '@/features/type-method/schemas';
import { SubTypeAddRow } from './sub-type-add-row';

// カテゴリの追加・編集シート。編集は 1 枚の Drawer の中で detail / meta / sub の
// 3 ビューを切り替える。
//
// detail に保存ボタンを置かず、名前と色（meta）とサブカテゴリの改名（sub）を別ビューに
// 切り出すのは、「保存する」で確定する操作と押した時点で反映される操作を同じ画面に置くと
// どこまでが保存の対象かが読めなくなるため（サブカテゴリも保存待ちに見える／名前だけ
// 変えて閉じて消える）。
//
// detail の表示は props の type をそのまま使う。保存すると一覧が再検証されて type が
// 差し替わるので、detail に戻った時点で新しい名前と色になる。

type View =
  | { kind: 'detail' }
  | { kind: 'meta' }
  | { kind: 'sub'; subType: SubTypeCard };

const TYPE_ENTITY = typeMethodLabels.dialogEntity.type;
const SUB_TYPE_ENTITY = typeMethodLabels.dialogEntity.subType;
const BACK_TO_DETAIL = `${TYPE_ENTITY}に戻る`;

export function TypeSheet({
  type,
  isPay,
  isPair,
  colors,
  onClose
}: {
  // 編集対象。追加のときは undefined。
  type?: TypeCard;
  isPay: boolean;
  isPair: boolean;
  colors: ColorClassification[];
  onClose: () => void;
}) {
  const hiddenFields = { isPay: String(isPay), isPair: String(isPair) };

  if (type === undefined) {
    return (
      <MasterSheet
        colors={colors}
        entity={TYPE_ENTITY}
        hiddenFields={hiddenFields}
        isOpen
        nameAriaLabel={typeMethodLabels.entity.typeName}
        namePlaceholder='例：食費'
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onClose();
          }
        }}
        upsertAction={upsertTypeAction}
        upsertSchema={typeUpsertSchema}
      />
    );
  }

  return (
    <TypeEditSheet
      colors={colors}
      hiddenFields={hiddenFields}
      onClose={onClose}
      type={type}
    />
  );
}

function TypeEditSheet({
  type,
  hiddenFields,
  colors,
  onClose
}: {
  type: TypeCard;
  hiddenFields: Record<string, string>;
  colors: ColorClassification[];
  onClose: () => void;
}) {
  const [view, setView] = useState<View>({ kind: 'detail' });
  const toDetail = () => setView({ kind: 'detail' });

  return (
    <BottomSheet
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      open
    >
      <BottomSheetContent>
        {view.kind === 'detail' ? (
          <DetailView
            onClose={onClose}
            onEditMeta={() => setView({ kind: 'meta' })}
            onEditSubType={(subType) => setView({ kind: 'sub', subType })}
            type={type}
          />
        ) : null}
        {view.kind === 'meta' ? (
          <MasterSheetPanel
            colors={colors}
            editing={type}
            entity={TYPE_ENTITY}
            hiddenFields={hiddenFields}
            left={{ back: BACK_TO_DETAIL }}
            nameAriaLabel={typeMethodLabels.entity.typeName}
            onDone={toDetail}
            title='名前と色を編集'
            upsertAction={upsertTypeAction}
            upsertSchema={typeUpsertSchema}
          />
        ) : null}
        {view.kind === 'sub' ? (
          <MasterSheetPanel
            counter={false}
            deleteAction={deleteSubTypeAction}
            editing={view.subType}
            entity={SUB_TYPE_ENTITY}
            helper='名前を変えると、これまでの記録にも新しい名前で表示されます'
            hiddenFields={{ typeId: String(type.id) }}
            key={view.subType.id}
            left={{ back: BACK_TO_DETAIL }}
            nameAriaLabel={typeMethodLabels.entity.subTypeName}
            nameHeight={48}
            onDone={toDetail}
            upsertAction={upsertSubTypeAction}
            upsertSchema={subTypeUpsertSchema}
          />
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function DetailView({
  type,
  onClose,
  onEditMeta,
  onEditSubType
}: {
  type: TypeCard;
  onClose: () => void;
  onEditMeta: () => void;
  onEditSubType: (subType: SubTypeCard) => void;
}) {
  const remove = useDeleteFlow({
    deleteAction: deleteTypeAction,
    onDeleted: onClose
  });

  return (
    <>
      <SheetHeader
        left='close'
        onLeft={onClose}
        right={
          <SheetTrashButton
            disabled={remove.isPending}
            label={`この${TYPE_ENTITY}を削除`}
            onClick={() => remove.ask({ id: type.id, name: type.name })}
          />
        }
        title={TYPE_ENTITY}
      />

      <div className='flex items-center gap-3.5 px-1 py-1'>
        <InitialCircle colorName={type.colorName} name={type.name} size={56} />
        <span className='min-w-0 flex-grow truncate font-bold text-xl'>
          {type.name}
        </span>
        <button
          className='flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3.5 font-bold text-[13px] text-primary'
          onClick={onEditMeta}
          type='button'
        >
          <IconPencil
            aria-hidden='true'
            className='size-3.5'
            strokeWidth={2.4}
          />
          名前と色を編集
        </button>
      </div>

      <SubTypeSection onEdit={onEditSubType} type={type} />

      <p className='px-1 text-muted-foreground text-xs leading-relaxed'>
        サブカテゴリの変更はすぐに反映されます。
      </p>

      <DeleteAlerts entity={TYPE_ENTITY} remove={remove} />
    </>
  );
}

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
          タップで名前の変更・削除 / ≡ で並べ替え
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
    <ListCellSortable
      aria-label={`${subType.name}を編集`}
      handle={handle}
      isFirst={isFirst}
      label={subType.name}
      leadingWidth={0}
      onClick={onEdit}
    />
  );
}
