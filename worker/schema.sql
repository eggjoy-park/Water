-- 게시글
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  password TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  like_count INTEGER DEFAULT 0
);

-- 댓글
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 좋아요 (방문자별 1회 제한)
CREATE TABLE IF NOT EXISTS likes (
  post_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, visitor_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 갤러리 게시글
CREATE TABLE IF NOT EXISTS gallery_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  password TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  like_count INTEGER DEFAULT 0
);

-- 갤러리 댓글
CREATE TABLE IF NOT EXISTS gallery_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
);

-- 갤러리 좋아요 (방문자별 1회 제한)
CREATE TABLE IF NOT EXISTS gallery_likes (
  post_id INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (post_id, visitor_id),
  FOREIGN KEY (post_id) REFERENCES gallery_posts(id) ON DELETE CASCADE
);
