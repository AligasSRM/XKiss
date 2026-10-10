# XKiss Storage Connection Checklist

Status: YELLOW — configuration and live tests still required.

- [ ] Confirm provider name and exact S3 endpoint from its dashboard.
- [ ] Confirm region.
- [ ] Confirm bucket name exactly as shown in the provider dashboard.
- [ ] Create/confirm a least-privilege access key for this bucket.
- [ ] Store credentials only in the XKiss server-side secret manager.
- [ ] Verify no credentials are present in frontend assets, logs, commits, or public files.
- [ ] Test upload of a harmless temporary object.
- [ ] Read the object back and compare its contents.
- [ ] Delete the temporary object.
- [ ] Verify unauthorized access is denied.
- [ ] Record test evidence before marking this stage GREEN.

Do not paste secret access keys into chat or GitHub. Do not mark this checklist complete without test evidence.
