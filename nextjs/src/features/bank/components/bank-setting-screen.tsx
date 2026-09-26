'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AddRow } from '@/components/add-row';
import { InitialCircle } from '@/components/initial-circle';
import { ListCellButton } from '@/components/list-cell';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenLead, ScreenNote, ScreenTitle } from '@/components/screen-title';
import { SectionList, SectionListEmpty } from '@/components/section-list';
import type { BankItem } from '@/features/bank';
import type { ColorClassification } from '@/features/master';
import { BankSheet } from './bank-sheet';

// 設定 › 口座（原典 SetBank）。名前と色だけのマスタで、行を押すとシートで編集する。
// 並べ替えと編集モードは無く、追加した順（id 順）に並ぶ。

const SETTING_BANK_PATH = '/setting/bank';

type SheetState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; bank: BankItem };

export function BankSettingScreen({
  banks,
  colors,
  initialAdd = false
}: {
  banks: BankItem[];
  colors: ColorClassification[];
  // 追加シートを開いた状態で始める（残高登録シートの「＋ 口座の行を追加」から）。
  initialAdd?: boolean;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>(
    initialAdd ? { kind: 'create' } : { kind: 'closed' }
  );

  const closeSheet = () => {
    setSheet({ kind: 'closed' });
    // ?add=1 を URL に残すと、再読み込みでまた追加シートが開く。閉じた時点で外す。
    if (initialAdd) {
      router.replace(SETTING_BANK_PATH, { scroll: false });
    }
  };

  return (
    <div className='flex flex-col'>
      <ScreenHeader backHref='/setting' backLabel='設定' />
      <div className='flex flex-col gap-3 px-4'>
        <ScreenTitle badge='self'>口座</ScreenTitle>
        <ScreenLead>口座タブで残高を記録する口座です</ScreenLead>

        <SectionList>
          {banks.length === 0 ? (
            <SectionListEmpty>まだ口座はありません</SectionListEmpty>
          ) : (
            banks.map((bank, index) => (
              <ListCellButton
                aria-label={`${bank.name}を編集`}
                height={52}
                isFirst={index === 0}
                key={bank.id}
                label={bank.name}
                leading={
                  <InitialCircle colorName={bank.colorName} name={bank.name} />
                }
                onClick={() => setSheet({ kind: 'edit', bank })}
              />
            ))
          )}
        </SectionList>

        <AddRow
          label='口座を追加'
          onClick={() => setSheet({ kind: 'create' })}
        />

        <ScreenNote>
          口座は追加した順に並びます。色は口座タブの一覧と残高の登録で使われます。
        </ScreenNote>
      </div>

      {sheet.kind === 'closed' ? null : (
        <BankSheet
          bank={sheet.kind === 'edit' ? sheet.bank : undefined}
          colors={colors}
          isOpen
          // 編集対象ごとにフォームを作り直す（useForm の defaultValue は
          // マウント時にしか取り込まれないため）。
          key={sheet.kind === 'edit' ? sheet.bank.id : 'create'}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closeSheet();
            }
          }}
        />
      )}
    </div>
  );
}
