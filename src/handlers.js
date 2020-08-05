const fs = require('fs');
const moment = require('moment');

const { generateUrl } = require('./resourceFetcher');
const statusCodes = require('./statusCodes.json');
const {
  getImageDetails,
  changeImageIntoPng,
  handleImages,
} = require('./imageHandlers');

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
    const isClapped = await claps.isClapped(storyID, req.user && req.user.id);
    const blog = await stories.getStoryPage(storyID);
    res.render(
      'blogPage',
      Object.assign(blog, req.user, clapsCount, { isClapped })
    );
  } catch (error) {
    res.sendStatus(statusCodes.notFound);
  }
};

const serveComments = async function (req, res) {
  const { stories } = req.app.locals;
  const comments = await stories.listCommentsOn(req.params.storyID);
  res.render('comments', { comments });
};

const createNewStory = async function (req, res) {
  const { stories } = req.app.locals;
  const storyID = await stories.createStory(req.user.id);
  res.redirect(`/editor/${storyID}`);
};

const renderEditor = async function (req, res) {
  const { stories, tags } = req.app.locals;
  const storyContent = await stories.getStory(req.params.storyID, req.user.id);

  if (storyContent && storyContent.state === 'published') {
    storyContent.tags = await tags.getAllTags(req.params.storyID);
  }

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

  handleImages(id, content);

  stories
    .updateStory({ title, content, state: 'drafted', author: req.user.id, id })
    .then(res.end.bind(res))
    .catch(() => {
      res.sendStatus(statusCodes.unprocessableEntity);
    });
};

const uploadImage = async function (req, res) {
  const buffer = await changeImageIntoPng(req);
  const { imageStorePath, imageName } = await getImageDetails(req);
  fs.writeFileSync(imageStorePath, buffer);
  res.send({ success: 1, file: { url: `/blog_image/${imageName}` } });
};

// eslint-disable-next-line no-unused-vars
const handleError = function (error, req, res, next) {
  res.status(statusCodes.unprocessableEntity).send({ error: error.message });
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
  const { storyTitle, blocks: content, storyID: id, tags } = req.body;

  const title = storyTitle && storyTitle.trim();
  const allTags = validateTags(tags);

  if (!isStoryValid(title, allTags)) {
    return res.sendStatus(statusCodes.unprocessableEntity);
  }

  req.app.locals.tags.updateTags(id, allTags);

  stories
    .updateStory({ title, content, state: 'published', author, id })
    .then(() => res.redirect(`/blogPage/${id}`))
    .catch(() => res.sendStatus(statusCodes.unprocessableEntity));
};

const updateClap = async function (req, res) {
  const { claps } = req.app.locals;
  const { storyID } = req.params;
  await claps.toggleClap(storyID, req.user.id);
  const clapsCount = await claps.clapCount(storyID);
  const isClapped = await claps.isClapped(storyID, req.user.id);
  res.json(Object.assign(clapsCount, { isClapped }));
};

const serveUserStoriesPage = async function (req, res) {
  const { users } = req.app.locals;
  const storyState = { published: 'published', drafted: 'drafted' };
  const publishedStories = await users.getUserStoryList(
    req.user.id,
    storyState.published
  );
  const draftedStories = await users.getUserStoryList(
    req.user.id,
    storyState.drafted
  );
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
  serveComments,
  createNewStory,
  renderEditor,
  saveStory,
  handleError,
  uploadImage,
  publishStory,
  updateClap,
  serveUserStoriesPage,
  serveProfilePage,
};
