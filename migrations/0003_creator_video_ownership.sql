CREATE TABLE IF NOT EXISTS creator_videos (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'unlisted', 'public', 'restricted')),
  download_policy TEXT NOT NULL DEFAULT 'disabled'
    CHECK (download_policy IN ('disabled', 'owner_only', 'allowed')),
  status TEXT NOT NULL DEFAULT 'pending_upload'
    CHECK (status IN ('pending_upload', 'uploaded', 'queued_moderation', 'approved', 'rejected', 'removed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES creator_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creator_videos_creator_created
  ON creator_videos(creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_creator_videos_creator_status
  ON creator_videos(creator_id, status);
