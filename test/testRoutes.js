const request = require('supertest');
const { app } = require('../src/routes');
const { setUpDatabase, cleanDatabase } = require('./fixture/databaseSetUp');

describe('GET', () => {
  context('/', () => {
    it('should serve the home page', async () => {
      await request(app)
        .get('/')
        .expect(200)
        .expect(/Express/);
    });
  });

  context('/newStory', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));
    it('should create a new story redirect to the editor', function (done) {
      request(app)
        .get('/newStory')
        .expect(302)
        .expect('Location', '/editor/2')
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/editor', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should render the editor when story exists for given user', function (done) {
      request(app)
        .get('/editor/1')
        .expect(200)
        .expect(/Editor/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with not found when story does not exist', function (done) {
      request(app)
        .get('/editor/2')
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

  context('/dashboard', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the dashboard', async () => {
      await request(app)
        .get('/dashboard')
        .expect(200)
        .expect(/Express/);
    });
  });

  context('/blogPage', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the blog page when exists', function (done) {
      request(app)
        .get('/blogPage/1')
        .expect(200)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond NOT FOUND if blog does not exists', function (done) {
      request(app)
        .get('/blogPage/2')
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

  context('/yourStories', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the yourStories page', async () => {
      await request(app)
        .get('/yourStories')
        .expect(200)
        .expect(/Express/);
    });
  });

  context('/profile', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the profile page when user exists', async () => {
      await request(app)
        .get('/profile/palpriyanshu')
        .expect(200)
        .expect(/Express/)
        .expect(/palpriyanshu/);
    });

    it('should not serve the profile page when user does not exists', async () => {
      await request(app)
        .get('/profile/wrongUserId')
        .expect(404)
        .expect(/user not found/);
    });
  });
});

describe('POST', function () {
  context('/publishStory', function () {
    before(() => setUpDatabase(app.locals.dbClientReference, ['stories']));
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should respond with a blogID for a valid story', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          articleTitle: 'validTitle',
          content: [],
          time: 1595688605709,
        })
        .expect(200)
        .expect(JSON.stringify({ blogID: 2 }))
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 422 for untitled story', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          content: [],
          time: 1595688605709,
        })
        .expect(422)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with a blogID for a valid story', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          articleTitle: '     ',
          content: [],
          time: 1595688605709,
        })
        .expect(422)
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
