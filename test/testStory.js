const { assert, expect } = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');
const { Story } = require('../src/story');

describe('Story', function () {
  let fakeDBClient, story;

  beforeEach(() => {
    fakeDBClient = {};
    story = new Story(fakeDBClient, 1);
  });

  afterEach(sinon.restore);

  context('.save', function () {
    let fakeUpdate;

    beforeEach(() => {
      fakeUpdate = sinon.stub().resolves();
      fakeDBClient.updateStory = fakeUpdate;
    });

    it('should save the given story', function (done) {
      story.save({ title: 'story' }).then(() => {
        sinon.assert.calledWithExactly(fakeUpdate, {
          id: 1,
          title: 'story',
          state: 'drafted',
          coverImage: null,
        });
        done();
      });
    });

    it('should save the story with default title when title is empty', function (done) {
      story.save({ title: '  ' }).then(() => {
        sinon.assert.calledWithExactly(fakeUpdate, {
          id: 1,
          title: 'Untitled Story',
          state: 'drafted',
          coverImage: null,
        });
        done();
      });
    });
  });

  context('.publish', function () {
    let fakeUpdate, fakeDeleteTags, fakeAddTag;

    beforeEach(() => {
      fakeUpdate = sinon.stub().resolves();
      fakeDBClient.updateStory = fakeUpdate;
      fakeDeleteTags = sinon.stub().resolves();
      fakeDBClient.deleteTags = fakeDeleteTags;
      fakeAddTag = sinon.stub().resolves();
      fakeDBClient.addTag = fakeAddTag;
    });

    it('should publish the valid story', function (done) {
      const assertPublishedStory = function (affirmation) {
        const expected = {
          id: 1,
          title: 'title1',
          content: [],
          state: 'published',
          coverImage: null,
        };
        assert.isTrue(affirmation);
        sinon.assert.calledWithExactly(fakeUpdate, expected);
        sinon.assert.calledWithExactly(fakeDeleteTags, 1);
        sinon.assert.calledWithExactly(fakeAddTag, 1, 'tag1');
      };

      story
        .publish({ title: 'title1', content: [], tags: ['tag1'] })
        .then((affirmation) => {
          assertPublishedStory(affirmation);
          done();
        });
    });

    it('should chose the first image of content as cover image', function (done) {
      const storyToPublish = {
        title: 'a',
        content: [
          { type: 'image', data: { file: { url: 'image1' } } },
          { type: 'image', data: { file: { url: 'image2' } } },
        ],
        tags: [],
      };

      story.publish(storyToPublish).then((affirmation) => {
        assert.isTrue(affirmation);
        assert.strictEqual(fakeUpdate.args[0][0].coverImage, 'image1');
        done();
      });
    });

    it('should reject when the title is absent', function () {
      return expect(story.publish({ title: '  ' })).to.be.eventually.rejected;
    });

    it('should reject when no. of tags exceeds 5', function () {
      return expect(
        story.publish({ title: 'this', tags: ['a', 'b', 'c', 'd', 'e', 'f'] })
      ).to.be.eventually.rejected;
    });

    it('should reject when a tag length exceeds 25 chars', function () {
      return expect(
        story.publish({
          title: 'this',
          tags: ['this is a tag with more than 25 chars'],
        })
      ).to.be.eventually.rejected;
    });
  });
});
