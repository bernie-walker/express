const {
  latestNStoriesQuery,
  publishedStoryQuery,
  storyOfUserQuery,
  updateStoryQuery,
  findAccountQuery,
  userInfoQuery,
  userStoriesQuery,
  userProfileQuery,
  addTagsQuery,
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

    return new Promise((resolve) => {
      this.dbClient.run(
        updateStoryQuery(),
        [title, JSON.stringify(content), state, id, author],
        resolve
      );
    });
  }

  findUserAccount(gitID) {
    return new Promise((resolve) => {
      this.dbClient.get(findAccountQuery(gitID), (err, row) => {
        resolve(row);
      });
    });
  }

  getUserInfo(userID) {
    return new Promise((resolve) => {
      this.dbClient.get(userInfoQuery(userID), (err, row) => {
        resolve(row);
      });
    });
  }

  getUserStories(userID, state) {
    return new Promise((resolve) => {
      this.dbClient.all(userStoriesQuery(userID, state), (err, rows) => {
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

  addTags(tags, storyID) {
    return new Promise((resolve) => {
      this.dbClient.run(addTagsQuery(tags, storyID), resolve);
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
        this.dsClient.set(`expSes_${sesID}`, userName, 'EX', 2592000, () => {
          resolve(sesID);
        })
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
