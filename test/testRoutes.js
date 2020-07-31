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
        .expect('Location', '/editor/3')
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
        .get('/editor/3')
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

  context('/userStories', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the userStories page', async () => {
      await request(app)
        .get('/userStories')
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
        .expect(/palpriyanshu/)
        .expect(/Priyanshu/);
    });

    it('should not serve the profile page when user does not exists', async () => {
      await request(app).get('/profile/wrongUserId').expect(404);
    });
  });
});

describe('POST', function () {
  context('/publishStory', function () {
    beforeEach(() =>
      setUpDatabase(app.locals.dbClientReference, ['stories', 'users'])
    );
    afterEach(() => cleanDatabase(app.locals.dbClientReference));

    it('should publish the story and redirect to the blogPage for a valid story', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '2',
          tags: ['tag1', 'tag2'],
        })
        .expect(302)
        .expect('Location', '/blogPage/2')
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
          blocks: [],
          storyID: '2',
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

    it('should respond with 422 for a story with white spaced title', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          storyTitle: '     ',
          blocks: [],
          storyID: '2',
          tags: ['tag1', 'tag2'],
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

    it('should respond with 422 for the userid and story mismatch', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          storyTitle: 'valid',
          blocks: [],
          storyID: '3',
          tags: ['tag1', 'tag2'],
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

  context('/saveStory', function () {
    before(() => setUpDatabase(app.locals.dbClientReference, ['stories']));
    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should respond with a OK for a valid story', function (done) {
      request(app)
        .post('/saveStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '1',
        })
        .expect(200)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 422 for wrong story ID', function (done) {
      request(app)
        .post('/saveStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '3',
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
