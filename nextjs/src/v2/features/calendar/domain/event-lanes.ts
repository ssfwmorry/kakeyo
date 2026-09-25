// カレンダーの帯（予定・リマインダー）を段に割り当てる純粋計算。
//
// 複数日にまたがる予定を「同じ段」で通して描くため、日ごとに独立して並べるのではなく
// 期間全体で段（lane）を決める。ある段は、期間が重なる別の予定には使えない。
//
// 段が溢れた日は「他N件」に畳む。畳む段を一番下に固定するので、セルの高さが揃う。

// 帯にする 1 件。予定もリマインダーもこの形に寄せてから渡す。
export type LaneEvent = {
  id: string;
  name: string;
  // 'YYYY-MM-DD'。単日なら start と end が同じ。
  startDate: string;
  endDate: string;
  colorName: string;
  // リマインダーは塗りではなく枠線で描き分ける。
  isReminder: boolean;
};

// セル 1 マスに描く帯 1 本。段の数だけ並び、空き段も 'empty' で埋める
// （下の段の位置を揃えるため、詰めずに空けておく）。
export type LaneSlot =
  | {
      kind: 'event';
      // 段の番号。空き段も詰めないので、描画側はこれを鍵に使える。
      lane: number;
      event: LaneEvent;
      // その日が帯の左端か（名前を出すのは左端だけ）。
      isStart: boolean;
      isEnd: boolean;
    }
  | { kind: 'more'; lane: number; count: number }
  | { kind: 'empty'; lane: number };

// 日付 → 段の配列。
export type LaneMap = Map<string, LaneSlot[]>;

// 期間が重ならないよう段を決め、日付ごとのスロットに展開する。
// maxLanes を超える分は、最下段を「他N件」に置き換えて畳む。
export function assignEventLanes(
  events: LaneEvent[],
  maxLanes: number
): LaneMap {
  // 開始が早い順、同じなら長い順。長いものを先に置くと段が寝やすい。
  const sorted = [...events].sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return a.startDate < b.startDate ? -1 : 1;
    }
    return spanDays(b) - spanDays(a);
  });

  // 日付 → その日に埋まっている段。
  const occupied = new Map<string, (LaneEvent | undefined)[]>();

  for (const event of sorted) {
    const dates = listDates(event.startDate, event.endDate);
    // 期間中どこも空いている最小の段を探す。
    let lane = 0;
    while (dates.some((date) => occupied.get(date)?.[lane] !== undefined)) {
      lane++;
    }
    for (const date of dates) {
      const lanes = occupied.get(date) ?? [];
      lanes[lane] = event;
      occupied.set(date, lanes);
    }
  }

  const result: LaneMap = new Map();
  for (const [date, lanes] of occupied) {
    result.set(date, toSlots(date, lanes, maxLanes));
  }
  return result;
}

// ある日の段の並びを、描画用のスロットへ変換する。
function toSlots(
  date: string,
  lanes: (LaneEvent | undefined)[],
  maxLanes: number
): LaneSlot[] {
  // occupied の段は歯抜け（sparse）になりうる。map は穴を飛ばすので、
  // Array.from で undefined に実体化してから空き段に変換する。
  const visible = Array.from(lanes.slice(0, maxLanes));
  const hiddenCount = lanes.slice(maxLanes).filter(Boolean).length;

  const slots: LaneSlot[] = visible.map((event, lane) =>
    event === undefined
      ? { kind: 'empty' as const, lane }
      : {
          kind: 'event' as const,
          lane,
          event,
          isStart: date === event.startDate,
          isEnd: date === event.endDate
        }
  );

  if (hiddenCount === 0) {
    return slots;
  }

  // 畳むときは最下段を「他N件」にする。そこに出ていた 1 件も畳んだ数に足す。
  const dropped = slots[maxLanes - 1];
  const count = hiddenCount + (dropped?.kind === 'event' ? 1 : 0);
  slots[maxLanes - 1] = { kind: 'more', lane: maxLanes - 1, count };
  return slots;
}

function spanDays(event: LaneEvent): number {
  return listDates(event.startDate, event.endDate).length;
}

// 開始日から終了日までの 'YYYY-MM-DD' を列挙する（両端を含む）。
// 暦日の足し算だけなので UTC で回す。
function listDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  // 不正な期間（終了が開始より前）は開始日だけを返す。
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [startDate];
  }
  for (
    let cursor = start;
    cursor <= end;
    cursor = new Date(cursor.getTime() + 86_400_000)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates.length === 0 ? [startDate] : dates;
}
