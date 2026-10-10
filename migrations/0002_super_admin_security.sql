-- Section 14: additive security tables. Existing users and sessions are preserved.
CREATE TABLE IF NOT EXISTS super_admin_mfa (
  user_id TEXT PRIMARY KEY,
  secret_ciphertext TEXT NOT NULL,
  secret_iv TEXT NOT NULL,
  enabled_at TEXT,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  last_verified_step INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_security_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  outcome TEXT NOT NULL,
  reason TEXT,
  request_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_security_audit_created_at
  ON admin_security_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_security_audit_actor
  ON admin_security_audit(actor_user_id, created_at);

-- Server-side session assurance fields. Nullable means the session has not passed MFA/reauth.
ALTER TABLE sessions ADD COLUMN mfa_verified_at TEXT;
ALTER TABLE sessions ADD COLUMN reauthenticated_at TEXT;
