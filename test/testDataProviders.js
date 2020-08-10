const sinon = require('sinon');
const { assert, expect } = require('chai').use(require('chai-as-promised'));
const { ExpressDS } = require('../src/dataProviders');

describe('ExpressDS', function () {
  const fakeDSProvider = {};
  const expressDS = new ExpressDS(fakeDSProvider);

  context('.incrID', function () {
    before(() => {
      fakeDSProvider.incr = sinon.stub().callsArgWithAsync(1, null, 2);
    });

    after(sinon.restore);

    it('should increment and resolve the ID', function () {
      return expect(expressDS.incrID('idName')).to.eventually.equal(2);
    });
  });

  context('.createSession', function () {
    before(() => {
      fakeDSProvider.incr = sinon.stub().callsArgWithAsync(1, null, 1);
      fakeDSProvider.set = sinon.stub().callsArgAsync(4);
    });

    after(sinon.restore);

    it('should create the session and resolve with session id', function (done) {
      expressDS.createSession('bernie').then((sesID) => {
        assert.strictEqual(sesID, 1);
        sinon.assert.calledWith(
          fakeDSProvider.set,
          'expSes_1',
          'bernie',
          'EX',
          2592000
        );
        done();
      });
    });
  });

  context('.getSession', function () {
    before(() => {
      fakeDSProvider.get = sinon.stub().callsArgWithAsync(1, null, 'usr');
    });

    after(sinon.restore);

    it('should get the session for the given id', function (done) {
      expressDS.getSession(1).then((userName) => {
        assert.strictEqual(userName, 'usr');
        sinon.assert.calledWith(fakeDSProvider.get, 'expSes_1');
        done();
      });
    });
  });

  context('.deleteSession', function () {
    before(() => {
      fakeDSProvider.del = sinon.stub().callsArgAsync(1);
    });

    after(sinon.restore);

    it('should delete the session', function (done) {
      expressDS.deleteSession(1).then(() => {
        sinon.assert.calledWith(fakeDSProvider.del, 'expSes_1');
        done();
      });
    });
  });

  context('.createTempToken', function () {
    before(() => {
      fakeDSProvider.incr = sinon.stub().callsArgWithAsync(1, null, 1);
      fakeDSProvider.hmset = sinon.stub().callsArgAsync(5);
      fakeDSProvider.expire = sinon.stub().callsArgAsync(2);
    });

    after(sinon.restore);

    it('should create the temp token and resolve with token', function (done) {
      expressDS
        .createTempToken({ avatarURL: 'http', githubID: 1234 })
        .then((token) => {
          assert.strictEqual(token, 1);
          sinon.assert.calledWith(
            fakeDSProvider.hmset,
            'newReg_1',
            'githubID',
            1234,
            'avatarURL',
            'http'
          );
          sinon.assert.calledWith(fakeDSProvider.expire, 'newReg_1', 86400);
          done();
        });
    });
  });

  context('.getTokenValue', function () {
    before(() => {
      fakeDSProvider.hgetall = sinon.stub().callsArgWithAsync(1, null, 'acc');
    });

    after(sinon.restore);

    it('should get the session for the given id', function (done) {
      expressDS.getTokenValue(1).then((accountInfo) => {
        assert.strictEqual(accountInfo, 'acc');
        sinon.assert.calledWith(fakeDSProvider.hgetall, 'newReg_1');
        done();
      });
    });
  });

  context('.deleteTempToken', function () {
    before(() => {
      fakeDSProvider.del = sinon.stub().callsArgAsync(1);
    });

    after(sinon.restore);

    it('should delete the the temp token', function (done) {
      expressDS.deleteTempToken(1).then(() => {
        sinon.assert.calledWith(fakeDSProvider.del, 'newReg_1');
        done();
      });
    });
  });
});
