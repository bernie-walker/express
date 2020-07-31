const { generateUrl } = require('./expressResourceFetcher');
const moment = require('moment');
const statusCodes = require('./statusCodes.json');

const logRequest = function (req, res, next) {
  if (!process.env.NO_LOG) {
    process.stdout.write(`${req.method} ${req.url}\n`);
  }
  next();
};

const attachUser = async function (req, res, next) {
  const { users } = req.app.locals;
  req.user = await users.getUser('palpriyanshu');
  next();
};

const redirectToGithub = function (req, res) {
  const { gitClientID } = req.app.locals;
  res.redirect(
    generateUrl({
      url: 'https://github.com',
      path: '/login/oauth/authorize',
      queryParams: {
        client_id: gitClientID,
        redirect_uri: 'http://localhost:3000/gitOauth/authCode',
      },
    })
  );
};

const closeSession = function (req, res) {
  const { sesID } = req.cookies;
  req.app.locals.expressDS.deleteSession(sesID).then(() => {
    res.clearCookie('sesID');
    res.redirect('/');
  });
};

const authorizeUser = function (req, res, next) {
  const { fetch } = req.app.locals;

  fetch
    .getAccessToken(req.query.code)
    .then((accessToken) => {
      fetch.getUserInfo(accessToken).then((userInfo) => {
        req.body.gitUserInfo = userInfo;
        next();
      });
    })
    .catch(() => {
      res.sendStatus(statusCodes.unauthorized);
    });
};

const redirectAuthorized = async function (req, res) {
  const { users, expressDS } = req.app.locals;
  const { githubID } = req.body.gitUserInfo;
  const account = await users.findAccount(githubID);

  if (!account) {
    res.redirect('/');
    return;
  }

  const sesID = await expressDS.createSession(account.userID);
  res.cookie('sesID', sesID);
  res.redirect('/dashboard');
};

const serveDashboard = async function (req, res) {
  const blogsNeeded = 10;
  const recentStories = await req.app.locals.stories.get(blogsNeeded);
  res.render('dashboard', Object.assign({ recentStories, moment }, req.user));
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
  try {
    const blog = await req.app.locals.stories.getStoryPage(req.params.storyID);
    res.render('blogPage', Object.assign(blog, req.user));
  } catch (error) {
    res.sendStatus(statusCodes.notFound);
  }
};

const createNewStory = async function (req, res) {
  const { stories } = req.app.locals;
  const storyID = await stories.createStory(req.user.id);
  res.redirect(`/editor/${storyID}`);
};

const renderEditor = async function (req, res) {
  const { stories } = req.app.locals;
  const storyContent = await stories.getStory(req.params.storyID, req.user.id);

  if (storyContent) {
    res.render('editor', Object.assign(storyContent, req.user));
  } else {
    res.sendStatus(statusCodes.notFound);
  }
};

const saveStory = function (req, res) {
  const { stories } = req.app.locals;
  const author = 'palpriyanshu';
  const { storyTitle, blocks: content, storyID: id } = req.body;
  const title = storyTitle.trim() || 'Untitled Story';

  stories
    .updateStory({ title, content, author, id })
    .then(res.end.bind(res))
    .catch(() => {
      res.sendStatus(statusCodes.unprocessableEntity);
    });
};

const validateTags = function (tags = []) {
  const MAX_TAG_LENGTH = 26;
  return tags.reduce((tags, tagValue) => {
    const tag = tagValue.trim();
    if (tag && tag.length < MAX_TAG_LENGTH && !tags.includes(tag)) {
      tags.push(tag);
    }
    return tags;
  }, []);
};

const isStoryValid = function (title, allTags) {
  const MAX_TAGS_ALLOWED = 5;
  return title && allTags.length <= MAX_TAGS_ALLOWED;
};

const publishStory = async function (req, res) {
  const author = req.user.id;
  const { stories } = req.app.locals;
  const { storyTitle = '', blocks: content, storyID: id, tags } = req.body;

  const title = storyTitle.trim();
  const allTags = validateTags(tags);

  if (!isStoryValid(title, allTags)) {
    return res.sendStatus(statusCodes.unprocessableEntity);
  }

  req.app.locals.tags.addTags(allTags, id);

  stories
    .updateStory({ title, content, state: 'published', author, id })
    .then(() => res.redirect(`/blogPage/${id}`))
    .catch(() => res.sendStatus(statusCodes.unprocessableEntity));
};

const serveUserStoriesPage = async function (req, res) {
  const { users } = req.app.locals;
  const publishedStories = await users.getUserStoryList(
    req.user.id,
    'published'
  );
  const draftedStories = await users.getUserStoryList(req.user.id, 'drafted');
  res.render(
    'userStories',
    Object.assign({ publishedStories, draftedStories }, req.user)
  );
};

const serveProfilePage = async function (req, res) {
  const { users } = req.app.locals;
  const profileID = req.params.profileID;
  users
    .getUserProfile(profileID)
    .then((userProfile) => {
      res.render('profile', Object.assign(userProfile, req.user));
    })
    .catch(() => {
      res.sendStatus(statusCodes.notFound);
    });
};

module.exports = {
  logRequest,
  attachUser,
  redirectToGithub,
  closeSession,
  authorizeUser,
  redirectAuthorized,
  serveDashboard,
  serveBlogImage,
  serveBlogPage,
  createNewStory,
  renderEditor,
  saveStory,
  publishStory,
  serveUserStoriesPage,
  serveProfilePage,
};
