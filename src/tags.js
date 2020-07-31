class Tags {
  constructor(db) {
    this.db = db;
  }

  addTags(tags, storyID) {
    return this.db.addTags(tags, storyID);
  }
}

module.exports = { Tags };
