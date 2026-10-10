# Section 14 — Super Admin MFA Operations

## Runtime configuration
The Worker secret `XKISS_MFA_ENCRYPTION_KEY` must be a base64-encoded, cryptographically random 32-byte key. It is configured as a Cloudflare Worker secret and must never be committed or returned by a status endpoint. Rotating it without re-encrypting existing MFA secrets will make existing enrolled factors unverifiable.

Generate a key locally with Node.js (do not paste it into GitHub):
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Enrollment flow
1. Obtain a valid bearer session for the existing `super_admin` account.
2. Reauthenticate by POSTing `{"password":"<current password>"}` to `/api/admin/security/reauth`.
3. POST to `/api/admin/security/mfa/enroll` with the same bearer token. Scan the returned `otpauthUri` in an authenticator app. Treat the returned secret as a one-time credential.
4. POST the six-digit authenticator code to `/api/admin/security/mfa/enable`.
5. For a later session or after password reauthentication, POST a fresh six-digit code to `/api/admin/security/mfa/verify`.

The current implementation accepts TOTP only. It uses AES-GCM encrypted secret storage, a 30-second TOTP period, one-step clock tolerance, replay prevention, five-failure lockout for 15 minutes, and requires fresh MFA (five minutes) for super-admin authorization. WebAuthn and recovery codes are not implemented.

## Release gate
Do not mark Section 14 GREEN until GitHub Actions tests pass, the PR is merged, the Worker bindings are verified, the Worker is deployed, and live tests prove both a valid MFA flow and fail-closed behavior. Never enable privileged access merely because the secret exists.
