const express = require('express');
const redis = require('redis');
const Sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const cookieParser = require('cookie-parser');
const { ExpressDB, ExpressDS } = require('./dataProviders');
const { Users, Stories, Tags, Claps } = require('./dataModels');
const { Fetch } = require('./resourceFetcher');
const { ImageStorage } = require('./imageStorage');

const {
  NO_LOG,
  BLOG_IMAGE_PATH,
  DB_PATH,
  GIT_CLIENT_ID,
  GIT_CLIENT_SECRET,
  REDIS_URL,
  REDIS_DB,
  CLOUD_SECRET,
  CLOUD_KEY,
  CLOUD_NAME,
} = process.env;

const {
  logRequest,
  attachUserIfSignedIn,
  authorizeUser,
  closeSession,
  handleUnprocessableEntity,
} = require('./generalHandlers');

const {
  redirectToGithub,
  authenticateUser,
  redirectAuthenticated,
  takeToSignUp,
  registerUser,
  finishRegistration,
} = require('./authenticationHandlers');

const {
  serveHomepage,
  checkUsernameAvailability,
  serveBlogImage,
  serveBlogPage,
  serveComments,
  serveProfilePage,
} = require('./publicHandlers');

const {
  imageValidation,
  serveDashboard,
  createNewStory,
  renderEditor,
  attachStory,
  saveStory,
  publishStory,
  uploadImage,
  deleteUnusedImages,
  updateClap,
  addComment,
  serveUserStoriesPage,
} = require('./privateHandlers');

const app = express();

app.locals.noLog = NO_LOG;
app.locals.blogImagePath = BLOG_IMAGE_PATH;
app.locals.gitClientID = GIT_CLIENT_ID || 'myId123';

app.locals.fetch = new Fetch(axios, GIT_CLIENT_ID, GIT_CLIENT_SECRET);

const dbClient = new Sqlite3.Database(DB_PATH || ':memory:');
const expressDB = new ExpressDB(dbClient);
app.locals.dbClientReference = dbClient;
app.locals.users = new Users(expressDB);
app.locals.stories = new Stories(expressDB);
app.locals.tags = new Tags(expressDB);
app.locals.claps = new Claps(expressDB);

const dsClient = redis.createClient({
  url: REDIS_URL || 'redis://127.0.0.1:6379',
  db: REDIS_DB,
});

cloudinary.config({
  cloud_name: CLOUD_NAME || 'name',
  api_key: CLOUD_KEY || 'key',
  api_secret: CLOUD_SECRET || 'secret',
});

const expressDS = new ExpressDS(dsClient);
app.locals.expressDS = expressDS;
app.locals.imageStorage = new ImageStorage(cloudinary, expressDB);

app.set('view engine', 'pug');

app.use(logRequest);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/authenticate', redirectToGithub);
app.get(
  '/gitOauth/authCode',
  authenticateUser,
  redirectAuthenticated,
  takeToSignUp
);

app.get('/blog_image/:imageID', serveBlogImage);
app.get('/commentList/:storyID', serveComments);
app.get('/signOut', closeSession);

app.get('/checkUsername/:userName', checkUsernameAvailability);
app.post('/signUp', registerUser, finishRegistration);

app.use(attachUserIfSignedIn);
app.get('/', serveHomepage, serveDashboard);
app.get('/profile/:profileID', serveProfilePage);
app.get('/blogPage/:storyID', serveBlogPage);

app.use(authorizeUser);
app.get('/newStory', createNewStory);
app.get('/userStories', serveUserStoriesPage);
app.post('/uploadImage/:storyID', imageValidation, uploadImage);

app.get('/editor/:storyID', renderEditor);
app.post('/clap/:storyID', updateClap);
app.post('/addComment', addComment, serveComments);

app.use(attachStory);
app.post('/saveStory', deleteUnusedImages, saveStory);
app.post('/publishStory', deleteUnusedImages, publishStory);

app.use(handleUnprocessableEntity);

module.exports = { app };
