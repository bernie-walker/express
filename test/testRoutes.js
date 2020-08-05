const request = require('supertest');
const sinon = require('sinon');
const { setUpDatabase, cleanDatabase } = require('./fixture/databaseSetUp');
const { app } = require('../src/routes');
const { Fetch } = require('../src/resourceFetcher');
const { ExpressDS } = require('../src/dataProviders');
const { ImageHandlers } = require('../src/imageHandlers');
app.locals.expressDS.closeClient();

describe('GET', () => {
  let fakeGetSession;

  beforeEach(() => {
    fakeGetSession = sinon.stub(ExpressDS.prototype, 'getSession');
    fakeGetSession.resolves('palpriyanshu');
  });

  afterEach(() => {
    sinon.restore();
  });

  context('/', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories', 'tags'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the home page if user is not signed in', (done) => {
      fakeGetSession.resolves(null);
      request(app)
        .get('/')
        .expect(200)
        .expect(/Express/)
        .expect(/sign in/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should serve the dashboard if user is signed in', function (done) {
      request(app)
        .get('/')
        .expect(200)
        .expect(/Express/)
        .expect(/palpriyanshu/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/newStory', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories', 'tags'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should create a new story redirect to the editor for authorized user', function (done) {
      request(app)
        .get('/newStory')
        .expect(302)
        .expect('Location', '/editor/4')
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 401 for unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .get('/newStory')
        .expect(401)
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
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories', 'tags'])
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

    it('should respond with 401 for unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .get('/editor/1')
        .expect(401)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/blogPage', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, [
        'users',
        'stories',
        'tags',
        'comments',
      ])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the blog page when exists, for an authorized user', function (done) {
      request(app)
        .get('/blogPage/1')
        .expect(200)
        .expect(/palpriyanshu/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should serve the blog page when exists, for an unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .get('/blogPage/1')
        .expect(200)
        .expect(/Sign in/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond NOT FOUND if blog does not exist', function (done) {
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

  context('/commentList', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'comments'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should respond with comment list', function (done) {
      request(app)
        .get('/commentList/1')
        .expect(200)
        .expect(/comment/)
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

    it('should serve the userStories page for authorized user', function (done) {
      request(app)
        .get('/userStories')
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

    it('should respond with 401 for an unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .get('/userStories')
        .expect(401)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/profile', () => {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should serve the profile page when user exists, for an authorized user', function (done) {
      request(app)
        .get('/profile/palpriyanshu')
        .expect(200)
        .expect(/Express/)
        .expect(/palpriyanshu/)
        .expect(/Priyanshu/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should serve the profile page when user exists and has only drafted stories', function (done) {
      request(app)
        .get('/profile/shiviraj')
        .expect(200)
        .expect(/Express/)
        .expect(/palpriyanshu/)
        .expect(/Shivam Rajputh/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should serve the profile page when user exists, for an unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .get('/profile/palpriyanshu')
        .expect(200)
        .expect(/Express/)
        .expect(/Priyanshu/)
        .expect(/Sign in/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should not serve the profile page when user does not exists', function (done) {
      request(app)
        .get('/profile/wrongUserId')
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

  context('/authorize', function () {
    it('should redirect to github authorization page', function (done) {
      request(app)
        .get('/authenticate')
        .expect(302)
        .expect(
          'Location',
          'https://github.com/login/oauth/authorize?client_id=myId123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2FgitOauth%2FauthCode'
        )
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/gitOauth/authCode', function () {
    let fakeGetAccessToken, fakeGetUserInfo;

    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['users', 'stories'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    beforeEach(() => {
      fakeGetAccessToken = sinon.stub(Fetch.prototype, 'getAccessToken');
      fakeGetUserInfo = sinon.stub(Fetch.prototype, 'getUserInfo');
    });

    it('should redirect to dashboard when the code is valid and the user has an account', function (done) {
      fakeGetAccessToken.withArgs('goodCode1').resolves('token1');
      fakeGetUserInfo.withArgs('token1').resolves({ githubID: 58025838 });
      sinon
        .stub(ExpressDS.prototype, 'createSession')
        .withArgs('palpriyanshu')
        .resolves(1);

      request(app)
        .get('/gitOauth/authCode?code=goodCode1')
        .expect(302)
        .expect('Location', '/')
        .expect('set-cookie', /sesID=1/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should redirect to sign up when the code is valid but user has no account', function (done) {
      fakeGetAccessToken.withArgs('goodCode2').resolves('token2');
      fakeGetUserInfo
        .withArgs('token2')
        .resolves({ githubID: 1234, avatarURL: 'url' });
      sinon
        .stub(ExpressDS.prototype, 'createTempToken')
        .withArgs({ githubID: 1234, avatarURL: 'url' })
        .resolves(1);

      request(app)
        .get('/gitOauth/authCode?code=goodCode2')
        .expect(200)
        .expect('set-cookie', /regT=1/)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should send unauthorized for a bad code', function (done) {
      fakeGetAccessToken.rejects();
      request(app)
        .get('/gitOauth/authCode')
        .expect(401)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/signOut', function () {
    let fakeDelete;

    before(() => {
      fakeDelete = sinon.stub(ExpressDS.prototype, 'deleteSession');
      fakeDelete.resolves();
    });

    after(() => {
      sinon.restore();
    });

    it('should remove the session Id and redirect to main page', function (done) {
      request(app)
        .get('/signOut')
        .set('cookie', 'sesID=1')
        .expect(302)
        .expect('Location', '/')
        .expect('set-cookie', /sesID=;.*Expires=/)
        .end((err) => {
          sinon.assert.calledWith(fakeDelete, '1');
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/checkUsername', function () {
    before(() => setUpDatabase(app.locals.dbClientReference, ['users']));

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should respond with available if username is available', function (done) {
      request(app)
        .get('/checkUsername/bernie')
        .expect(JSON.stringify({ available: true }))
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with unavailable if username is taken', function (done) {
      request(app)
        .get('/checkUsername/palpriyanshu')
        .expect(JSON.stringify({ available: false }))
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

describe('POST', function () {
  let fakeGetSession;

  beforeEach(() => {
    fakeGetSession = sinon.stub(ExpressDS.prototype, 'getSession');
    fakeGetSession.resolves('palpriyanshu');
  });

  afterEach(() => {
    sinon.restore();
  });

  context('/publishStory', function () {
    beforeEach(() =>
      setUpDatabase(app.locals.dbClientReference, ['stories', 'users', 'tags'])
    );
    afterEach(() => cleanDatabase(app.locals.dbClientReference));

    before(() => {
      sinon.stub(ImageHandlers.prototype, 'deleteUnusedImages');
    });

    after(() => {
      sinon.restore();
    });

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

    it('should response with 422 for invalid tags', function (done) {
      request(app)
        .post('/publishStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '2',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'],
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

    it('should respond with 401 for an unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .post('/publishStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '2',
          tags: ['tag1', 'tag2'],
        })
        .expect(401)
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
    before(() => {
      sinon.stub(ImageHandlers.prototype, 'deleteUnusedImages');
      return setUpDatabase(app.locals.dbClientReference, ['stories', 'users']);
    });

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should respond with a 401 an unauthorized user', function (done) {
      fakeGetSession.resolves(null);
      request(app)
        .post('/saveStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [],
          storyID: '1',
        })
        .expect(401)
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

    it('should respond with a OK for a valid story', function (done) {
      request(app)
        .post('/saveStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [
            { type: 'paragraph', data: { text: 'paragraph' } },
            {
              type: 'image',
              data: { file: { url: '/blog_image/image_1_2.png' } },
            },
            { type: 'image', data: { file: {} } },
          ],
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

    it('should remove unused images from database', function (done) {
      request(app)
        .post('/saveStory')
        .send({
          storyTitle: 'validTitle',
          blocks: [
            { type: 'paragraph', data: { text: 'paragraph' } },
            {
              type: 'image',
              data: { file: { url: '/blog_image/image_1_2.png' } },
            },
            { type: 'image', data: { file: {} } },
          ],
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
  });

  context('/uploadImage', function () {
    before(() =>
      setUpDatabase(app.locals.dbClientReference, ['stories', 'users'])
    );

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should upload a valid image for post', function (done) {
      sinon.stub(ImageHandlers.prototype, 'uploadImage');
      request(app)
        .post('/uploadImage/2')
        .attach('image', 'test/testData/images/profile.jpg')
        .expect(200)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should not upload any image without .png .jpeg .jpg extensions', function (done) {
      request(app)
        .post('/uploadImage/2')
        .attach('image', 'test/testData/images/image.pdf')
        .expect(422)
        .expect({ error: 'please upload an image' })
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/signUp', function () {
    before(() => setUpDatabase(app.locals.dbClientReference, ['users']));

    after(() => cleanDatabase(app.locals.dbClientReference));

    it('should register and redirect the user to / when valid credentials', function (done) {
      sinon
        .stub(ExpressDS.prototype, 'getTokenValue')
        .resolves({ githubID: 1234, avatarURL: 'url' });
      sinon.stub(ExpressDS.prototype, 'createSession').resolves(1);

      request(app)
        .post('/signUp')
        .send({ userID: 'bernie' })
        .expect(302)
        .expect('Location', '/')
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 422 when there is no user name', function (done) {
      request(app)
        .post('/signUp')
        .expect(422)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 422 when the user name has spaces', function (done) {
      request(app)
        .post('/signUp')
        .send({ userID: 'b ernie' })
        .expect(422)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 422 when the user name is already taken', function (done) {
      sinon
        .stub(ExpressDS.prototype, 'getTokenValue')
        .resolves({ githubID: 1234, avatarURL: 'url' });

      request(app)
        .post('/signUp')
        .send({ userID: 'palpriyanshu' })
        .expect(422)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should respond with 401 when the registration token is invalid', function (done) {
      sinon.stub(ExpressDS.prototype, 'getTokenValue').resolves(null);

      request(app)
        .post('/signUp')
        .send({ userID: 'bernie' })
        .expect(401)
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });
  });

  context('/clap', function () {
    beforeEach(() =>
      setUpDatabase(app.locals.dbClientReference, [
        'stories',
        'users',
        'tags',
        'claps',
      ])
    );

    afterEach(() => cleanDatabase(app.locals.dbClientReference));

    it('should add clap if story is not clapped yet by user', function (done) {
      fakeGetSession.resolves('shiviraj');
      request(app)
        .post('/clap/1')
        .expect(200)
        .expect({ count: 2, isClapped: true })
        .end((err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
    });

    it('should remove clap if story is clapped yet by user', function (done) {
      fakeGetSession.resolves('palpriyanshu');
      request(app)
        .post('/clap/1')
        .expect(200)
        .expect({ count: 0 })
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
