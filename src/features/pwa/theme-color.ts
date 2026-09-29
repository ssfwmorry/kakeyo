// standalone 表示のステータスバーの地になる色。
//
// 画面上端のヘッダは自前の背景を持たず (private)/layout の bg-background が透けるので、
// 境目を出さないため globals.css の --background と同値にする。片方だけ直すとずれる。
export const THEME_COLOR = {
  light: '#f4f5f4',
  dark: '#0f1213'
} as const;
