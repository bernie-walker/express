const express = require('express');
const { logRequest } = require('./handlers');
const app = express();

app.use(logRequest);
app.use(express.static('public'));

module.exports = { app };
