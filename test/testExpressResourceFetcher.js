const sinon = require('sinon');
const chaiAsPromised = require('chai-as-promised');
const { assert, expect } = require('chai').use(chaiAsPromised);
const { Fetch } = require('../src/expressResourceFetcher');

describe('Fetch', function () {
  const fakeHttpClient = sinon.stub();
  const fetch = new Fetch(fakeHttpClient, 'myID', 'mySecret');

  context('.getAccessToken', function () {
    afterEach(sinon.restore.bind(sinon));

    it('should respond  with the access token  for valid code', function (done) {
      fakeHttpClient.resolves({ data: { access_token: 'token' } });
      const expectedConfig = {
        method: 'post',
        url:
          'https://github.com/login/oauth/access_token?client_id=myID&client_secret=mySecret&code=validCode',
        headers: {
          accept: 'application/json',
        },
      };

      fetch.getAccessToken('validCode').then((token) => {
        assert.strictEqual(token, 'token');
        sinon.assert.calledWith(fakeHttpClient, expectedConfig);
        done();
      });
    });

    it('should reject when the code is invalid', function () {
      fakeHttpClient.resolves({ data: {} });
      return expect(fetch.getAccessToken('someCode')).to.be.eventually.rejected;
    });
  });

  context('.getUserInfo', function () {
    afterEach(sinon.restore.bind(sinon));

    it('should respond with user info for a valid access token', function (done) {
      fakeHttpClient.resolves({
        data: { login: 'ab', id: 123, name: 'bc', avatar_url: 'ef' },
      });
      const expectedConfig = {
        url: 'https://api.github.com/user',
        headers: {
          Authorization: 'token accToken',
          accept: 'application/json',
        },
      };

      fetch.getUserInfo('accToken').then((response) => {
        const expected = {
          userID: 'ab',
          githubID: 123,
          userName: 'bc',
          avatarURL: 'ef',
        };
        assert.deepStrictEqual(response, expected);
        sinon.assert.calledWith(fakeHttpClient, expectedConfig);
        done();
      });
    });

    it('should reject when the access token is invalid', function () {
      fakeHttpClient.resolves({ data: {} });
      return expect(fetch.getUserInfo('wrong')).to.be.eventually.rejected;
    });
  });
});
