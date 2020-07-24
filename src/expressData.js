class Users {
  constructor(db) {
    this.db = db;
  }
  getUserInfo(userId) {
    const query = `SELECT * FROM users WHERE id='${userId}'`;
    return new Promise((resolve) => {
      this.db.get(query, (err, row) => {
        resolve(row);
      });
    });
  }
}

module.exports = { Users };
