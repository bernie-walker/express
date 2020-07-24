const express = require('express');
const Sqlite3 = require('sqlite3').verbose();
const { Users } = require('./expressData');

const { logRequest, serveDashboard, serveBlogImage } = require('./handlers');
const app = express();

app.locals.noLog = process.env.NO_LOG;
app.locals.blogImagePath = process.env.BLOG_IMAGE_PATH;
app.locals.notFound = 404;
const dbClient = new Sqlite3.Database(process.env.DB_PATH);
app.locals.users = new Users(dbClient);

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));

app.get('/dashboard', serveDashboard);

app.get('/blog_image/:imageId', serveBlogImage);

module.exports = { app };
