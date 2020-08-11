const {
  latestNStories,
  publishedStory,
  storyOfUser,
  findAccount,
  userInfo,
  userStories,
  userProfile,
  addTag,
  deleteTag,
  getAllTags,
  clapInfo,
  addClap,
  removeClap,
  isClapped,
  clapCount,
  updateStory,
  findStory,
  listComments,
  newComment,
} = require('./queries.json');

const setExpirationAndResolve = function (dsClient, token, resolve) {
  dsClient.expire(`newReg_${token}`, 86400, () => {
    resolve(token);
  });
};

const createHashAndResolve = function (dsClient, accountInfo, token, resolve) {
  const { avatarURL, githubID } = accountInfo;
  dsClient.hmset(
    `newReg_${token}`,
    'githubID',
    githubID,
    'avatarURL',
    avatarURL,
    () => {
      setExpirationAndResolve(dsClient, token, resolve);
    }
  );
};

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
    return new Promise((resolve) => {
      this.incrID('tempToken').then((token) => {
        createHashAndResolve(this.dsClient, accountInfo, token, resolve);
      });
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

class ExpressDB {
  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  findStory(storyID, authorID) {
    return new Promise((resolve) => {
      this.dbClient.get(findStory, [storyID, authorID], (err, row) => {
        resolve(row);
      });
    });
  }

  getLatestNStories(count = -1, offset = 0) {
    return new Promise((resolve) => {
      this.dbClient.all(latestNStories, [count, offset], (err, rows) => {
        resolve(rows);
      });
    });
  }

  getPublishedStory(storyID) {
    return new Promise((resolve) => {
      this.dbClient.get(publishedStory, [storyID], (err, row) => {
        resolve(row);
      });
    });
  }

  getStoryOfUser(storyID, userID) {
    return new Promise((resolve) => {
      this.dbClient.get(storyOfUser, [storyID, userID], (err, row) => {
        resolve(row);
      });
    });
  }

  createStoryByUser(userID, initialContent) {
    const query = `
    INSERT INTO stories(written_by, content) 
    VALUES(?, ?)`;

    return new Promise((resolve) => {
      this.dbClient.run(query, [userID, initialContent], function () {
        resolve(this.lastID);
      });
    });
  }

  updateStory(modifiedStory) {
    const { title, content, state, id, author, coverImage } = modifiedStory;

    return new Promise((resolve) => {
      this.dbClient.run(
        updateStory,
        [title, JSON.stringify(content), state, coverImage, id, author],
        resolve
      );
    });
  }

  findUserAccount(gitID) {
    return new Promise((resolve) => {
      this.dbClient.get(findAccount, [gitID], (err, row) => {
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
            resolve();
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
      this.dbClient.get(userInfo, [userID], (err, row) => {
        resolve(row);
      });
    });
  }

  getUserStories(userID, state) {
    return new Promise((resolve) => {
      this.dbClient.all(userStories, [userID, state], (err, rows) => {
        resolve(rows);
      });
    });
  }

  getProfileData(userID) {
    return new Promise((resolve) => {
      this.dbClient.get(userProfile, [userID], (err, row) => {
        resolve(row);
      });
    });
  }

  addTag(tagOn, tag) {
    return new Promise((resolve) => {
      this.dbClient.run(addTag, [tagOn, tag], () => {
        resolve();
      });
    });
  }

  deleteTags(tagOn) {
    return new Promise((resolve) => {
      this.dbClient.run(deleteTag, [tagOn], resolve);
    });
  }

  getTags(storyID) {
    return new Promise((resolve) => {
      this.dbClient.all(getAllTags, [storyID], (err, rows) => {
        resolve(rows);
      });
    });
  }

  getClapInfo(clappedOn, clappedBy) {
    return new Promise((resolve) => {
      this.dbClient.get(clapInfo, [clappedBy, clappedOn], (err, row) => {
        resolve(row);
      });
    });
  }

  addClap(clappedOn, clappedBy) {
    return new Promise((resolve) => {
      this.dbClient.run(addClap, [clappedOn, clappedBy], resolve);
    });
  }

  removeClap(clappedOn, clappedBy) {
    return new Promise((resolve) => {
      this.dbClient.run(removeClap, [clappedOn, clappedBy], resolve);
    });
  }

  isClapped(clappedOn, clappedBy) {
    return new Promise((resolve) => {
      this.dbClient.get(isClapped, [clappedOn, clappedBy], (err, row) => {
        if (row) {
          return resolve(true);
        }
        resolve(false);
      });
    });
  }

  clapCount(clappedOn) {
    return new Promise((resolve) => {
      this.dbClient.get(clapCount, [clappedOn], (err, row) => {
        resolve(row);
      });
    });
  }

  listCommentsOnStory(storyID) {
    return new Promise((resolve) => {
      this.dbClient.all(listComments, [storyID], (err, rows) => {
        resolve(rows);
      });
    });
  }

  addComment(comment) {
    const { on, by, text } = comment;
    return new Promise((resolve, reject) => {
      this.dbClient.run(newComment, [on, by, text], (err) => {
        if (err) {
          reject();
        } else {
          resolve(on);
        }
      });
    });
  }
}

module.exports = { ExpressDB, ExpressDS };
