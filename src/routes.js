const express = require('express');
const { logRequest, serveDashboard, serveBlogImage } = require('./handlers');
const app = express();

app.locals.noLog = process.env.NO_LOG;
app.locals.blogImagePath = process.env.BLOG_IMAGE_PATH;
app.locals.notFound = 404;

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));

app.get('/dashboard', serveDashboard);

app.get('/blog_image/:imageId', serveBlogImage);

module.exports = { app };
