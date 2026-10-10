# ElasticLake verification through GitHub Actions

Provider documentation identifies the S3 endpoint as `https://app.elasticlake.com`, with region `auto`. ElasticLake bucket names use the `lake--pond--bucket` form.

This repository contains a GitHub Actions workflow that performs a real, temporary write → read-back comparison → delete against the XKiss bucket.

## Required GitHub Actions secrets

In the XKiss repository, open **Settings → Secrets and variables → Actions → New repository secret** and add these names. Put only the replacement key values into the secret fields; never commit or paste the values into source files.

- `ELASTICLAKE_ACCESS_KEY_ID`
- `ELASTICLAKE_SECRET_ACCESS_KEY`

The access key must be active and scoped to the XKiss bucket with permission to put, get, and delete objects. Because a key was exposed in chat, revoke that exposed key and create a replacement before running the workflow.

## Run the test

Open **Actions → XKiss ElasticLake Storage Verification → Run workflow**.

A green result proves only that GitHub Actions could write, read, compare, and delete a temporary object in ElasticLake. It does **not** by itself deploy or reconfigure the running XKiss Worker. Production runtime integration and its server-side secret configuration remain a separate deployment step. Do not mark production storage GREEN until the deployed application itself passes its live storage self-test.
