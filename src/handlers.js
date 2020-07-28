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

const createNewStory = async function (req, res) {
  const Stories = req.app.locals.stories;
  const newStoryParams = ['Untitled Story', 'palpriyanshu', 'drafted', []];
  const storyID = await Stories.addStory(...newStoryParams);
  res.render('editor', { storyID });
};

// const serveEditorPageWithDraft = async function (req, res) {
//   try {
//     const Stories = req.app.locals.stories;
//     const blog = await Stories.getUserStory(req.params.blogID, req.user.id);
//     res.render('editor', blog);
//   } catch (error) {
//     res.status(500).end();
//   }
// };

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

const serveYourStoriesPage = async function (req, res) {
  const users = req.app.locals.users;
  const userInfo = await users.getUserInfo('palpriyanshu');
  const publishedStories = await users.getUserStories(userInfo.id, 'published');
  const draftedStories = await users.getUserStories(userInfo.id, 'drafted');
  res.render(
    'yourStories',
    Object.assign({ publishedStories, draftedStories }, userInfo)
  );
};

const serveProfilePage = async function (req, res) {
  const users = req.app.locals.users;
  const userID = req.params.userID;
  const userInfo = await users.getUserInfo(userID);
  if (!userInfo) {
    res.status(statusCodes.notFound).send('user not found');
    return;
  }
  const publishedStories = await users.getUserStories(userInfo.id, 'published');
  res.render('profile', Object.assign({ publishedStories }, userInfo));
};

module.exports = {
  logRequest,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  createNewStory,
  publishStory,
  serveYourStoriesPage,
  serveProfilePage,
};
