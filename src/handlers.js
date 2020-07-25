const moment = require('moment');
const statusCodes = require('./statusCodes.json');

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
  const { blogImagePath } = req.app.locals;
  const [, root] = __dirname.match(/(.*express\/)(.*)/);
  res.sendFile(root + blogImagePath + req.params.imageID, (err) => {
    if (err) {
      res.status(statusCodes.notFound).send('<h1>Image Not Found</h1>');
    }
  });
};

const serveBlogPage = async function (req, res) {
  const blog = await req.app.locals.stories.getStory(req.params.blogID);
  if (blog) {
    res.render('blogPage', blog);
  } else {
    res.sendStatus(statusCodes.notFound);
  }
};

const serveEditorPage = function (req, res) {
  res.render('editor');
};

const publishStory = function (req, res) {
  const author = 'palpriyanshu';
  const { articleTitle, blocks } = req.body;

  if (!(articleTitle && articleTitle.match(/\S/))) {
    res.sendStatus(statusCodes.unprocessableEntity);
    return;
  }

  req.app.locals.stories
    .addStory(articleTitle, author, 'published', blocks)
    .then((blogID) => {
      res.json({ blogID });
    });
};

module.exports = {
  logRequest,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  serveEditorPage,
  publishStory,
};
