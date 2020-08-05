const { assert, expect } = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');
const { Users, Stories, Claps } = require('../src/dataModels');

describe('Users', function () {
  const fakeDbClient = {};
  const users = new Users(fakeDbClient);

  context('.findAccount', function () {
    before(() => {
      const fakeFindUserAccount = sinon.stub();
      fakeFindUserAccount.withArgs('valid').resolves({ userID: 'valid' });
      fakeFindUserAccount.withArgs('invalid').resolves();
      fakeDbClient.findUserAccount = fakeFindUserAccount;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve with the user id if account exists', function (done) {
      users.findAccount('valid').then((userInfo) => {
        assert.deepStrictEqual(userInfo, { userID: 'valid' });
        done();
      });
    });

    it('should resolve undefined if account does not exist', function (done) {
      users.findAccount('invalid').then((userInfo) => {
        assert.isUndefined(userInfo);
        done();
      });
    });
  });

  context('.registerUser', function () {
    let fakeCreateUserAccount;

    before(() => {
      fakeCreateUserAccount = sinon.stub();
      fakeDbClient.createUserAccount = fakeCreateUserAccount;
      fakeCreateUserAccount.resolves('bernie');
    });

    after(() => {
      sinon.restore();
    });

    it('should register the user with unique userID', function () {
      return expect(
        users.registerUser({ userID: 'bernie' })
      ).to.eventually.equal('bernie');
    });

    it('should assign null for displayName and bio if not available', function (done) {
      const expectedUserInfo = {
        displayName: 'Expresser',
        bio: null,
      };

      users.registerUser({}).then(() => {
        sinon.assert.calledWith(fakeCreateUserAccount, expectedUserInfo);
        done();
      });
    });

    it('should not register the user if userID is not unique', function () {
      fakeCreateUserAccount.rejects();
      return expect(
        users.registerUser({ userID: 'wrong' })
      ).to.be.eventually.rejected;
    });
  });

  context('.list', function () {
    before(() => {
      fakeDbClient.getUsersList = sinon
        .stub()
        .resolves([{ id: 'bernie' }, { id: 'walker' }]);
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve with users list', function () {
      expect(users.list()).to.eventually.deep.equal(['bernie', 'walker']);
    });
  });

  context('.getUser', function () {
    before(() => {
      const fakeGetUserInfo = sinon.stub();
      fakeGetUserInfo.withArgs('valid').resolves({ id: 'valid' });
      fakeGetUserInfo.withArgs('invalid').resolves();
      fakeDbClient.getUserInfo = fakeGetUserInfo;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve with the user info  for valid  userID', function (done) {
      users.getUser('valid').then((userInfo) => {
        assert.deepStrictEqual(userInfo, { id: 'valid' });
        done();
      });
    });

    it('should resolve undefined for invalid  userID', function (done) {
      users.getUser('invalid').then((userInfo) => {
        assert.isUndefined(userInfo);
        done();
      });
    });
  });

  context('.getUserStoryList', function () {
    before(() => {
      const fakeGetUserStories = sinon.stub();
      fakeGetUserStories.withArgs('valid', 'drafted').resolves([{ id: 1 }]);
      fakeGetUserStories.withArgs('invalid', 'drafted').resolves([]);
      fakeDbClient.getUserStories = fakeGetUserStories;
    });
    after(() => {
      sinon.restore();
    });

    it('should resolve list of stories for valid  userID', function (done) {
      users.getUserStoryList('valid', 'drafted').then((storyList) => {
        assert.deepStrictEqual(storyList, [{ id: 1 }]);
        done();
      });
    });

    it('should resolve empty list for invalid userID', function (done) {
      users.getUserStoryList('invalid', 'drafted').then((storyList) => {
        assert.deepStrictEqual(storyList, []);
        done();
      });
    });
  });

  context('.getUserProfile', function () {
    before(() => {
      const resolutionWithoutStory = [
        {
          profileID: 'someName',
          profileName: 'name',
          profileAvatar: 'avatar',
          bio: 'some bio',
          storyID: null,
          title: null,
          content: null,
          coverImage: null,
          lastModified: null,
        },
      ];
      const resolutionWithStory = [
        {
          profileID: 'someName',
          profileName: 'name',
          profileAvatar: 'avatar',
          bio: 'some bio',
          storyID: '1',
          title: 'title',
          content: '[{"para":"text"}]',
          coverImage: 'image',
          lastModified: 'today',
        },
      ];
      const fakeGetProfileData = sinon.stub();
      fakeGetProfileData.withArgs('noStory').resolves(resolutionWithoutStory);
      fakeGetProfileData.withArgs('withStory').resolves(resolutionWithStory);
      fakeGetProfileData.withArgs('invalid').resolves([]);
      fakeDbClient.getProfileData = fakeGetProfileData;
    });
    after(() => {
      sinon.restore();
    });

    it('should resolve profile with empty stories list when user has no stories', function () {
      const profile = {
        profileID: 'someName',
        profileName: 'name',
        profileAvatar: 'avatar',
        bio: 'some bio',
        stories: [],
      };
      return expect(users.getUserProfile('noStory')).to.eventually.deep.equal(
        profile
      );
    });

    it('should resolve profile with list of stories when user has no stories', function () {
      const profile = {
        profileID: 'someName',
        profileName: 'name',
        profileAvatar: 'avatar',
        bio: 'some bio',
        stories: [
          {
            storyID: '1',
            title: 'title',
            content: [{ para: 'text' }],
            coverImage: 'image',
            lastModified: 'today',
          },
        ],
      };
      return expect(users.getUserProfile('withStory')).to.eventually.deep.equal(
        profile
      );
    });

    it('should reject for invalid userID', function () {
      return expect(users.getUserProfile('invalid')).to.be.eventually.rejected;
    });
  });
});

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
        .resolves({ content: '{"txt":"samp"}', tags: 'tag1,tag2' });
      fakeGetPublishedStory
        .withArgs(2)
        .resolves({ content: '{"txt":"samp"}', tags: null });
      fakeGetPublishedStory.withArgs(3).resolves(null);
      fakeDbClient.getPublishedStory = fakeGetPublishedStory;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve the story page if exists', function () {
      return expect(stories.getStoryPage(1)).to.eventually.deep.equal({
        content: { txt: 'samp' },
        tags: ['tag1', 'tag2'],
      });
    });

    it('tags array should be empty when there are no tags', function () {
      return expect(stories.getStoryPage(2)).to.eventually.deep.equal({
        content: { txt: 'samp' },
        tags: [],
      });
    });

    it('should resolve undefined if story does not exist', function () {
      return expect(stories.getStoryPage(3)).to.be.eventually.rejected;
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

  context('.createStory', function () {
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

  context('.updateStory', function () {
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
      return expect(
        stories.updateStory({ id: 1, author: 'user1' })
      ).to.be.eventually.fulfilled;
    });

    it('should reject if story does not exists', function () {
      return expect(
        stories.updateStory({ id: 2, author: 'user2' })
      ).to.be.eventually.rejected;
    });
  });

  context('.listCommentsOn', function () {
    before(() => {
      const fakeListComments = sinon.stub();
      fakeListComments.withArgs(1).resolves([{ comment: 'hello' }]);
      fakeListComments.withArgs(2).resolves([]);
      fakeDbClient.listCommentsOnStory = fakeListComments;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve with the comments when there are comments', function () {
      expect(stories.listCommentsOn(1)).to.eventually.deep.equal([
        { comment: 'hello' },
      ]);
    });

    it('should resolve with the empty array when there are comments', function () {
      expect(stories.listCommentsOn(2)).to.eventually.deep.equal([]);
    });
  });
});

