const { generateUrl } = require('./resourceFetcher');
const moment = require('moment');
const statusCodes = require('./statusCodes.json');

const logRequest = function (req, res, next) {
  if (!process.env.NO_LOG) {
    process.stdout.write(`${req.method} ${req.url}\n`);
  }
  next();
};

const attachUserIfSignedIn = async function (req, res, next) {
  const { users, expressDS } = req.app.locals;
  req.user = { isSignedIn: false };

  const userID = await expressDS.getSession(req.cookies.sesID);

  if (userID) {
    req.user = await users.getUser(userID);
    req.user && (req.user.isSignedIn = true);
  }

  next();
};

const authorizeUser = function (req, res, next) {
  if (req.user && !req.user.isSignedIn) {
    res.sendStatus(statusCodes.unauthorized);
    return;
  }
  next();
};

const serveHomepage = function (req, res, next) {
  if (req.user && req.user.isSignedIn) {
    next();
    return;
  }
  res.render('index');
};

const serveDashboard = async function (req, res) {
  const blogsNeeded = 10;
  const { stories } = req.app.locals;
  const recentStories = await stories.get(blogsNeeded);
  res.render('dashboard', Object.assign({ recentStories, moment }, req.user));
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

const authenticateUser = function (req, res, next) {
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

const createSessionAndRedirect = async function (res, dataStore, userID) {
  const sesID = await dataStore.createSession(userID);
  res.cookie('sesID', sesID);
  res.redirect('/');
};

const redirectAuthenticated = async function (req, res, next) {
  const { users, expressDS } = req.app.locals;
  const { githubID } = req.body.gitUserInfo;
  const account = await users.findAccount(githubID);

  if (!account) {
    next();
    return;
  }

  createSessionAndRedirect(res, expressDS, account.userID);
};

const takeToSignUp = async function (req, res) {
  const { expressDS } = req.app.locals;
  const { userID, userName, githubID, avatarURL } = req.body.gitUserInfo;
  const registrationToken = await expressDS.createTempToken({
    githubID,
    avatarURL,
  });
  res.cookie('regT', registrationToken);
  res.render('signUp', { userID, userName });
};

const checkUsernameAvailability = async function (req, res) {
  const { users } = req.app.locals;
  const usersList = await users.list();
  let available = true;

  if (usersList.includes(req.params.userName)) {
    available = false;
  }

  res.json({ available });
};

const registerUser = async function (req, res) {
  const { users, expressDS } = req.app.locals;

  if (!req.body.userID || req.body.userID.match(/\s/)) {
    res.sendStatus(statusCodes.unprocessableEntity);
    return;
  }

  const registrationInfo = await expressDS.getTokenValue(req.cookies.regT);

  if (!registrationInfo) {
    res.sendStatus(statusCodes.unauthorized);
    return;
  }

  users
    .registerUser(Object.assign(registrationInfo, req.body))
    .then((userID) => {
      createSessionAndRedirect(res, expressDS, userID);
    })
    .catch(() => {
      res.sendStatus(statusCodes.unprocessableEntity);
    });
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
    const { stories, claps } = req.app.locals;
    const { storyID } = req.params;
    const clapsCount = await claps.clapCount(storyID);
    const isClapped = await claps.isClapped(storyID, req.user.id);
    const blog = await stories.getStoryPage(storyID);
    res.render(
      'blogPage',
      Object.assign(blog, req.user, clapsCount, { isClapped })
    );
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
  const { storyTitle, blocks: content, storyID: id } = req.body;
  const title = storyTitle.trim() || 'Untitled Story';

  stories
    .updateStory({ title, content, author: req.user.id, id })
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

  req.app.locals.tags.addTags(id, allTags);

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
  attachUserIfSignedIn,
  authorizeUser,
  serveHomepage,
  redirectToGithub,
  closeSession,
  authenticateUser,
  redirectAuthenticated,
  takeToSignUp,
  checkUsernameAvailability,
  registerUser,
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
