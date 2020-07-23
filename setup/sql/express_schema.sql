PRAGMA foreign_keys = on;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS claps;
DROP TABLE IF EXISTS comments;

CREATE TABLE users (
	id varchar(42) PRIMARY KEY,
	display_name text NOT NULL DEFAULT 'Expresser',
	avatar_url text NOT NULL,
	bio text
);

CREATE TABLE stories (
	id integer PRIMARY KEY AUTOINCREMENT,
	written_by varchar(42) NOT NULL,
	state varchar(9) NOT NULL,
	title text NOT NULL,
	content text,
	cover_image text,
	last_modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (written_by) REFERENCES users(id),
  CHECK (state IN ('drafted','published'))
);

CREATE TABLE tags (
	id integer PRIMARY KEY AUTOINCREMENT,
	tag_on integer NOT NULL,
	tag varchar(50) NOT NULL,
  FOREIGN KEY (tag_on) REFERENCES stories(id)
);

CREATE TABLE claps (
	id integer PRIMARY KEY AUTOINCREMENT,
	clapped_on integer NOT NULL,
	clapped_by varchar(42) NOT NULL,
	FOREIGN KEY (clapped_on) REFERENCES stories(id),
	FOREIGN KEY (clapped_by) REFERENCES users(id)
);

CREATE TABLE comments (
	id integer PRIMARY KEY AUTOINCREMENT,
	commented_by varchar(42) NOT NULL,
	commented_on integer NOT NULL,
	comment text NOT NULL,
	commented_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commented_by) REFERENCES users(id),
  FOREIGN KEY (commented_on) REFERENCES stories(id)
);
