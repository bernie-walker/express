/* eslint-disable no-invalid-this */
/* eslint-disable no-magic-numbers */
/* eslint-disable handle-callback-err */
const latestNStoriesQuery = function (count, offset) {
  return `SELECT usr.display_name as authorName, str.*
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published'
  ORDER BY str.last_modified DESC
  LIMIT ${offset},${count};`;
};

const publishedStoryQuery = function (storyID) {
  return `SELECT usr.display_name as authorName,usr.avatar_url,
  str.title,str.content,str.id as storyID,str.written_by as authorID,
  date(str.last_modified) as lastModified
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published' AND str.id='${storyID}';`;
};

const storyOfUserQuery = function (storyID, userID) {
  return `SELECT title, content, state, id as storyID 
          FROM stories 
          WHERE id='${storyID}' AND written_by='${userID}';`;
};

const userProfileQuery = function (userID) {
  return `
  SELECT usr.id as profileID, usr.display_name as profileName, 
  usr.avatar_url as profileAvatar, usr.bio,
  str.id as storyID, str.title, str.content, 
  str.cover_image as coverImage, date(str.last_modified) as lastModified
  FROM users as usr 
  LEFT JOIN stories as str ON usr.id=str.written_by 
  WHERE usr.id='${userID}' AND (str.state='published' OR str.state IS NULL);
  `;
};

class ExpressDB {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  getLatestNStories(count = -1, offset = 0) {
    return new Promise((resolve) => {
      this.dbClient.all(latestNStoriesQuery(count, offset), (err, rows) => {
        resolve(rows);
      });
    });
  }

  getPublishedStory(storyID) {
    return new Promise((resolve) => {
      this.dbClient.get(publishedStoryQuery(storyID), (err, row) => {
        resolve(row);
      });
    });
  }

  getStoryOfUser(storyID, userID) {
    return new Promise((resolve) => {
      this.dbClient.get(storyOfUserQuery(storyID, userID), (err, row) => {
        resolve(row);
      });
    });
  }

  createStoryByUser(userID) {
    const query = `
    INSERT INTO stories(written_by, content) 
    VALUES(?, '[]')`;

    return new Promise((resolve) => {
      this.dbClient.run(query, [userID], function () {
        resolve(this.lastID);
      });
    });
  }

  updateStory(modifiedStory) {
    const { title, content, state, id, author } = modifiedStory;
    const query = `UPDATE stories SET title=?, content=?, state=?, 
    last_modified=CURRENT_TIMESTAMP
    WHERE id=? AND written_by=?`;

    return new Promise((resolve) => {
      this.dbClient.run(
        query,
        [title, JSON.stringify(content), state, id, author],
        resolve
      );
    });
  }

  getUserInfo(userID) {
    const query = `
    SELECT id, display_name, avatar_url 
    FROM users WHERE id='${userID}'`;
    return new Promise((resolve) => {
      this.dbClient.get(query, (err, row) => {
        resolve(row);
      });
    });
  }

  getUserStories(userID, state) {
    const query = `
    SELECT title, id as storyID, date(last_modified) as lastModified
    FROM stories 
    WHERE written_by='${userID}' AND state='${state}' 
    ORDER BY last_modified DESC;`;

    return new Promise((resolve) => {
      this.dbClient.all(query, (err, rows) => {
        resolve(rows);
      });
    });
  }

  getProfileData(userID) {
    return new Promise((resolve) => {
      this.dbClient.all(userProfileQuery(userID), (err, rows) => {
        resolve(rows);
      });
    });
  }
}

module.exports = { ExpressDB };
