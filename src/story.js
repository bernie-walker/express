const findCoverImage = function (storyContent) {
  const firstImageBlock = storyContent.find((block) => block.type === 'image');
  return firstImageBlock ? firstImageBlock.data.file.url : null;
};

const isStoryValid = function (story) {
  const MAX_TAGS = 5;
  const MAX_TAG_LENGTH = 25;
  const { title, tags } = story;

  return (
    title &&
    tags.length <= MAX_TAGS &&
    tags.every((tag) => tag.trim() && tag.length <= MAX_TAG_LENGTH)
  );
};

class Story {
  constructor(dbClient, id) {
    this.dbClient = dbClient;
    this.id = id;
  }

  async render(userID) {
    const storyPage = await this.dbClient.getPublishedStory(this.id);
    const clapsInfo = await this.dbClient.getClapInfo(this.id, userID);

    storyPage.content = JSON.parse(storyPage.content);
    storyPage.tags = storyPage.tags ? storyPage.tags.split(',') : [];

    return Promise.resolve(Object.assign(storyPage, clapsInfo));
  }

  async get() {
    const story = await this.dbClient.getStory(this.id);

    story.content = JSON.parse(story.content);
    story.tags = story.tags ? story.tags.split(',') : [];

    return story;
  }

  update(story) {
    return this.dbClient.updateStory(Object.assign(story, { id: this.id }));
  }

  save(story) {
    story.title = story.title.trim() || 'Untitled Story';
    return this.update(
      Object.assign(story, { state: 'drafted', coverImage: null })
    );
  }

  async tagAndUpdate(tags, story) {
    await this.update(story);

    await this.dbClient.deleteTags(this.id);
    for (const tag of tags) {
      await this.dbClient.addTag(this.id, tag);
    }

    return true;
  }

  publish(story) {
    story.title = story.title && story.title.trim();

    if (!isStoryValid(story)) {
      return Promise.reject();
    }

    const coverImage = findCoverImage(story.content);
    const { tags, ...storyContent } = story;

    return this.tagAndUpdate(
      tags,
      Object.assign(storyContent, { state: 'published', coverImage })
    );
  }

  async toggleClap(clapBy) {
    const claps = await this.dbClient.getClapInfo(this.id, clapBy);
    let clapsCount = claps.clapsCount;

    if (claps.isClapped) {
      await this.dbClient.removeClap(this.id, clapBy);
      --clapsCount;
    } else {
      await this.dbClient.addClap(this.id, clapBy);
      ++clapsCount;
    }

    return { clapsCount, isClapped: !claps.isClapped };
  }

  listComments() {
    return this.dbClient.listCommentsOnStory(this.id);
  }

  comment(commentBlock) {
    const { userID: by, comment: text } = commentBlock;
    return this.dbClient.addComment({ on: this.id, text, by });
  }
}

module.exports = { Story };
