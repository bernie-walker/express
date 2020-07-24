const moment = require('moment');

const logRequest = function (req, res, next) {
  if (!process.env.NO_LOG) {
    process.stdout.write(`${req.method} ${req.url}\n`);
  }
  next();
};

const serveDashboard = async function (req, res) {
  const blogsNeeded = 10;
  const users = req.app.locals.users;
  const userInfo = await users.getUserInfo('palpriyanshu');
  const recentStories = await req.app.locals.stories.get(blogsNeeded);
  res.render('dashboard', Object.assign({ recentStories, moment }, userInfo));
};

const serveBlogImage = function (req, res) {
  const { notFound, blogImagePath } = req.app.locals;
  const [, root] = __dirname.match(/(.*express\/)(.*)/);
  res.sendFile(root + blogImagePath + req.params.imageID, (err) => {
    if (err) {
      res.status(notFound).send('<h1>Image Not Found</h1>');
    }
  });
};

const serveBlogPage = async function (req, res) {
  const blog = await req.app.locals.stories.getStory(req.params.blogID);
  if (blog) {
    res.render('blogPage', blog);
  } else {
    res.sendStatus(req.app.locals.notFound);
  }
};

module.exports = { logRequest, serveDashboard, serveBlogImage, serveBlogPage };
