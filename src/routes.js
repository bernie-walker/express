const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const { ExpressDB } = require('./expressData');
const { Users } = require('./users');
const { Stories } = require('./stories');
const { Tags } = require('./tags');
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
app.locals.gitClientSecret = GIT_CLIENT_SECRET || 'mySecret1234';

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

app.get('/authorize', redirectToGithub);
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
