const express = require('express');
const app = express();

app.set('view engine', 'pug');

app.use(express.static('public'));

app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    avatarUrl: 'https://avatars2.githubusercontent.com/u/58025838?s=460&v=4',
    username: 'palPriyanshu',
    display_name: 'priyanshu',
  });
});

module.exports = { app };
