# XKiss Storage Setup (S3-compatible)

This folder is a **safe setup workspace** for connecting XKiss to its S3-compatible storage provider.

## Security rules
- Never commit real access keys, secret keys, tokens, or downloaded `.env` files.
- Keep credentials in the hosting provider's secret/environment-variable settings.
- If a real secret was exposed publicly, revoke it and create a replacement.
- Do not enable public bucket access for private user files.

## Required environment variables
Copy `.env.example` to a private local `.env` file only if your local workflow requires it. Fill in values privately; never upload that file to GitHub.

- `S3_ENDPOINT`: exact endpoint shown by the storage provider.
- `S3_REGION`: exact region shown by the provider.
- `S3_BUCKET`: the bucket name shown in the provider dashboard.
- `S3_ACCESS_KEY_ID`: access key ID.
- `S3_SECRET_ACCESS_KEY`: secret access key.

## Before connecting
1. Confirm the provider's exact endpoint and region.
2. Confirm the key is limited to the required bucket and operations.
3. Configure secrets in the XKiss server/Worker environment, not in browser code.
4. Run a private test upload, read-back, and delete using a non-sensitive test object.
5. Verify unauthorized requests fail closed.

## Important architecture rule
S3 credentials must only be used by trusted server-side code (for example, the XKiss Worker). **Never put S3 secrets in frontend JavaScript or a public website.**

This guide is documentation only. It does not prove that storage is connected or tested.
