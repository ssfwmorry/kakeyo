// flash message 用 Cookie 名。next/headers に依存しない純粋な定数として切り出し、
// サーバ（setFlashToast）とクライアント（FlashToast）の双方から安全に import する。
// flash.ts に置くと next/headers がクライアントバンドルに混入するため分離している。

export const FLASH_COOKIE = 'flash-toast';
