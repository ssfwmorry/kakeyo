'use client';

import type { ComponentType, SVGProps } from 'react';
import { Input } from '@/components/ui/input';

// アイコン付きの 1 行テキスト入力（制御コンポーネント）。
//
// Conform 管理下のフィールドは FormField を使う。こちらは hidden で送る値を
// 画面側の state で持つフォーム（note の記録・定期入力）向け。
//
// ラベルは入力欄の外に置かず、欄内のアイコン + placeholder で何の欄かを示す。
// note は縦が詰まる画面（カテゴリ・方法・テンキーが同時に載る）で、
// ラベル行 1 本が背の低い端末では致命的なため。label は視覚的には出さず
// aria-label として残し、支援技術からは従来どおり読めるようにする。

export function TextInputRow({
  id,
  label,
  icon: Icon,
  value,
  placeholder,
  onChange
}: {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className='relative'>
      <Icon
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
      />
      <Input
        id={id}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        className='pl-9'
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
