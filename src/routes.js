const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const { Users, Stories } = require('./expressData');

const {
  logRequest,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  createNewStory,
  renderEditor,
  checkIfUserIsTheAuthor,
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
app.locals.users = new Users(dbClient);
app.locals.stories = new Stories(dbClient);

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));
app.use(express.json());

app.get('/blogPage/:storyID', serveBlogPage);
app.get('/blog_image/:imageID', serveBlogImage);
app.get('/profile/:authorID', serveProfilePage);

app.get('/dashboard', serveDashboard);
app.get('/newStory', createNewStory);
app.get('/editor/:storyID', renderEditor);
app.get('/userStories', serveUserStoriesPage);

app.post('/saveStory', checkIfUserIsTheAuthor, saveStory);
app.post('/publishStory', checkIfUserIsTheAuthor, publishStory);

module.exports = { app };
