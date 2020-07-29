/* eslint-disable handle-callback-err */

const groupStories = function (profileRows) {
  return profileRows.reduce((stories, row) => {
    const { storyID, title, content, coverImage, lastModified } = row;
    if (!storyID) {
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

class Users {
  constructor(db) {
    this.db = db;
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
