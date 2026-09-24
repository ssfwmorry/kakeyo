import { cn } from 'cn';
import type { ComponentType, SVGProps } from 'react';

// 設定・入力画面のセクション見出し（アイコン + 名前）。
//
// 見出しは必ずアイコンを伴う。設定画面は同じ形のカードが縦に続くため、文字だけだと
// どこから別の話題になるのかが読み取れない。アイコンは節の切れ目の目印として置く。
//
// 画面に 1 つだけの主見出しは as='h1'（既定は節見出しの h2）。

type SectionHeadingProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: string;
  as?: 'h1' | 'h2';
  // アイコンを控えめにする（見出しが現在地表示を兼ねる画面で使う）。
  mutedIcon?: boolean;
};

export function SectionHeading({
  icon: Icon,
  children,
  as: Tag = 'h2',
  mutedIcon = false
}: SectionHeadingProps) {
  return (
    <Tag className='flex items-center gap-1.5 font-medium text-base'>
      <Icon
        className={cn('size-4', mutedIcon && 'text-muted-foreground')}
        aria-hidden
      />
      {children}
    </Tag>
  );
}
