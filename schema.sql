-- cleanup
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- users (both seniors and juniors)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- 'senior', 'junior'
  name TEXT, -- Optional for juniors
  department TEXT, -- Optional for juniors
  intro TEXT,
  emoji TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- posts (only seniors create posts)
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  senior_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT, -- JSON array
  status TEXT DEFAULT 'open', -- open, closed
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (senior_id) REFERENCES users(id)
);

-- requests (juniors request seniors)
CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  junior_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  connection_note TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (junior_id) REFERENCES users(id)
);

-- matches (between senior and junior)
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  senior_timetable TEXT, -- JSON 2D array
  junior_timetable TEXT, -- JSON 2D array
  senior_location TEXT, -- JSON object
  junior_location TEXT, -- JSON object
  confirmed_time TEXT, -- JSON object {day, hour, label}
  confirmed_location TEXT, -- JSON object
  status TEXT DEFAULT 'coordinating', -- coordinating, confirmed
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (request_id) REFERENCES requests(id)
);
