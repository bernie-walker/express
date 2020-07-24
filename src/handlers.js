const logRequest = function (req, res, next) {
  if (!process.env.NO_LOG) {
    process.stdout.write(`${req.method} ${req.url}\n`);
  }
  next();
};

const serveDashboard = async function (req, res) {
  const users = req.app.locals.users;
  const userInfo = await users.getUserInfo('palpriyanshu');
  const stories = req.app.locals.stories;
  const blogsNeeded = 10;
  const recentStories = await stories.get(blogsNeeded);
  res.render('dashboard', Object.assign({ recentStories }, userInfo));
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
