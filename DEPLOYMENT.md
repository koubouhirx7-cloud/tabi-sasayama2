# Production Deployment

## Target

- Production URL: `https://satoyamatour.withsasayama.jp/`
- Repository: `koubouhirx7-cloud/tabi-sasayama2`
- Hosting: XServer
- Build output: `dist/`

## GitHub Actions secrets

Configure these repository Actions secrets before merging the release branch into `main`:

- `XSERVER_FTP_HOST`
- `XSERVER_FTP_USER`
- `XSERVER_FTP_PASS`
- `XSERVER_FTP_TARGET_DIR`

`XSERVER_FTP_TARGET_DIR` must be the document root assigned to
`satoyamatour.withsasayama.jp` in the XServer panel.

The server-managed `.env.php` is intentionally excluded from deployment.
Do not add it to Git or place its values in a `VITE_` environment variable.

## Release flow

1. Run `npm ci`.
2. Run `npm run build`.
3. Confirm the required pages and PHP proxy exist in `dist/`.
4. Merge the release branch into `main`.
5. Confirm the `XServer Deploy` workflow completes.
6. Verify the production home page, CMS-backed lists/details, and contact form.

The workflow can also be started manually from GitHub Actions after the secrets
are configured.
