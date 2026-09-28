import { describe, expect, it } from 'vitest';
import { editableDateRange } from './editable-dates';

describe('editableDateRange', () => {
  const today = '2026-09-25';

  it('新規は今日まで、下限なし', () => {
    expect(
      editableDateRange({ savedDate: undefined, isFromPlanned: false, today })
    ).toEqual({ min: null, max: today });
  });

  it('定期由来でない編集も今日まで、下限なし', () => {
    expect(
      editableDateRange({
        savedDate: '2026-07-10',
        isFromPlanned: false,
        today
      })
    ).toEqual({ min: null, max: today });
  });

  it('定期由来で今月の記録は月初から今日まで', () => {
    expect(
      editableDateRange({ savedDate: '2026-09-10', isFromPlanned: true, today })
    ).toEqual({ min: '2026-09-01', max: today });
  });

  it('定期由来で過去の月の記録はその月の中だけ', () => {
    expect(
      editableDateRange({ savedDate: '2026-07-10', isFromPlanned: true, today })
    ).toEqual({ min: '2026-07-01', max: '2026-07-31' });
  });
});
