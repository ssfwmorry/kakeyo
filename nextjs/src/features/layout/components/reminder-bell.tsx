'use client';

import { Bell, Check } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import type { ReminderItem } from '@/features/plan-reminder';
import { checkReminderAction } from '@/features/plan-reminder/actions';

// 期日超過の判定は SSR 側（layout）で todayJst を使って行い、ここには超過分のみ渡す。

export function ReminderBell({
  dueReminders
}: {
  dueReminders: ReminderItem[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const count = dueReminders.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type='button'
            className='relative flex items-center text-muted-foreground'
            aria-label='お知らせ'
          />
        }
      >
        <Bell className='size-5' />
        {count > 0 && (
          <Badge className='-right-2 -top-2 absolute size-4 justify-center rounded-full p-0 text-[10px]'>
            {count}
          </Badge>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>お知らせ</DialogTitle>
        </DialogHeader>
        {count === 0 ? (
          <p className='text-muted-foreground text-sm'>
            お知らせはありません。
          </p>
        ) : (
          <ul className='flex flex-col gap-3'>
            {dueReminders.map((reminder) => (
              <li
                key={reminder.id}
                className='flex items-center justify-between gap-2'
              >
                <span className='text-sm'>
                  『{reminder.name}』の日付が過ぎています。
                </span>
                <Button
                  size='icon'
                  variant='outline'
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      // 消化結果の成否トーストを発火する（失敗を無反応にしない）。
                      // 成功時は checkReminderAction 側の layout 再検証で
                      // dueReminders が再取得され、この一覧からも当該項目が消える。
                      const result = await checkReminderAction(reminder.id);
                      if (result.toast) {
                        toast[result.toast.type](result.toast.message);
                      }
                    });
                  }}
                  aria-label='消化'
                >
                  <Check className='size-4' />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
