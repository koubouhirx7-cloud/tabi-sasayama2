# Agent Notes

## Project Context
- Work in this copy: `with-sasayama-edit-20260626`.
- The original `with-sasayama` folder is kept as the untouched source copy.
- This is a static Vite site with many standalone HTML pages. `education.html` currently carries page-specific CSS inline.

## Education Page Redesign Notes
- The education page visual direction is based on a supplied reference screenshot:
  - white hero area
  - handwritten Japanese title
  - photo gallery on a diagonal
  - green program section with a matching diagonal top edge
  - dark green footer
- Education assets from the ZIP were copied into:
  - `public/images/education/`
  - `public/pdf/education/`
- The former regenerated title remains as an archived option:
  - `public/images/education/education-title-calligraphy-imagegen.png`
- The active title is the selected A-style asset listed under "Handwritten Title Direction".
- Keep the old source calligraphy image unless intentionally cleaning assets:
  - `public/images/education/education-title-calligraphy.png`

## Diagonal Gallery Lessons
- The important behavior is that the gallery and green section should share the same diagonal angle until the mobile breakpoint.
- Use the CSS variables in `education.html` as the source of truth:
  - `--edu-gallery-angle`
  - `--edu-diagonal-rise`
- Avoid percentage-only clip-path values like `polygon(0 24%, 100% 0, ...)` for the green section. The apparent angle changes with viewport height.
- Prefer a viewport-width-based diagonal rise:
  - `clip-path: polygon(0 var(--edu-diagonal-rise), 100% 0, 100% 100%, 0 100%)`
- It is acceptable for the gallery image area to crop slightly at intermediate widths if that keeps the gallery edge aligned with the green diagonal.
- If the photos should show their full frame, keep the tiles at the source image ratio (`aspect-ratio: 4 / 3`) and use `object-fit: contain`. This makes the gallery taller, so desktop hero `min-height` must be increased enough to avoid overlapping the hero copy.
- Keep about 25px of white space between the bottom edge of the diagonal gallery and the visible green diagonal, so the photos do not touch the green section directly.
- Do not reintroduce the blue sky/mountain background behind the gallery unless explicitly requested. The user asked to remove it.
- On mobile, it is acceptable for the layout to switch away from the diagonal and become a readable stacked/grid layout.

## Image Paths
- `education.html` uses relative paths such as `./images/...` and `./pdf/...`.
- This is intentional so the page can still show images when opened directly as a local `file://` preview.
- For other pages, root paths may still be present. Do not mass-change all pages unless requested.

## Handwritten Title Direction
- The user selected "A案: 上品な筆ペン風" as the handwritten title direction.
- Use A-style title assets for the current edited pages and as the visual reference for future page title edits.
- Current A-style assets:
  - `images/title-options/title-option-a-education.png`
  - `images/title-options/title-option-a-case.png`
  - `images/title-options/title-option-a-company.png`
  - `images/title-options/title-option-a-news.png`
  - `images/title-options/title-option-a-contact.png`
  - `images/title-options/title-option-a-stay.png`
  - `images/title-options/title-option-a-about.png`
  - `public/images/title-options/title-option-a-education.png`
  - `public/images/title-options/title-option-a-case.png`
  - `public/images/title-options/title-option-a-company.png`
  - `public/images/title-options/title-option-a-news.png`
  - `public/images/title-options/title-option-a-contact.png`
  - `public/images/title-options/title-option-a-stay.png`
  - `public/images/title-options/title-option-a-about.png`
- Prefer relative `./images/...` paths on standalone HTML pages when local `file://` preview matters.

## Company Page Notes
- `company.html` is the local company information and travel registration page opened from the footer.
- Its visual direction follows the supplied company-page reference:
  - white page with generous spacing
  - A-style handwritten `会社案内` title with a dark green vertical mark
  - compact bordered tables with muted green-gray label cells
  - dark green footer
- All public-page footer links labeled `会社案内・旅行業登録` should point to `company.html`, not the former Google Drive document.
- The original Google Drive company document remains available from the `会社案内・登録資料` row inside `company.html`.
- All public-page links labeled `プライバシーポリシー` should point to:
  - `https://drive.google.com/file/d/1ogeZLtQ7jQ91XwM-UyOWyyZhMOIsl6N9/view?usp=drive_link`
- On mobile, company-table rows switch to stacked label/value blocks to prevent horizontal overflow.

## About / Travel-Making Page Notes
- `about.html` is the `旅作り` navigation destination, while its supplied handwritten page title uses the exact phrase `旅づくり`.
- Keep the global site navigation. The former large beige `旅作り / about us` page-header band was intentionally removed.
- The page heading follows the shared white-background pattern: dark green vertical mark plus the A-style handwritten title.
- The original Google Drive title source is archived at `source-assets/about/about-title-source.png`.
- The active title image is `images/title-options/title-option-a-about.png`, with a matching copy under `public/images/title-options/`.

