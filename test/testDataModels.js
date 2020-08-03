const { assert, expect } = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');
const { Users, Stories } = require('../src/dataModels');

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
        displayName: null,
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

    it('should reject for invlaid userID', function () {
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
