const dbScripts = require('../testData/dbScripts.json');

const runScript = function (query, db) {
  return new Promise((resolve) => db.run(query, resolve));
};

const setUpDatabase = async (dbClient, tableNames) => {
  for (const table of tableNames) {
    const { tableSchema, insertionScript } = dbScripts[table];
    await runScript(tableSchema, dbClient);
    await runScript(insertionScript, dbClient);
  }
};

const cleanDatabase = async (dbClient, tableNames) => {
  for (const table of tableNames) {
    await runScript(`drop table ${table}`, dbClient);
  }
};

module.exports = { setUpDatabase, cleanDatabase };
