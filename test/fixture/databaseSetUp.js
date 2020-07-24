const createUsersTableQuery = `
CREATE TABLE users (
	id varchar(42) PRIMARY KEY,
	display_name text NOT NULL DEFAULT 'Expresser',
	avatar_url text NOT NULL,
	bio text
);`;

const insertUserQuery = `INSERT INTO users(id, display_name, avatar_url) 
VALUES
	('palpriyanshu','Priyanshu','https://avatars3.githubusercontent.com/u/583231?v=4')`;

const runPromisifyQuery = function (query, db) {
  return new Promise((resolve) => db.run(query, resolve));
};

const setUpDatabase = async (dbClient) => {
  await runPromisifyQuery(createUsersTableQuery, dbClient);
  await runPromisifyQuery(insertUserQuery, dbClient);
};

const cleanDatabase = async () => {
  await runPromisifyQuery('drop table users');
};

module.exports = { setUpDatabase, cleanDatabase };
