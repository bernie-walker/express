const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const { ExpressDB } = require('./expressData');
const { Users } = require('./users');
const { Stories } = require('./stories');

const {
  logRequest,
  attachUser,
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

app.locals.noLog = process.env.NO_LOG;
app.locals.blogImagePath = process.env.BLOG_IMAGE_PATH;

const dbClient = new Sqlite3.Database(process.env.DB_PATH);
app.locals.dbClientReference = dbClient;

const expressDB = new ExpressDB(dbClient);
app.locals.users = new Users(expressDB);
app.locals.stories = new Stories(expressDB);

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));
app.use(express.json());

app.use(attachUser);

app.get('/blog_image/:imageID', serveBlogImage);
app.get('/profile/:profileID', serveProfilePage);
app.get('/blogPage/:storyID', serveBlogPage);
app.get('/dashboard', serveDashboard);
app.get('/newStory', createNewStory);
app.get('/editor/:storyID', renderEditor);
app.get('/userStories', serveUserStoriesPage);

app.post('/saveStory', saveStory);
app.post('/publishStory', publishStory);

module.exports = { app };
