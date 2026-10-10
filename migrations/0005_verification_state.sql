CREATE TABLE IF NOT EXISTS verification_sessions (
  provider TEXT NOT NULL CHECK (provider IN ('veriff', 'didit')),
  provider_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, provider_session_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_sessions_user
  ON verification_sessions(user_id, provider, created_at DESC);

CREATE TABLE IF NOT EXISTS user_verification_states (
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('veriff', 'didit')),
  provider_session_id TEXT NOT NULL,
  identity_state TEXT NOT NULL
    CHECK (identity_state IN ('pending', 'verified', 'rejected', 'review', 'expired')),
  age_state TEXT NOT NULL
    CHECK (age_state IN ('pending', 'verified', 'rejected', 'expired')),
  provider_status TEXT NOT NULL,
  decision_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, provider),
  UNIQUE (provider, provider_session_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider, provider_session_id)
    REFERENCES verification_sessions(provider, provider_session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_verification_age_state
  ON user_verification_states(user_id, age_state);
