CREATE TABLE IF NOT EXISTS content_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL,
  target_video_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'underage', 'nonconsensual', 'illegal_content', 'abuse',
    'copyright', 'spam', 'privacy', 'other'
  )),
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (target_video_id) REFERENCES creator_videos(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_one_open_per_user_video
  ON content_reports(reporter_user_id, target_video_id)
  WHERE status IN ('open', 'reviewing');

CREATE INDEX IF NOT EXISTS idx_content_reports_queue
  ON content_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS content_moderation_actions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  moderator_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('reviewing', 'actioned', 'dismissed')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES content_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (moderator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_moderation_actions_report
  ON content_moderation_actions(report_id, created_at DESC);
