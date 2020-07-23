const express = require('express');
const { logRequest, serveDashboard } = require('./handlers');
const app = express();

app.set('view engine', 'pug');

app.use(logRequest);
app.use(express.static('public'));

app.get('/dashboard', serveDashboard);

module.exports = { app };
