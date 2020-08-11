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

  // render() {}

  // getContent() {}

  update(story) {
    return this.dbClient.updateStory(this.id, story);
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

  // toggleClap(clapBy) {}

  // addComment(commenter) {}
}

module.exports = { Story };
