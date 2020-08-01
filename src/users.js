const groupStories = function (profileRows) {
  return profileRows.reduce((stories, row) => {
    const { storyID, title, content, coverImage, lastModified } = row;

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
    const { display_name, bio } = userInfo;
    userInfo.display_name = display_name || null;
    userInfo.bio = bio || null;
    return this.db.createUserAccount(userInfo);
  }

  list() {
    this.db.getUsersList().then((usersList) => {
      const userNameList = usersList.map((user) => user.id);
      return Promise.resolve(userNameList);
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

module.exports = { Users };
