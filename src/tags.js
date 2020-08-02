class Tags {
  constructor(db) {
    this.db = db;
  }

  addTags(tags, storyID) {
    return this.db.addTags(tags, storyID);
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

module.exports = { Tags, Claps };
