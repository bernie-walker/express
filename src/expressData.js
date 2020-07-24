const generateGetNStoriesQuery = function (offset, count) {
  return `SELECT usr.display_name as authorName, str.*
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published'
  ORDER BY str.last_modified DESC
  LIMIT ${offset},${count};
  `;
};
class Stories {
  constructor(db) {
    this.db = db;
  }
  get(count = -1, offset = 0) {
    const query = generateGetNStoriesQuery(offset, count);
    return new Promise((resolve) => {
      this.db.all(query, (err, rows) => {
        resolve(rows);
      });
    });
  }
}

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

module.exports = { Users, Stories };
