const request = require('supertest');
const { app } = require('../src/routes');

describe('GET', function () {
  context('/', function () {
    it('should serve the home page', function (done) {
      request(app)
        .get('/')
        .expect(200)
        .expect(/Express/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });
});
