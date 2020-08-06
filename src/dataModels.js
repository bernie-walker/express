const groupStories = function (profileRows) {
  return profileRows.reduce((stories, row) => {
    const { storyID, title, content, coverImage, lastModified, state } = row;

    if (state === 'drafted') {
      return stories;
    }

    const story = {
      storyID,
      title,
      content: JSON.parse(content),
      coverImage,
      lastModified,
    };

    stories.push(story);
    return stories;
  }, []);
};

const extractNecessary = function (profile) {
  const { profileID, profileName, profileAvatar, bio, stories } = profile;
  return { profileID, profileName, profileAvatar, bio, stories };
};

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

  getUserProfile(userID) {
    return this.db.getProfileData(userID).then((profileRows) => {
      if (!profileRows.length) {
        return Promise.reject();
      }

      const [profileFirstRow] = profileRows;
      profileFirstRow.stories = [];

      if (profileFirstRow.storyID) {
        profileFirstRow.stories = groupStories(profileRows);
      }

      return Promise.resolve(extractNecessary(profileFirstRow));
    });
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

  getStoryPage(storyID) {
    return this.db.getPublishedStory(storyID).then((story) => {
      if (!story) {
        return Promise.reject();
      }

      story.content = JSON.parse(story.content);
      story.tags = story.tags ? story.tags.split(',') : [];

      return Promise.resolve(story);
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
      .createStoryByUser(userID)
      .then((storyID) => Promise.resolve(storyID));
  }

  async setCoverImage({ content = [], id, author }) {
    const imageBlock = content.find((block) => block.type === 'image');
    if (imageBlock) {
      const coverImage = imageBlock.data.file.url;
      await this.db.setCoverImage(id, author, coverImage);
    }
  }

  updateStory(editedStory) {
    const { id, author } = editedStory;

    return this.getStory(id, author).then((story) => {
      if (!story) {
        return Promise.reject();
      }

      this.setCoverImage(editedStory);

      return this.db.updateStory(editedStory).then(() => Promise.resolve());
    });
  }

  listCommentsOn(storyID) {
    return this.db.listCommentsOnStory(storyID);
  }

  comment(commentInfo) {
    const { storyID: on, userID: by, comment: text } = commentInfo;

    if (!(on && by && text)) {
      return Promise.reject();
    }

    return this.db.addComment({ on, text, by });
  }
}

class Tags {
  constructor(db) {
    this.db = db;
  }

  async updateTags(storyID, tags) {
    await this.db.deleteTags(storyID);
    for (const tag of tags) {
      await this.db.addTag(storyID, tag);
    }
  }

  async getAllTags(storyID) {
    const tags = await this.db.getTags(storyID);
    return tags.map((tag) => tag.tag);
  }
}

class Claps {
  constructor(db) {
    this.db = db;
  }

  isClapped(clappedOn, clappedBy) {
    return this.db.isClapped(clappedOn, clappedBy);
  }

  addClap(clappedOn, clappedBy) {
    return this.db.addClap(clappedOn, clappedBy);
  }

  removeClap(clappedOn, clappedBy) {
    return this.db.removeClap(clappedOn, clappedBy);
  }

  async toggleClap(clappedOn, clappedBy) {
    const reply = await this.isClapped(clappedOn, clappedBy);
    if (reply) {
      return this.removeClap(clappedOn, clappedBy);
    }
    return this.addClap(clappedOn, clappedBy);
  }

  clapCount(clappedOn) {
    return this.db.clapCount(clappedOn);
  }
}

module.exports = { Users, Stories, Tags, Claps };
