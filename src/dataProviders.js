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
} = require('./dbQueries');

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
      this.dbClient.all(publishedStoryQuery(storyID), (err, row) => {
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
        updateStoryQuery(state),
        [title, JSON.stringify(content), id, author],
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

  createUserAccount(accountInfo) {
    const { userID, githubID, avatarURL, displayName, bio } = accountInfo;
    const query = `
    INSERT INTO users(id, github_id, avatar_url, display_name,  bio) 
    VALUES (?,?,?,?,?);
    `;

    return new Promise((resolve, reject) => {
      this.dbClient.run(
        query,
        [userID, githubID, avatarURL, displayName, bio],
        (err) => {
          if (err) {
            reject();
          } else {
            resolve(userID);
          }
        }
      );
    });
  }

  getUsersList() {
    const query = 'SELECT id FROM users;';
    return new Promise((resolve) => {
      this.dbClient.all(query, (err, rows) => {
        resolve(rows);
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

  deleteSession(sesID) {
    return new Promise((resolve) => {
      this.dsClient.del(`expSes_${sesID}`, resolve);
    });
  }

  createTempToken(accountInfo) {
    const { avatarURL, githubID } = accountInfo;
    return new Promise((resolve) => {
      this.incrID('tempToken').then((token) =>
        this.dsClient.hmset(
          `newReg_${token}`,
          'githubID',
          githubID,
          'avatarURL',
          avatarURL,
          async () => {
            await this.dsClient.expire(`newReg_${token}`, 86400);
            resolve(token);
          }
        )
      );
    });
  }

  getTokenValue(token) {
    return new Promise((resolve) => {
      this.dsClient.hgetall(`newReg_${token}`, (err, userInfo) => {
        resolve(userInfo);
      });
    });
  }

  deleteTempToken(token) {
    return new Promise((resolve) => {
      this.dsClient.del(`newReg_${token}`, resolve);
    });
  }

  closeClient() {
    this.dsClient.quit();
  }
}

module.exports = { ExpressDB, ExpressDS };
