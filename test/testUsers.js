const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai').use(chaiAsPromised);
const sinon = require('sinon');
const { Users } = require('../src/users');

describe('Users', function () {
  const fakeDbClient = {};
  const users = new Users(fakeDbClient);

  context('.getUser', function () {
    before(() => {
      const fakeGetUserInfo = sinon.stub();
      fakeGetUserInfo.withArgs('valid').resolves({ userID: 'valid' });
      fakeGetUserInfo.withArgs('invalid').resolves();
      fakeDbClient.getUserInfo = fakeGetUserInfo;
    });

    after(() => {
      sinon.restore();
    });

    it('should resolve with the user info  for valid  userID', function (done) {
      users.getUser('valid').then((userInfo) => {
        assert.deepStrictEqual(userInfo, { userID: 'valid' });
        done();
      });
    });

    it('should resolve undefined forr invalid  userID', function (done) {
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
      fakeGetProfileData.withArgs('invalid').rejects();
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
