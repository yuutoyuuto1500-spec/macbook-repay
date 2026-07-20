/*
  サービスワーカー（Service Worker）
  ブラウザの裏側に常駐する小さなプログラムで、このアプリでは
  「一度開いたページを端末に控えておき、電波が無くても開けるようにする」係。

  方針は「ネット優先」:
    1. まずネットから最新版を取りに行く（更新がすぐ反映される）
    2. 取れたら控え（キャッシュ）も新しくしておく
    3. 圏外などで取れなかったら、控えを出す（オフラインでも動く）
  「控え優先」にすると速い代わりに更新が届きにくくなるので、この順にしている。
*/

const CACHE_NAME = "repay-note-v1"; // 控えの棚の名前。作りを大きく変えたらここを v2 に上げる

// インストール直後から新しいサービスワーカーを即戦力にするお約束
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// ページが何かを読み込むたびに、ここが横取りして応答を差配する
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return; // 取得以外（送信など）は関与しない
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // ネットから取れた。控えを最新に差し替えてから返す
        const copy = res.clone(); // 応答は一度しか読めないので複製しておく
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)) // 取れなかったら控えを返す（オフライン時）
  );
});
