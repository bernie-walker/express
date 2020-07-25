const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const { Users, Stories } = require('./expressData');
const {
  logRequest,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  serveEditorPage,
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

app.get('/dashboard', serveDashboard);
app.get('/blogPage/:blogID', serveBlogPage);
app.get('/blog_image/:imageID', serveBlogImage);
app.get('/editor', serveEditorPage);

module.exports = { app };