describe('Claps', function () {
  const fakeDbClient = {};
  const claps = new Claps(fakeDbClient);
  context('clapCount', function () {
    before(() => {
      const fakeClapCount = sinon.stub();
      fakeClapCount.withArgs(6).resolves({ count: 2 });
      fakeClapCount.withArgs(2).resolves({ count: 0 });
      fakeDbClient.clapCount = fakeClapCount;
    });

    after(() => {
      sinon.restore();
    });

    it('should count the claps for a given story if clap present', function () {
      return expect(claps.clapCount(6)).to.be.eventually.deep.equal({
        count: 2,
      });
    });

    it('should count the claps for a given story if clap absent', function () {
      return expect(claps.clapCount(2)).to.be.eventually.deep.equal({
        count: 0,
      });
    });
  });

  context('isClapped', function () {
    before(() => {
      const fakeIsClapped = sinon.stub();
      fakeIsClapped.withArgs(6, 'palpriyanshu').resolves(true);
      fakeIsClapped.withArgs(2, 'palpriyanshu').resolves(false);
      fakeDbClient.isClapped = fakeIsClapped;
    });

    after(() => {
      sinon.restore();
    });

    it('should give true if given user has already clapped on given story', function () {
      return expect(claps.isClapped(6, 'palpriyanshu')).to.be.eventually.true;
    });

    it('should do count the claps for a given story if clap absent', function () {
      return expect(claps.isClapped(2, 'palpriyanshu')).to.be.eventually.false;
    });
  });

  context('addClap', function () {
    before(() => {
      const fakeAddClap = sinon.stub();
      fakeAddClap.withArgs(6, 'palpriyanshu').resolves();
      fakeDbClient.addClap = fakeAddClap;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve after adding clap on given story by given user', function () {
      return expect(
        claps.addClap(6, 'palpriyanshu')
      ).to.be.eventually.fulfilled;
    });
  });

  context('removeClap', function () {
    before(() => {
      const fakeRemoveClap = sinon.stub();
      fakeRemoveClap.withArgs(6, 'palpriyanshu').resolves();
      fakeDbClient.removeClap = fakeRemoveClap;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve after adding clap on given story by given user', function () {
      return expect(
        claps.removeClap(6, 'palpriyanshu')
      ).to.be.eventually.fulfilled;
    });
  });
});
