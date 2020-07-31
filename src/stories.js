const parseTags = function (rows) {
  return rows.reduce((tags, row) => {
    row.tag && tags.push(row.tag);
    return tags;
  }, []);
};

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
    return this.db.getPublishedStory(storyID).then((storyRows) => {
      if (!storyRows.length) {
        return Promise.resolve();
      }

      const [story] = storyRows;
      if (story && story.content) {
        story.content = JSON.parse(story.content);
      }

      story.tags = parseTags(storyRows);
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
