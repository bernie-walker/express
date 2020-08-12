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

  context('.render', function () {
    let fakeGetPublished, fakeGetClapInfo;

    beforeEach(() => {
      fakeGetPublished = sinon.stub();
      fakeDBClient.getPublishedStory = fakeGetPublished;
      fakeGetClapInfo = sinon.stub();
      fakeDBClient.getClapInfo = fakeGetClapInfo;
    });

    it('should render the story page with tags are present', function () {
      fakeGetPublished.resolves({ content: '{"txt":"samp"}', tags: 'a,b' });
      fakeGetClapInfo.resolves({ clapsCount: 1 });

      story.render('usr').then((storyPage) => {
        assert.deepStrictEqual(storyPage, {
          content: { txt: 'samp' },
          tags: ['a', 'b'],
          clapsCount: 1,
        });
        sinon.assert.calledWithExactly(fakeGetPublished, 1);
        sinon.assert.calledWithExactly(fakeGetClapInfo, 1, 'usr');
      });
    });

    it('should render the story with no tags', function () {
      fakeGetPublished.resolves({ content: '{"txt":"samp"}' });
      fakeGetClapInfo.resolves({ clapsCount: 1 });

      story.render('usr').then((storyPage) => {
        assert.deepStrictEqual(storyPage, {
          content: { txt: 'samp' },
          tags: [],
          clapsCount: 1,
        });
      });
    });
  });

  context('.get', function () {
    let fakeGetStory;

    beforeEach(() => {
      fakeGetStory = sinon.stub();
      fakeDBClient.getStory = fakeGetStory;
    });

    afterEach(sinon.restore);

    it('should resolve the story page with tags', function () {
      fakeGetStory
        .withArgs(1)
        .resolves({ content: '{"txt":"samp"}', tags: 'a,b' });
      return expect(story.get(1)).to.eventually.deep.equal({
        content: { txt: 'samp' },
        tags: ['a', 'b'],
      });
    });

    it('should resolve the story page without tags', function () {
      fakeGetStory.withArgs(1).resolves({ content: '{"txt":"samp"}' });
      return expect(story.get(1)).to.eventually.deep.equal({
        content: { txt: 'samp' },
        tags: [],
      });
    });
  });

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

  context('.toggleClap', function () {
    let fakeGetClapInfo, fakeRemoveClap, fakeAddClap;

    beforeEach(() => {
      fakeGetClapInfo = sinon.stub();
      fakeDBClient.getClapInfo = fakeGetClapInfo;
      fakeRemoveClap = sinon.stub();
      fakeDBClient.removeClap = fakeRemoveClap;
      fakeAddClap = sinon.stub();
      fakeDBClient.addClap = fakeAddClap;
    });

    it('should remove the clap if already clapped', function (done) {
      fakeGetClapInfo.resolves({ clapsCount: 1, isClapped: 1 });
      story.toggleClap('usr').then((clapInfo) => {
        assert.deepStrictEqual(clapInfo, { clapsCount: 0, isClapped: false });
        sinon.assert.calledWithExactly(fakeRemoveClap, 1, 'usr');
        done();
      });
    });

    it('should add the clap if already not clapped', function (done) {
      fakeGetClapInfo.resolves({ clapsCount: 1, isClapped: 0 });
      story.toggleClap('usr').then((clapInfo) => {
        assert.deepStrictEqual(clapInfo, { clapsCount: 2, isClapped: true });
        sinon.assert.calledWithExactly(fakeAddClap, 1, 'usr');
        done();
      });
    });
  });

  context('.listComments', function () {
    beforeEach(() => {
      const fakeListComments = sinon.stub();
      fakeListComments.resolves([{ comment: 'hello' }]);
      fakeDBClient.listCommentsOnStory = fakeListComments;
    });

    it('should resolve with the comments when there are comments', function () {
      expect(story.listComments()).to.eventually.deep.equal([
        { comment: 'hello' },
      ]);
    });
  });

  context('.comment', function () {
    let fakeAddComment;

    beforeEach(() => {
      fakeAddComment = sinon.stub();
      fakeAddComment.withArgs({ on: 1, by: 'me', text: 'text' }).resolves(1);
      fakeAddComment.rejects();
      fakeDBClient.addComment = fakeAddComment;
    });

    afterEach(sinon.restore);

    it('should return the promise from addComment', function () {
      return expect(
        story.comment({ userID: 'me', comment: 'text' })
      ).to.be.eventually.equal(1);
    });

    it('should reject when the commentInfo  is insufficient', function () {
      return expect(story.comment({ userID: 'me' })).to.be.eventually.rejected;
    });
  });
});
