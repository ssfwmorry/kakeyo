'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from 'cn';

// 51×31 のスイッチ。つまみは 27px の白い丸で、ON でアクセント地、OFF は面（弱）系の灰。
// デザインの「ペアと共有する」（Calendar の TODO シート）と「期間を指定」（PlanAdd）が
// この形。OFF の地は画面によって違うので offClass で差し替える。
//
// つまみの影はデザインが持つ数少ない影の 1 つ（README D17）。

export function Switch({
  className,
  offClass = 'bg-switch-off',
  ...props
}: SwitchPrimitive.Root.Props & { offClass?: string }) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 rounded-2xl transition-colors data-checked:bg-primary',
        offClass,
        className
      )}
      data-slot='switch'
      {...props}
    >
      <SwitchPrimitive.Thumb
        className='absolute top-0.5 left-0.5 size-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform data-checked:translate-x-5'
        data-slot='switch-thumb'
      />
    </SwitchPrimitive.Root>
  );
}
