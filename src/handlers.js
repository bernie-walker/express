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

const serveBlogImage = function (req, res) {
  const { notFound, blogImagePath } = req.app.locals;
  const [, root] = __dirname.match(/(.*express\/)(.*)/);
  res.sendFile(root + blogImagePath + req.params.imageId, (err) => {
    if (err) {
      res.status(notFound).send('<h1>Image Not Found</h1>');
    }
  });
};

module.exports = { logRequest, serveDashboard, serveBlogImage };