## Case / Customize Page Notes
- `customize.html` is currently used as the "事例紹介・ストーリー" page.
- The page reads microCMS `voices` data through `voices.js`; keep that connection intact.
- Do not use dummy photos when microCMS has no published cases. Instead, render neutral placeholder cards that show the final card structure.
- The list displays six entries per page in a 3-column by 2-row desktop grid. Use dot pagination when there are more than six published entries.
- Keep the descending two-digit card numbers (`06` through `01` for one six-card page), the dark date badge, and the fixed card image ratio so microCMS images align consistently.
- The neutral empty state also renders six frames, but labels them as microCMS display slots so they are not mistaken for published customer stories.
- `customize-detail.html` is the individual case page, loaded by `voice-detail.js` from microCMS `voices` using the `id` query parameter.
- Real case cards link to `customize-detail.html?id=<content-id>&no=<display-number>`. When microCMS is empty, the list shows a clearly labeled detail-layout preview link instead of making placeholder cards look like real articles.
- The detail page follows the supplied case reference:
  - two-digit number, title, and dark date badge
  - participant voice block
  - photo gallery on the left
  - request, proposal, and day-of summary table on the right
  - dark green footer
- Detail data mapping supports the current fields and optional future fields:
  - title: `title`, otherwise `stayProgram`
  - participant voice: `comment`, `customerVoice`, or `voice`
  - participant metadata: `fromOrigin`, `age`, `gender`
  - request: `request`, `requestContent`, or `purpose`
  - proposal: `proposal`, `plan`, `suggestion`, or `itinerary`
  - day-of summary: `onTheDay`, `dayOf`, `day`, or `result`
  - gallery: `gallery`, `images`, `photos`, then `image`
- Case cards should map real microCMS data as follows:
  - title: `title` when present, otherwise `stayProgram`
  - date: `publishedAt`, then `createdAt`, then `updatedAt`
  - image: `image.url`
  - excerpt: `purpose`, otherwise stripped `comment`
- The case page visual direction is:
  - white handwritten hero
  - compact 3-column story cards on desktop
  - neutral empty card frames while content is pending
  - full-width landscape photo before the dark footer
- Google Drive source assets from the supplied `4. 事例紹介` folder are archived in `source-assets/cases/`.
- Keep the full-resolution field photo at `source-assets/cases/case-landscape-original.jpg`; use the optimized copies on the page:
  - `images/cases/case-story-landscape-drive.jpg`
  - `public/images/cases/case-story-landscape-drive.jpg`
- The supplied handwritten source is archived at `source-assets/cases/case-title-source.png`. The active title remains the selected A-style generated asset listed under "Handwritten Title Direction".

## News Page Notes
- `news.html` is the latest-information list page and reads the microCMS `news` endpoint through `main-news.js`.
- `news-detail.html` is the article page and reads the selected microCMS entry through `main-news-detail.js`.
- The live microCMS `category` field currently returns an array such as `["レポート"]`. Normalize it before building filters, comparing the selected category, or rendering the category label; otherwise duplicate filter labels appear.
- List rows use the microCMS date, title, and category. Detail pages use the title, category, date, eyecatch, and body.
- When microCMS has no published entries, use the shared layout-preview entries in `news-preview-data.js` so the list and detail interaction can still be reviewed. Real microCMS articles always take priority and replace the preview list automatically.
- Preview detail articles use `images/news/news-preview-editorial.jpg`; do not present the preview copy as published customer information.
- The list supports category and year filters and displays five entries per page with dot pagination.
- Keep the detail layout as article text on the left and the full eyecatch image on the right at desktop widths; stack the image above the body on mobile.
- Google Drive source assets for the redesign are archived in `source-assets/news/`.
- Use the optimized rice-field image on the public page:
  - `public/images/news/news-rice-field-web.jpg`
  - `images/news/news-rice-field-web.jpg`
- Keep the full-resolution Drive photo in `source-assets/news/news-rice-field-original.jpg`; do not publish that large original in the built site.
- Keep the supplied handwritten source in `source-assets/news/news-title-source.png`. The active page title is the selected A-style generated asset listed under "Handwritten Title Direction".

## Contact Page Notes
- `contact.html` follows the supplied narrow, left-aligned form reference while keeping the shared white header and dark green footer.
- The active `お問い合わせ` page title uses the selected A-style asset listed under "Handwritten Title Direction".
- The Google Drive handwriting source is archived in `source-assets/contact/contact-title-source.png`.
- Keep the two-step contact flow in `contact.js`: validate the inputs, show the confirmation view, then submit to `send_contact.php`.
- The mail handler receives the required contact message plus optional first and second dates, adult/child/infant counts, budget, and desired experience.
- Keep the honeypot and required anti-robot checkbox when adjusting the form.

## Stay Page Notes
- `stay.html` is the experience and stay program list page. It reads the microCMS `stay` endpoint through `main-stay.js`; keep this connection intact.
- Published program cards link to `stay-detail.html?id=<content-id>`. The detail page remains the source of the full program information and application route.
- `stay-detail.html?preview=1` renders a clearly labeled local layout preview while microCMS has no published program. The six list-preview cards link to this preview route.
- The stay detail page follows the supplied vertical article reference:
  - title with a dark green vertical mark and optional subtitle
  - introductory rich text
  - program photo gallery
  - one continuous bordered information table
  - centered application, customization, and list-return actions
  - dark green footer
