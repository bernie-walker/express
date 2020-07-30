const {
  latestNStoriesQuery,
  publishedStoryQuery,
  storyOfUserQuery,
  userProfileQuery,
} = require('./expressDBQueries');

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
    SELECT id, display_name, avatar_url, github_id as githubID 
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

class ExpressDS {
  constructor(dsClient) {
    this.dsClient = dsClient;
  }

  incrID(idName) {
    return new Promise((resolve) => {
      this.dsClient.incr(idName, (err, incrementedID) => {
        resolve(incrementedID);
      });
    });
  }

  createSession(userName) {
    return new Promise((resolve) => {
      this.incrID('expSesID').then((sesID) =>
        this.dsClient.set(`expSes_${sesID}`, userName, 'EX', 2592000, resolve)
      );
    });
  }

  getSession(sesID) {
    return new Promise((resolve) => {
      this.dsClient.get(`expSes_${sesID}`, (err, userName) => {
        resolve(userName);
      });
    });
  }

  closeClient() {
    this.dsClient.quit();
  }
}

module.exports = { ExpressDB, ExpressDS };
