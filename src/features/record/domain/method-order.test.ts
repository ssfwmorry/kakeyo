import { describe, expect, it } from 'vitest';
import { resolveMethodId } from './method-order';

describe('resolveMethodId', () => {
  it('新規入力ではマスタ順の先頭を優先する', () => {
    expect(
      resolveMethodId({
        methods: [{ id: 10 }, { id: 20 }, { id: 30 }],
        selected: null,
        isEditing: false
      })
    ).toBe(10);
  });
});
