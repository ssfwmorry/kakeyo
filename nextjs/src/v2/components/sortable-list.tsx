'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from 'cn';
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
  useTransition
} from 'react';
import { useFormToast } from '@/components/form/use-form-toast';
import { IconGrip } from '@/components/icons';
import type { FormActionResult } from '@/lib/shared/types/formResult';

// ドラッグで任意順に並べ替えるリスト（README D2）。設定のカテゴリ・方法・予定カテゴリ・
// 定期の記録が、編集モード中の行末のハンドルで並べ替える。
//
// 縦方向だけに動かす。DragOverlay は使わず、行そのものを transform で動かす
// （Base UI の Drawer の中でも Portal 先を気にせず動くようにするため）。
// ドラッグ中の行は面を持ち上げて見せる（影はデザインの数少ない例外。README D17）。
//
// 並びの保存はドロップごとに送る（useSortableOrder）。デザインは「完了」で確定だが、
// ドロップのたびに送っておけば途中で画面を離れても並びが失われない。

type SortableId = number;

export type SortableHandleProps = ComponentProps<'button'> & {
  ref: (node: HTMLElement | null) => void;
};

// 横方向の移動を殺す（@dnd-kit/modifiers の restrictToVerticalAxis と同じ）。
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function SortableList<Item extends { id: SortableId }>({
  items,
  renderItem,
  onReorder,
  disabled = false
}: {
  items: Item[];
  // 行を描く。handleProps はハンドルの button にそのまま渡す（SortableHandle が受ける）。
  renderItem: (
    item: Item,
    state: { handleProps: SortableHandleProps; isDragging: boolean }
  ) => ReactNode;
  // ドロップで並びが変わったとき。新しい順の id を渡す。
  onReorder: (ids: SortableId[]) => void;
  disabled?: boolean;
}) {
  const sensors = useSensors(
    // 4px 動かすまではタップ扱い（ハンドルの押下と区別する）。
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const ids = items.map((item) => item.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over === null || active.id === over.id) {
      return;
    }
    const from = ids.indexOf(Number(active.id));
    const to = ids.indexOf(Number(over.id));
    if (from < 0 || to < 0) {
      return;
    }
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        disabled={disabled}
        items={ids}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortableRow id={item.id} key={item.id}>
            {(state) => renderItem(item, state)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children
}: {
  id: SortableId;
  children: (state: {
    handleProps: SortableHandleProps;
    isDragging: boolean;
  }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  return (
    <div
      className={cn(
        // 持ち上げた行はカードの角丸からはみ出すことがあるので、行側で背景と角丸を持つ。
        'relative',
        isDragging &&
          'z-10 rounded-[14px] bg-card shadow-[0_8px_24px_rgba(22,25,26,0.18)]'
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
    >
      {children({
        handleProps: { ...attributes, ...listeners, ref: setActivatorNodeRef },
        isDragging
      })}
    </div>
  );
}

// 行末のドラッグハンドル（2 本線）。32×44 の枠で、シェブロンの位置に置く。
export function SortableHandle({ className, ...props }: SortableHandleProps) {
  return (
    <button
      aria-label='並べ替え'
      className={cn(
        'flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-icon-muted active:cursor-grabbing',
        className
      )}
      type='button'
      {...props}
    >
      <IconGrip aria-hidden='true' className='size-4.5' strokeWidth={2} />
    </button>
  );
}

// 並びをクライアントで先に入れ替え（楽観更新）、Action の結果で確定または戻す。
//
// サーバの再検証で items が入れ替わったら、その並びを正として取り込む
// （id の並びが変わったときだけ。同じ並びなら state を触らない）。
export function useSortableOrder<Item extends { id: SortableId }>(
  items: Item[],
  action: (ids: SortableId[]) => Promise<FormActionResult>
): {
  ordered: Item[];
  reorder: (ids: SortableId[]) => void;
  isPending: boolean;
} {
  const [orderedIds, setOrderedIds] = useState<SortableId[]>(() =>
    items.map((item) => item.id)
  );
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FormActionResult | null>(null);
  useFormToast(result);

  const incomingKey = items.map((item) => item.id).join(',');
  useEffect(() => {
    setOrderedIds(incomingKey === '' ? [] : incomingKey.split(',').map(Number));
  }, [incomingKey]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const ordered = orderedIds
    .map((id) => itemById.get(id))
    .filter((item): item is Item => item !== undefined);

  const reorder = (ids: SortableId[]) => {
    const previous = orderedIds;
    setOrderedIds(ids);
    startTransition(async () => {
      const next = await action(ids);
      setResult(next);
      if (next.toast?.type !== 'success') {
        setOrderedIds(previous);
      }
    });
  };

  return { ordered, reorder, isPending };
}
