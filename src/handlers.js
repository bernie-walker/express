const logRequest = function (req, res, next) {
  if (!process.env.NO_LOG) {
    process.stdout.write(`${req.method} ${req.url}\n`);
  }
  next();
};

const serveDashboard = function (req, res) {
  res.render('dashboard', {
    avatarUrl: 'https://avatars2.githubusercontent.com/u/58025838?s=460&v=4',
    username: 'palPriyanshu',
    displayName: 'priyanshu',
  });
};

module.exports = { logRequest, serveDashboard };
