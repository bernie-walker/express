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
  const blog = await req.app.locals.stories.getStory(req.params.storyID);
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
  res.redirect(`/editor/${storyID}`);
};

const renderEditor = async function (req, res) {
  const { stories } = req.app.locals;
  const storyContent = await stories.getStoryContent(
    req.params.storyID,
    'palpriyanshu'
  );
  if (storyContent) {
    res.render('editor', storyContent);
  } else {
    res.sendStatus(statusCodes.notFound);
  }
};

const saveStory = async function (req, res) {
  const { stories } = req.app.locals;
  const author = 'palpriyanshu';
  const { articleTitle, blocks: content, storyID: id } = req.body;
  const title = articleTitle.trim() || 'Untitled Story';

  const story = await stories.getStoryContent(id, author);

  if (!story) {
    res.sendStatus(statusCodes.unprocessableEntity);
    return;
  }

  await stories.updateStory({ title, content, state: 'drafted', author, id });
  res.end();
};

const publishStory = function (req, res) {
  const author = 'palpriyanshu';
  const { articleTitle, blocks } = req.body;

  if (!(articleTitle && articleTitle.trim())) {
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
  const userInfo = await users.getUserInfo('palpriyanshu');
  const authorID = req.params.authorID;
  const authorInfo = await users.getUserInfo(authorID);
  if (!authorInfo) {
    res.status(statusCodes.notFound).send('user not found');
    return;
  }
  const publishedStories = await users.getUserStories(authorID, 'published');
  res.render(
    'profile',
    Object.assign({ publishedStories, authorInfo }, userInfo)
  );
};

module.exports = {
  logRequest,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  createNewStory,
  renderEditor,
  saveStory,
  publishStory,
  serveYourStoriesPage,
  serveProfilePage,
};
