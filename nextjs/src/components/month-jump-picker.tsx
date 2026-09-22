'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

// 年月ダイレクトジャンプ（旧 components/PaginationBar.vue のタイトルタップ→年→月ピッカー）。
// 中央ラベルをボタン化し、popover 内で「年グリッド → 月グリッド」の 2 段で任意年月を選ぶ。
// summary 系 4 画面と calendar で共有する（差分リスト B-5）。値は 'YYYY-MM' で返す。

type MonthJumpPickerProps = {
  // 現在の 'YYYY-MM'（初期選択年に使う）。
  yearMonth: string;
  // 中央に出す表示ラベル（例: '2026年9月'）。
  label: string;
  // 選択が確定したら 'YYYY-MM' を返す。
  onSelect: (yearMonth: string) => void;
  // 選べる年の範囲（既定 2023〜現在年+1。旧 min=2023 を踏襲）。
  minYear?: number;
  maxYear?: number;
};

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function MonthJumpPicker({
  yearMonth,
  label,
  onSelect,
  minYear = 2023,
  maxYear
}: MonthJumpPickerProps) {
  const currentYear = Number(yearMonth.split('-')[0]);
  const [open, setOpen] = useState(false);
  // popover 内の作業用の選択年（月を選ぶまで確定しない）。
  const [pickYear, setPickYear] = useState(currentYear);

  const upperYear = maxYear ?? currentYear + 1;
  const years: number[] = [];
  for (let y = upperYear; y >= minYear; y--) {
    years.push(y);
  }

  const choose = (month: number) => {
    onSelect(
      `${String(pickYear).padStart(4, '0')}-${String(month).padStart(2, '0')}`
    );
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // 開くたびに現在年から始める。
        if (next) {
          setPickYear(currentYear);
        }
      }}
    >
      <PopoverTrigger
        render={
          <button
            type='button'
            className='font-medium text-sm underline-offset-2 hover:underline'
            aria-label='年月を選択'
          />
        }
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className='w-64'>
        {/* 年ピッカー（候補年のチップ一覧。選択中の年を強調）。旧 PaginationBar の
            年ピッカー相当を、候補が数個のためチップ一列に集約した。 */}
        <div className='mb-2 flex flex-wrap gap-1'>
          {years.map((y) => (
            <Button
              key={y}
              type='button'
              variant={y === pickYear ? 'secondary' : 'ghost'}
              size='xs'
              onClick={() => setPickYear(y)}
            >
              {y}
            </Button>
          ))}
        </div>
        {/* 月ピッカー（3×4 グリッド。選択年の月をタップで確定）。 */}
        <div className='grid grid-cols-4 gap-1'>
          {MONTHS.map((month) => {
            const isCurrent =
              pickYear === currentYear &&
              month === Number(yearMonth.split('-')[1]);
            return (
              <Button
                key={month}
                type='button'
                variant={isCurrent ? 'default' : 'outline'}
                size='sm'
                onClick={() => choose(month)}
              >
                {month}月
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
