const statusCodes = require('./statusCodes.json');

const serveHomepage = function (req, res, next) {
  if (req.user && req.user.isSignedIn) {
    next();
    return;
  }
  res.render('index');
};

const checkUsernameAvailability = async function (req, res) {
  const { users } = req.app.locals;
  const isUserPresent = await users.has(req.params.userName);
  res.json({ available: !isUserPresent });
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

const attachPublicStory = async function (req, res, next) {
  const { stories } = req.app.locals;
  const storyID = req.body.storyID || req.params.storyID;

  const story = await stories.getPublicStory(storyID);

  if (!story) {
    next(new Error('notFound'));
  } else {
    req.app.locals.story = story;
    next();
  }
};

const serveBlogPage = async function (req, res) {
  const { story } = req.app.locals;
  const userID = req.user ? req.user.id : null;

  const storyPage = await story.render(userID);
  res.render('blogPage', Object.assign(storyPage, req.user));
};

const serveComments = async function (req, res) {
  const { story } = req.app.locals;

  const comments = await story.listComments();
  res.render('comments', { comments });
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
  serveHomepage,
  checkUsernameAvailability,
  serveBlogImage,
  attachPublicStory,
  serveBlogPage,
  serveComments,
  serveProfilePage,
};
