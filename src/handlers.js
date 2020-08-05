const moment = require('moment');
const multer = require('multer');

const { generateUrl } = require('./resourceFetcher');
const statusCodes = require('./statusCodes.json');

const upload = multer({
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(new Error('please upload an image'));
    }
    cb(null, true);
  },
});

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
  if (!(req.user && req.user.isSignedIn)) {
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

const closeSession = async function (req, res) {
  const { sesID } = req.cookies;
  const { expressDS } = req.app.locals;
  await expressDS.deleteSession(sesID);
  res.clearCookie('sesID');
  res.redirect('/');
};

const authenticateUser = async function (req, res, next) {
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
  const { userID } = req.body;

  if (!userID || userID.match(/\s/)) {
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

const getClapsDetails = async function (req, res, next) {
  const { claps } = req.app.locals;
  const { storyID } = req.params;
  req.params.isClapped = false;
  if (req.user) {
    req.params.isClapped = await claps.isClapped(storyID, req.user.id);
  }
  req.params.clapsCount = await claps.clapCount(storyID);
  next();
};

const serveBlogPage = function (req, res) {
  const { stories } = req.app.locals;
  const { storyID, clapsCount, isClapped } = req.params;

  stories
    .getStoryPage(storyID)
    .then((blog) => {
      res.render(
        'blogPage',
        Object.assign(blog, req.user, clapsCount, { isClapped })
      );
    })
    .catch(() => res.sendStatus(statusCodes.notFound));
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

const deleteUnusedImages = async function (req, res, next) {
  const { imageHandlers } = req.app.locals;
  const { storyID, blocks: content } = req.body;
  await imageHandlers.deleteUnusedImages(storyID, content);
  next();
};

const saveStory = async function (req, res) {
  const { stories } = req.app.locals;
  const { storyTitle, blocks: content, storyID: id } = req.body;
  const title = storyTitle.trim() || 'Untitled Story';

  stories
    .updateStory({ title, content, state: 'drafted', author: req.user.id, id })
    .then(res.end.bind(res))
    .catch(() => {
      res.sendStatus(statusCodes.unprocessableEntity);
    });
};

const handleError = function (error, req, res, next) {
  if (error) {
    res.status(statusCodes.unprocessableEntity);
    res.send({ error: error.message });
    return;
  }
  next();
};

const uploadImage = async function (req, res) {
  const { imageHandlers } = req.app.locals;
  const { storyID } = req.params;

  const imageName = await imageHandlers.uploadImage(req.file, storyID);

  res.send({ success: 1, file: { url: `/blog_image/${imageName}` } });
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
  const { stories, tags } = req.app.locals;
  const { storyTitle, blocks: content, storyID: id, tags: newTags } = req.body;

  const title = storyTitle && storyTitle.trim();
  const allTags = validateTags(newTags);

  if (!isStoryValid(title, allTags)) {
    return res.sendStatus(statusCodes.unprocessableEntity);
  }

  tags.updateTags(id, allTags);

  stories
    .updateStory({ title, content, state: 'published', author, id })
    .then(() => res.redirect(`/blogPage/${id}`))
    .catch(() => res.sendStatus(statusCodes.unprocessableEntity));
};

const updateClap = async function (req, res) {
  const { claps } = req.app.locals;
  const { storyID } = req.params;
  if (!req.user.isSignedIn) {
    res.sendStatus(statusCodes.unauthorized);
    return;
  }
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
  imageValidation: upload.single('image'),
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
  getClapsDetails,
  serveBlogPage,
  serveComments,
  createNewStory,
  renderEditor,
  saveStory,
  handleError,
  uploadImage,
  deleteUnusedImages,
  publishStory,
  updateClap,
  serveUserStoriesPage,
  serveProfilePage,
};
