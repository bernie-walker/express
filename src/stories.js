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
    return this.db.getPublishedStory(storyID).then((storyPage) => {
      if (storyPage && storyPage.content) {
        storyPage.content = JSON.parse(storyPage.content);
      }

      return Promise.resolve(storyPage);
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

  updateStory(editedStory) {
    const { id, author } = editedStory;

    return this.getStory(id, author).then((story) => {
      if (!story) {
        return Promise.reject();
      }

      return this.db.updateStory(editedStory).then(() => Promise.resolve());
    });
  }
}

module.exports = { Stories };
