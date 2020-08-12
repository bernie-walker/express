const { assert, expect } = require('chai').use(require('chai-as-promised'));
const sinon = require('sinon');
const { Users, Stories, Story } = require('../src/dataModels');

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

    after(sinon.restore);

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
      fakeCreateUserAccount.resolves();
    });

    after(sinon.restore);

    it('should register the user with unique userID', function () {
      return expect(
        users.registerUser({ userID: 'bernie' })
      ).to.eventually.fulfilled;
    });

    it('should assign default for displayName and bio if not available', function (done) {
      const expectedUserInfo = {
        displayName: 'Expresser',
        bio: null,
        userID: 'bernie',
      };

      users.registerUser({ userID: 'bernie' }).then(() => {
        sinon.assert.calledWith(fakeCreateUserAccount, expectedUserInfo);
        done();
      });
    });

    it('should not register the user if userID has spaces', function () {
      return expect(
        users.registerUser({ userID: 'wr o ng' })
      ).to.be.eventually.rejected;
    });

    it('should not register the user if userID is not unique', function () {
      fakeCreateUserAccount.rejects();
      return expect(
        users.registerUser({ userID: 'wrong' })
      ).to.be.eventually.rejected;
    });
  });

  context('.has', function () {
    before(() => {
      fakeDbClient.getUsersList = sinon
        .stub()
        .resolves([{ id: 'bernie' }, { id: 'walker' }]);
    });

    after(sinon.restore);

    it('should resolve with true if user name exists', function () {
      return expect(users.has('bernie')).to.eventually.true;
    });

    it('should resolve with false if user name does not exist', function () {
      return expect(users.has('priyanshu')).to.eventually.false;
    });
  });

  context('.getUser', function () {
    before(() => {
      const fakeGetUserInfo = sinon.stub();
      fakeGetUserInfo.withArgs('valid').resolves({ id: 'valid' });
      fakeGetUserInfo.withArgs('invalid').resolves();
      fakeDbClient.getUserInfo = fakeGetUserInfo;
    });

    after(sinon.restore);

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

    after(sinon.restore);

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
    let profile, fakeGetProfileData, fakeGetUserStories;

    beforeEach(() => {
      profile = {
        profileID: 'user1',
        profileName: 'name',
        profileAvatar: 'avatar',
        bio: 'some bio',
      };

      fakeGetProfileData = sinon.stub();
      fakeGetProfileData.withArgs('user1').resolves(Object.assign({}, profile));
      fakeGetProfileData.resolves();
      fakeDbClient.getProfileData = fakeGetProfileData;

      fakeGetUserStories = sinon.stub();
      fakeDbClient.getUserStories = fakeGetUserStories;
    });

    afterEach(sinon.restore);

    it('should resolve profile with empty stories list when user has no stories', function () {
      fakeGetUserStories.resolves([]);
      return expect(users.getUserProfile('user1')).to.eventually.deep.equal(
        Object.assign({ stories: [] }, profile)
      );
    });

    it('should resolve profile with list of stories when user has stories', function () {
      fakeGetUserStories.resolves([{ content: '[{"text":"bernie"}]' }]);
      return expect(users.getUserProfile('user1')).to.eventually.deep.equal(
        Object.assign(
          {
            stories: [{ content: [{ text: 'bernie' }] }],
          },
          profile
        )
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

    after(sinon.restore);

    it('should resolve the latest story list', function () {
      return expect(stories.get(1)).to.eventually.deep.equal([
        { content: { txt: 'samp' } },
      ]);
    });
  });

  context('.createStory', function () {
    let fakeCreateStoryByUser;

    before(() => {
      fakeCreateStoryByUser = sinon.stub();
      fakeCreateStoryByUser.withArgs('user1').resolves(1);
      fakeDbClient.createStoryByUser = fakeCreateStoryByUser;
    });

    after(sinon.restore);

    it('should create the story by the user', function (done) {
      expect(stories.createStory('user1'))
        .to.eventually.equal(1)
        .notify(() => {
          sinon.assert.calledWithExactly(fakeCreateStoryByUser, 'user1', '[]');
          done();
        });
    });
  });

  context('.getPrivateStory', function () {
    let fakeFindStory;

    before(() => {
      fakeFindStory = sinon.stub();
      fakeDbClient.findStory = fakeFindStory;
    });

    after(sinon.restore);

    it('should resolve with a Story if it exists', function (done) {
      fakeFindStory.resolves(1);
      stories.getPrivateStory(1, 'author').then((story) => {
        assert.isTrue(story instanceof Story);
        sinon.assert.calledWithExactly(fakeFindStory, 1, 'author', '%');
        done();
      });
    });

    it('should resolve null when the story does not exist', function () {
      fakeFindStory.resolves(null);
      return expect(stories.getPrivateStory(2, 'author')).to.be.eventually.null;
    });
  });

  context('.getPrivateStory', function () {
    let fakeFindStory;

    before(() => {
      fakeFindStory = sinon.stub();
      fakeDbClient.findStory = fakeFindStory;
    });

    after(sinon.restore);

    it('should resolve with a Story if it exists', function (done) {
      fakeFindStory.resolves(1);
      stories.getPublicStory(1).then((story) => {
        assert.isTrue(story instanceof Story);
        sinon.assert.calledWithExactly(fakeFindStory, 1, '%', 'published');
        done();
      });
    });

    it('should resolve null when the story does not exist', function () {
      fakeFindStory.resolves(null);
      return expect(stories.getPublicStory(2)).to.be.eventually.null;
    });
  });
});
