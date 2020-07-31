const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { ExpressDB } = require('./expressData');
const { Users } = require('./users');
const { Stories } = require('./stories');
const { Tags } = require('./tags');
const { Fetch } = require('./expressResourceFetcher');
const {
  NO_LOG,
  BLOG_IMAGE_PATH,
  DB_PATH,
  GIT_CLIENT_ID,
  GIT_CLIENT_SECRET,
} = process.env;

const {
  logRequest,
  attachUser,
  redirectToGithub,
  authorizeUser,
  redirectAuthorized,
  // sendUnauthorized,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  createNewStory,
  renderEditor,
  saveStory,
  publishStory,
  serveUserStoriesPage,
  serveProfilePage,
} = require('./handlers');

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

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/authorize', redirectToGithub);
app.get('/gitOauth/authCode', authorizeUser, redirectAuthorized);
app.get('/blog_image/:imageID', serveBlogImage);

app.use(attachUser);

app.get('/profile/:profileID', serveProfilePage);
app.get('/blogPage/:storyID', serveBlogPage);
app.get('/dashboard', serveDashboard);
app.get('/newStory', createNewStory);
app.get('/editor/:storyID', renderEditor);
app.get('/userStories', serveUserStoriesPage);

app.post('/saveStory', saveStory);
app.post('/publishStory', publishStory);

module.exports = { app };
