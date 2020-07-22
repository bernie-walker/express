DROP TABLE IF EXISTS users;

CREATE TABLE users (
	id varchar(42) PRIMARY KEY,
	display_name text NOT NULL DEFAULT 'Expresser',
	avatar_url text NOT NULL,
	bio text
);

INSERT INTO	users(id, display_name, avatar_url) 
VALUES
	('bernie-walker','Bernard','https://avatars2.githubusercontent.com/u/58025656?v=4'),
	('palpriyanshu','Priyanshu','https://avatars2.githubusercontent.com/u/58025656?v=4'),
	('shiviraj','Shivam','https://avatars2.githubusercontent.com/u/58025656?v=4'),
	('lazyhackerthani','Thanya','https://avatars2.githubusercontent.com/u/58025656?v=4');


DROP TABLE IF EXISTS stories;

CREATE TABLE stories (
	id integer PRIMARY KEY AUTOINCREMENT,
	written_by varchar(42) NOT NULL,
	state varchar(9) NOT NULL DEFAULT 'drafted',
	title text NOT NULL,
	content text,
	cover_image text,
	last_modified timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (written_by) REFERENCES users(id),
  CHECK (state IN ('drafted','published'))
);

INSERT INTO stories(written_by, state, title) 
VALUES
	('bernie-walker', 'published', 'what is this'),
	('bernie-walker', 'drafted', 'this is it'),
	('palpriyanshu', 'published', 'environment'),
	('palpriyanshu', 'drafted', 'rainforests'),
	('shiviraj', 'published', 'pyar kiya to darna kya'),
	('shiviraj', 'drafted', 'dhoka de diya, dil thod diya'),
	('lazyhackerthani', 'published', 'why am i lazy'),
	('lazyhackerthani', 'drafted', 'how to hack it');


DROP TABLE IF EXISTS tags;

CREATE TABLE tags (
	id integer PRIMARY KEY AUTOINCREMENT,
	tag_on integer NOT NULL,
	tag varchar(50) NOT NULL,
  FOREIGN KEY (tag_on) REFERENCES stories(id)
);


INSERT INTO tags(tag_on, tag) 
VALUES 
	(3, 'go green'),
	(5, 'romance'),
	(6, 'love kills'),
	(8, 'hacking');


DROP TABLE IF EXISTS claps;

CREATE TABLE claps (
	id integer PRIMARY KEY AUTOINCREMENT,
	clapped_on integer NOT NULL,
	clapped_by varchar(42) NOT NULL,
	FOREIGN KEY (clapped_on) REFERENCES stories(id),
	FOREIGN KEY (clapped_by) REFERENCES user(id)
);


INSERT INTO claps(clapped_on, clapped_by)
VALUES 
	(6, 'bernie-walker'),
	(6, 'palpriyanshu'),
	(6, 'lazyhackerthani'),
	(3, 'bernie-walker'), 
	(3, 'shiviraj'),
	(8, 'palpriyanshu'),
	(8, 'shiviraj');


DROP TABLE IF EXISTS comments;

CREATE TABLE comments (
	id integer PRIMARY KEY AUTOINCREMENT,
	commented_by varchar(42) NOT NULL,
	commented_on integer NOT NULL,
	comment text NOT NULL,
	commented_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commented_by) REFERENCES users(id),
  FOREIGN KEY (commented_on) REFERENCES stories(id)
);


INSERT INTO comments(commented_by, commented_on, comment)
VALUES 
	('bernie-walker', 6, 'nice'),
	('palpriyanshu', 6, 'cool'),
	('lazyhackerthani', 6, 'very good'),
	('bernie-walker', 3, 'wonderful'),
	('shiviraj', 3, 'extra ordinary'),
	('palpriyanshu', 8, 'informative'),
	('shiviraj', 8, 'picturesque');


-- this is a line

SELECT 
	usr.display_name as  userName,
	str.*
FROM 
	stories AS str
JOIN 
	users AS usr 
ON 
	str.written_by = usr.id
ORDER BY
	str.last_modified DESC
LIMIT 4,4;
