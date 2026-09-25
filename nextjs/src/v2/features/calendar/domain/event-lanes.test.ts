import { describe, expect, it } from 'vitest';
import { assignEventLanes, type LaneEvent } from './event-lanes';

function event(
  id: string,
  startDate: string,
  endDate: string = startDate
): LaneEvent {
  return {
    id,
    name: id,
    startDate,
    endDate,
    colorName: 'red',
    isReminder: false
  };
}

describe('assignEventLanes', () => {
  it('期間が重ならなければ同じ段を使い回す', () => {
    const lanes = assignEventLanes(
      [event('a', '2026-09-01'), event('b', '2026-09-02')],
      3
    );
    expect(lanes.get('2026-09-01')?.[0]).toMatchObject({ kind: 'event' });
    expect(lanes.get('2026-09-02')?.[0]).toMatchObject({ kind: 'event' });
  });

  it('期間が重なると別の段に置く', () => {
    const lanes = assignEventLanes(
      [event('a', '2026-09-01', '2026-09-03'), event('b', '2026-09-02')],
      3
    );
    const day2 = lanes.get('2026-09-02');
    expect(day2?.[0]).toMatchObject({ kind: 'event', isStart: false });
    expect(day2?.[1]).toMatchObject({ kind: 'event', isStart: true });
  });

  it('またがる予定は同じ段を通し、両端だけ isStart / isEnd が立つ', () => {
    const lanes = assignEventLanes([event('a', '2026-09-01', '2026-09-03')], 3);
    expect(lanes.get('2026-09-01')?.[0]).toMatchObject({
      isEnd: false,
      isStart: true
    });
    expect(lanes.get('2026-09-02')?.[0]).toMatchObject({
      isEnd: false,
      isStart: false
    });
    expect(lanes.get('2026-09-03')?.[0]).toMatchObject({
      isEnd: true,
      isStart: false
    });
  });

  it('空いた段は詰めずに残す（下の段の位置を揃えるため）', () => {
    const lanes = assignEventLanes(
      [event('a', '2026-09-01', '2026-09-03'), event('b', '2026-09-02')],
      3
    );
    // 2 段目を使う b は 9/2 だけ。9/3 の 2 段目は空きとして残る。
    expect(lanes.get('2026-09-03')?.[1]).toEqual({ kind: 'empty', lane: 1 });
  });

  it('段が溢れたら最下段を「他N件」に畳む', () => {
    const lanes = assignEventLanes(
      [
        event('a', '2026-09-01'),
        event('b', '2026-09-01'),
        event('c', '2026-09-01'),
        event('d', '2026-09-01')
      ],
      2
    );
    const day = lanes.get('2026-09-01');
    expect(day?.[0]).toMatchObject({ kind: 'event' });
    // 2 段目に出ていた 1 件も畳んだ数に含める（4 件中 1 件だけ見えている）。
    expect(day?.[1]).toEqual({ count: 3, kind: 'more', lane: 1 });
  });

  it('予定が無い日は入らない', () => {
    const lanes = assignEventLanes([event('a', '2026-09-01')], 3);
    expect(lanes.has('2026-09-02')).toBe(false);
  });
});
