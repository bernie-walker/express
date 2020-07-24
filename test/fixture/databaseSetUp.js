const Sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../testData/testExpressData.db');
const db = new Sqlite3.Database(dbPath);

const createUsersTableQuery = `
CREATE TABLE users (
	id varchar(42) PRIMARY KEY,
	display_name text NOT NULL DEFAULT 'Expresser',
	avatar_url text NOT NULL,
	bio text
);`;

const insertUserQuery = `INSERT INTO users(id, display_name, avatar_url) 
VALUES
	('bernie-walker','Bernard','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('palpriyanshu','Priyanshu','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('shiviraj','Shivam','https://avatars3.githubusercontent.com/u/583231?v=4'),
	('lazyhackerthani','Thanya','https://avatars3.githubusercontent.com/u/583231?v=4'),
  ('bugdriver','Rajath','https://avatars3.githubusercontent.com/u/583231?v=4');`;

const runPromisifyQuery = function (query) {
  return new Promise((resolve, reject) => {
    db.run(query, (err) => {
      err ? reject(err) : resolve({ msg: 'done' });
    });
  });
};

const setUpDatabase = async () => {
  await runPromisifyQuery(createUsersTableQuery);
  await runPromisifyQuery(insertUserQuery);
};

const cleanDatabase = async () => {
  await runPromisifyQuery('drop table users');
};

module.exports = { setUpDatabase, cleanDatabase };
