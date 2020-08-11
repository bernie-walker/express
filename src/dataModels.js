const { Story } = require('./story');

const validateUserID = function (userID) {
  return userID && !userID.match(/\s/);
};

class Users {
  constructor(db) {
    this.db = db;
  }

  findAccount(gitID) {
    return this.db
      .findUserAccount(gitID)
      .then((userAccount) => Promise.resolve(userAccount));
  }

  registerUser(userInfo) {
    const { displayName, bio, userID } = userInfo;

    userInfo.displayName = displayName || 'Expresser';
    userInfo.bio = bio || null;

    return validateUserID(userID)
      ? this.db.createUserAccount(userInfo)
      : Promise.reject();
  }

  has(userID) {
    return this.db.getUsersList().then((usersList) => {
      const hasUser = usersList.find((user) => user.id === userID);
      return hasUser ? Promise.resolve(true) : Promise.resolve(false);
    });
  }

  getUser(userID) {
    return this.db.getUserInfo(userID).then((user) => Promise.resolve(user));
  }

  getUserStoryList(userID, state) {
    return this.db
      .getUserStories(userID, state)
      .then((storyList) => Promise.resolve(storyList));
  }

  async getUserProfile(userID) {
    const profileInfo = await this.db.getProfileData(userID);

    if (!profileInfo) {
      throw new Error();
    }

    const userStories = await this.getUserStoryList(userID, 'published');

    profileInfo.stories = userStories.map((story) => {
      story.content = JSON.parse(story.content);
      return story;
    });

    return profileInfo;
  }
}

class Stories {
  constructor(db) {
    this.db = db;
  }

  get(count) {
    return this.db.getLatestNStories(count).then((stories) => {
      stories.forEach((story) => {
        story.content = JSON.parse(story.content);
      });

      return Promise.resolve(stories);
    });
  }

  getStory(storyID, userID) {
    return this.db.getStoryOfUser(storyID, userID).then((story) => {
      if (story) {
        story.content = JSON.parse(story.content);
      }

      return Promise.resolve(story);
    });
  }

  createStory(userID) {
    return this.db
      .createStoryByUser(userID, '[]')
      .then((storyID) => Promise.resolve(storyID));
  }

  async getPrivateStory(storyID, author, state) {
    const story = await this.db.findStory(storyID, author, state || '%');

    if (!story) {
      return null;
    }

    return new Story(this.db, storyID);
  }

  getPublicStory(storyID) {
    return this.getPrivateStory(storyID, '%', 'published');
  }

  listCommentsOn(storyID) {
    return this.db.listCommentsOnStory(storyID);
  }

  comment(commentInfo) {
    const { storyID: on, userID: by, comment: text } = commentInfo;
    return this.db.addComment({ on, text, by });
  }
}

class Tags {
  constructor(db) {
    this.db = db;
  }

  async getAllTags(storyID) {
    const tags = await this.db.getTags(storyID);
    return tags.map((tag) => tag.tag);
  }
}

module.exports = { Users, Stories, Tags, Story };