- `stay-detail.js` maps the detail table to `infoDates`, `infoCapacity`, `infoDecision`, `scheduleBody`, `infoPrice`, `includesBody`, `infoCancel`, and optional `infoAccess`/`access`.
- Gallery data may contain either microCMS image objects or URL strings. Keep both forms supported because the current admin flow may save either representation.
- On mobile, gallery photos scroll horizontally and each information row stacks its label above its content.
- Real microCMS records use these fields:
  - image: `heroImage.url`, then `image.url`
  - title: `title`, then `stayProgram`
  - category: `category`
  - metadata: `infoDates`/`date`, `infoDuration`/`duration`, and `infoPrice`/`price`
  - ordering: `order`; records with `isPublic === false` are hidden
- When no public microCMS records exist, show six clearly labeled layout-preview cards. Any published record removes the entire preview set automatically.
- The listing layout follows the supplied Drive reference:
  - A-style handwritten `体験・滞在プログラム` title with a dark green vertical mark
  - image-overlay program grid
  - `SASAGUIDE` local guide introduction
  - three value columns
  - full-width castle-town photograph
  - dark green footer
- Program cards use three columns on wide desktop, two columns at 900px and below, and one column at 680px and below.
- Google Drive source assets are archived in `source-assets/stay/`.
- Keep the original town photo at `source-assets/stay/stay-landscape-original.jpg`; use the optimized public copies:
  - `images/stay/stay-landscape-drive.jpg`
  - `public/images/stay/stay-landscape-drive.jpg`
- The active A-style title image is `images/title-options/title-option-a-stay.png`, with a matching copy under `public/images/title-options/`.

## Preview Deployment Notes
- A Vercel preview project was created for customer review.
- Standard Vercel preview URLs may show a Vercel login page because of deployment protection.
- Use Vercel's share-link flow when handing a URL to a customer:
  - generate access with `_get_access_to_vercel_url`
  - share the URL containing `_vercel_share=...`
- These share links expire, typically after about 23 hours.
- After further changes, redeploy with:
  - `npx vercel@latest deploy --yes`
  - then generate a fresh share URL.
- If Vercel share links still redirect to a login page, use a temporary Cloudflare Tunnel for customer review:
  - run the Vite dev server on a spare port with `--host 0.0.0.0`
  - run `npx --yes cloudflared tunnel --url http://127.0.0.1:<port>`
  - keep both terminal sessions running while the customer reviews the page
- Vite blocks unknown tunnel hostnames unless allowed. The current `vite.config.js` permits `.trycloudflare.com` hosts for this review workflow.

## Verification
- Run `npm run build` after edits.
- For visual checks, inspect at least:
  - desktop wide width
  - intermediate width before mobile breakpoint, around 900-1100px
  - mobile width
- The common issue to watch is the gallery/green diagonal drifting apart at intermediate widths.

## XServer Production Deployment
- Production URL: `https://satoyamatour.withsasayama.jp/`.
- Confirmed XServer account details:
  - server ID: `xs203337`
  - host: `sv12640.xserver.jp`
  - SSH port: `10022`
  - document root: `/home/xs203337/withsasayama.jp/public_html/satoyamatour.withsasayama.jp`
- The dedicated local SSH key is `~/.ssh/xserver_withsasayama_20260730`. Do not reuse keys from other customer accounts.
- Before each production write, create a timestamped tar backup outside `public_html`, under `/home/xs203337/withsasayama.jp/deployment_backups/`, and verify it with `gzip -t`.
- Never guess the upload destination. Confirm it by comparing the SHA-256 of the live URL and the server-side `index.html`.
- Upload the contents of `dist/` into the document root. Do not upload the `dist` directory as a nested folder.
- Do not use `rsync -a` from this external volume. Local build files can have mode `700`, and archive mode will propagate those permissions and cause a production `403`.
- Use recursive/checksum/timestamp transfer without permission propagation, for example `rsync -rctz --no-perms`, and do not use `--delete` for routine updates.
- Exclude these paths from deployment:
  - `._*` and `.DS_Store`
  - `.user.ini` and `.env.php`
  - `api-php/data/***`
  - `logs/***`
- XServer's working permissions for this site are:
  - document root: `711`
  - subdirectories: `705`
  - public files: `604`
  - `.user.ini`: `600`
  - `api-php/data/analytics-config.json`: `644`
- The live `.env.php` is intentionally outside the site root at `/home/xs203337/withsasayama.jp/public_html/.env.php`. Never overwrite or move it.
- After upload, verify:
  - a second checksum dry run reports zero transferred files
  - primary pages return HTTP 200
  - the live `index.html` hash matches `dist/index.html`
  - `/api/get-content?endpoint=stay&limit=1` returns JSON
  - the home, news list/detail, stay list/detail, customize list/detail, company, contact, and education pages render in Chrome
