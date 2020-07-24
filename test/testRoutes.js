const request = require('supertest');
const { app } = require('../src/routes');
const { setUpDatabase } = require('./fixture/databaseSetUp');

describe('GET', () => {
  context('/', () => {
    it('should serve the home page', async () => {
      await request(app)
        .get('/')
        .expect(200)
        .expect(/Express/);
    });
  });

  context('/dashboard', () => {
    before(() => setUpDatabase(app.locals.dbClientReference));

    it('should serve the dashboard', async () => {
      await request(app)
        .get('/dashboard')
        .expect(200)
        .expect(/Express/);
    });
  });

  context('/blog_image', function () {
    it('should respond with OK if image is found', function (done) {
      request(app)
        .get('/blog_image/image')
        .expect(200)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond NOT FOUND if image is not present', function (done) {
      request(app)
        .get('/blog_image/badImage')
        .expect(404)
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
