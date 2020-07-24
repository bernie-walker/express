const generateGetNStoriesQuery = function (offset, count) {
  return `SELECT usr.display_name as authorName, str.*
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published'
  ORDER BY str.last_modified DESC
  LIMIT ${offset},${count};`;
};
const generateGetStoryQuery = function (storyID) {
  return `SELECT usr.display_name as authorName,usr.avatar_url,
  str.title,str.content,str.id as storyID,str.written_by as authorID,
  date(str.last_modified) as lastModified
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published' AND str.id='${storyID}';`;
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

  getStory(storyID) {
    const query = generateGetStoryQuery(storyID);
    return new Promise((resolve) => {
      this.db.get(query, (err, row) => {
        resolve(row);
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
