const sinon = require('sinon');
const { expect } = require('chai').use(require('chai-as-promised'));
const { Stories } = require('../src/stories');

describe('Stories', function () {
  const fakeDbClient = {};
  const stories = new Stories(fakeDbClient);

  context('.get', function () {
    before(() => {
      const fakeGetLatestNStories = sinon.stub();
      fakeGetLatestNStories.resolves([{ content: '{"txt":"samp"}' }]);
      fakeDbClient.getLatestNStories = fakeGetLatestNStories;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve the latest story list', function () {
      return expect(stories.get(1)).to.eventually.deep.equal([
        { content: { txt: 'samp' } },
      ]);
    });
  });

  context('.getStoryPage', function () {
    before(() => {
      const fakeGetPublishedStory = sinon.stub();
      fakeGetPublishedStory
        .withArgs(1)
        .resolves([{ content: '{"txt":"samp"}' }]);
      fakeGetPublishedStory.withArgs(2).resolves([]);
      fakeDbClient.getPublishedStory = fakeGetPublishedStory;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve the story page if exists', function () {
      return expect(stories.getStoryPage(1)).to.eventually.deep.equal({
        content: { txt: 'samp' },
        tags: [],
      });
    });

    it('should resolve undefined if story does not exist', function () {
      return expect(stories.getStoryPage(2)).to.be.eventually.undefined;
    });
  });

  context('.getStory', function () {
    before(() => {
      const fakeGetStoryOfUser = sinon.stub();
      fakeGetStoryOfUser
        .withArgs(1, 'user1')
        .resolves({ content: '{"txt":"samp"}' });
      fakeGetStoryOfUser.withArgs(2, 'user2').resolves();
      fakeDbClient.getStoryOfUser = fakeGetStoryOfUser;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve the story page if exists', function () {
      return expect(stories.getStory(1, 'user1')).to.eventually.deep.equal({
        content: { txt: 'samp' },
      });
    });

    it('should resolve undefined if story does not exist', function () {
      return expect(stories.getStory(2, 'user2')).to.be.eventually.undefined;
    });
  });

  describe('.createStory', function () {
    before(() => {
      const fakeCreateStoryByUser = sinon.stub();
      fakeCreateStoryByUser.withArgs('user1').resolves(1);
      fakeDbClient.createStoryByUser = fakeCreateStoryByUser;
    });

    after(() => {
      sinon.restore();
    });

    it('should create the story by the user', function () {
      return expect(stories.createStory('user1')).to.eventually.equal(1);
    });
  });

  describe('.updateStory', function () {
    before(() => {
      const fakeGetStoryOfUser = sinon.stub();
      fakeGetStoryOfUser
        .withArgs(1, 'user1')
        .resolves({ content: '{"txt":"samp"}' });
      fakeGetStoryOfUser.withArgs(2, 'user2').resolves();
      fakeDbClient.getStoryOfUser = fakeGetStoryOfUser;
      fakeDbClient.updateStory = sinon.stub().resolves();
    });

    after(() => {
      sinon.restore();
    });

    it('should update the story if story exists', function () {
      return expect(stories.updateStory({ id: 1, author: 'user1' })).to.be
        .eventually.fulfilled;
    });

    it('should reject if story does not exists', function () {
      return expect(stories.updateStory({ id: 2, author: 'user2' })).to.be
        .eventually.rejected;
    });
  });
});
