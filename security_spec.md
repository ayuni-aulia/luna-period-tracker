# Security Specification — Period Tracker (`Luna`)

## Data Invariants

1. **Strict Ownership Isolation**: Every `users/{userId}` document and every `period_logs/{logId}` document belongs to exactly one verified user (`request.auth.uid`). No authenticated user may read, list, create, update, or delete another user's records.
2. **Verified Identity Gate**: All database reads and writes require an authenticated user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
3. **Immutable Ownership & Creation Timestamps**: `uid` / `user_id` and `createdAt` / `created_at` cannot be altered after creation. Server timestamps (`request.time`) are strictly enforced on `created*` and `updated*`.
4. **Strict Field & Date Validation**: All strings, integers, and date fields (`YYYY-MM-DD`) are bounded in size and validated by regex/range; `end_date` is either `null` or `>= start_date`. Extra/shadow fields are rejected.
5. **Path Hardening**: Document IDs (`userId`, `logId`) must match `^[a-zA-Z0-9_-]{1,128}$`.

## Adversarial Test Payloads ("Dirty Dozen")

1. **Unauthenticated read on `period_logs`**: `auth = null`, `get /period_logs/log1` -> `PERMISSION_DENIED`.
2. **Unverified email write on `period_logs`**: `auth = { uid: 'u1', token: { email_verified: false } }`, `create /period_logs/log1` -> `PERMISSION_DENIED`.
3. **Cross-user `get` on `period_logs`**: `auth = { uid: 'u2', token: { email_verified: true } }`, `get /period_logs/u1_log` -> `PERMISSION_DENIED`.
4. **Unscoped `list` query on `period_logs`**: `auth = { uid: 'u2', token: { email_verified: true } }`, `list /period_logs` without `where('user_id', '==', 'u2')` -> `PERMISSION_DENIED`.
5. **Identity spoofing on `create`**: `auth.uid = 'u2'`, payload `{ user_id: 'u1', ... }` -> `PERMISSION_DENIED`.
6. **Shadow field injection on `create`**: Payload includes `{ ..., isAdmin: true }` -> `PERMISSION_DENIED`.
7. **Shadow field injection on `update`**: Payload updates `{ start_date: '2026-11-10', updated_at: request.time, extra: 1 }` -> `PERMISSION_DENIED`.
8. **Ownership transfer on `update`**: Updating `user_id` from `'u1'` to `'u2'` -> `PERMISSION_DENIED`.
9. **Client-forged timestamp on `create`**: Payload sets `created_at` to a past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Inverted date range**: `start_date: '2026-11-20'`, `end_date: '2026-11-10'` -> `PERMISSION_DENIED`.
11. **Malformed ID poisoning**: Document ID exceeding 128 chars or containing invalid symbols -> `PERMISSION_DENIED`.
12. **PII cross-user read on `users/{userId}`**: `auth.uid = 'u2'` reading `/users/u1` -> `PERMISSION_DENIED`.
