export const newsPreviewArticles = [
  {
    id: 'preview-tour-recruiting',
    isPreview: true,
    date: '2026-06-15T00:00:00+09:00',
    category: 'お知らせ',
    title: '4泊5日滞在型ツアーの募集を開始しました。《丹波と丹波篠山》',
    eyecatch: {
      url: './images/news/news-preview-editorial.jpg',
    },
    body: `
      <p class="preview-notice">こちらは、microCMSの記事が未登録のときに表示するレイアウト確認用のプレビューです。</p>
      <p>丹波と丹波篠山をめぐり、地域の暮らしと人に出会う滞在型ツアーを想定した記事の表示例です。</p>
      <p>里山の風景を歩き、農にふれ、土地の食を味わう時間を通して、訪れるだけでは見えない地域の日常をご案内します。</p>
      <h2>旅の内容</h2>
      <p>地域の方との交流、農作業の体験、古い町並みの散策などを組み合わせた、小さなグループの旅を想定しています。</p>
      <p>実際の募集要項、日程、料金などは、microCMSに登録された記事の内容がそのまま表示されます。</p>
    `,
  },
  {
    id: 'preview-field-story',
    isPreview: true,
    date: '2026-06-15T00:00:00+09:00',
    category: '旅の記録',
    title: '刃物鍛場で打ち込む',
    eyecatch: {
      url: './images/news/news-preview-editorial.jpg',
    },
    body: `
      <p class="preview-notice">こちらはレイアウト確認用のプレビューです。</p>
      <p>地域に受け継がれてきた手仕事を訪ね、作り手の言葉と道具に向き合う旅の記録を想定しています。</p>
      <p>microCMSへ本文とアイキャッチ画像を登録すると、この位置に実際の記事内容が表示されます。</p>
    `,
  },
  {
    id: 'preview-project',
    isPreview: true,
    date: '2026-04-01T00:00:00+09:00',
    category: '新しいプロジェクト',
    title: '里山環境から問いを立てる探究の造成',
    eyecatch: {
      url: './images/news/news-preview-editorial.jpg',
    },
    body: `
      <p class="preview-notice">こちらはレイアウト確認用のプレビューです。</p>
      <p>里山を教室に、地域の課題と可能性を自分たちの視点で考える探究プログラムの記事例です。</p>
      <p>見出し、段落、リスト、画像など、microCMSの本文編集で追加した内容に対応します。</p>
    `,
  },
  {
    id: 'preview-overseas',
    isPreview: true,
    date: '2026-01-21T00:00:00+09:00',
    category: '旅の記録',
    title: 'アメリカから丹波篠山へ',
    eyecatch: {
      url: './images/news/news-preview-editorial.jpg',
    },
    body: `
      <p class="preview-notice">こちらはレイアウト確認用のプレビューです。</p>
      <p>海外から訪れた方々と地域の暮らしをつなぐ、交流の記録を想定した記事です。</p>
      <p>公開後はmicroCMSに登録した写真と文章へ自動的に置き換わります。</p>
    `,
  },
  {
    id: 'preview-satoyama-tour',
    isPreview: true,
    date: '2025-11-03T00:00:00+09:00',
    category: '旅の記録',
    title: '丹波篠山里山暮らしツアー',
    eyecatch: {
      url: './images/news/news-preview-editorial.jpg',
    },
    body: `
      <p class="preview-notice">こちらはレイアウト確認用のプレビューです。</p>
      <p>農のある風景を歩き、土地の食卓を囲みながら、里山の暮らしを知るツアーの記事例です。</p>
      <p>microCMSの記事が公開されると、一覧の日付、タイトル、カテゴリーと詳細内容が実データに切り替わります。</p>
    `,
  },
];

export function getNewsPreviewArticle(id) {
  return newsPreviewArticles.find((article) => article.id === id) || null;
}
