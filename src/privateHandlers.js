const moment = require('moment');
const multer = require('multer');
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

const serveDashboard = async function (req, res) {
  const blogsNeeded = 10;
  const { stories } = req.app.locals;
  const recentStories = await stories.get(blogsNeeded);
  res.render('dashboard', Object.assign({ recentStories, moment }, req.user));
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
  const { imageStorage } = req.app.locals;
  const { storyID, blocks: content } = req.body;
  await imageStorage.delete(storyID, req.user.id, content);
  next();
};

const saveStory = async function (req, res) {
  const { stories } = req.app.locals;
  const { storyTitle: title, blocks: content, storyID } = req.body;
  const story = await stories.getPrivateStory(storyID, req.user.id);

  if (!story) {
    res.sendStatus(statusCodes.unprocessableEntity);
    return;
  }

  story.save({ title, content, author: req.user.id }).then(res.end.bind(res));
};

const publishStory = async function (req, res) {
  const { stories } = req.app.locals;
  const { storyTitle: title, blocks: content, storyID, tags } = req.body;
  const story = await stories.getPrivateStory(storyID, req.user.id);

  if (!story) {
    res.sendStatus(statusCodes.unprocessableEntity);
    return;
  }

  story
    .publish({ title, content, tags, author: req.user.id })
    .then(() => res.redirect(`/blogPage/${storyID}`))
    .catch(() => res.sendStatus(statusCodes.unprocessableEntity));
};

// eslint-disable-next-line no-unused-vars
const handleError = function (error, req, res, next) {
  res.status(statusCodes.unprocessableEntity);
  res.send({ error: error.message });
};

const uploadImage = async function (req, res) {
  const { imageStorage } = req.app.locals;
  const { storyID } = req.params;

  const cloudImage = await imageStorage.upload(storyID, req.file);

  res.send({ success: 1, file: { url: cloudImage } });
};

const updateClap = async function (req, res) {
  const { claps } = req.app.locals;
  const { storyID } = req.params;

  await claps.toggleClap(storyID, req.user.id);
  const clapsCount = await claps.clapCount(storyID);
  const isClapped = await claps.isClapped(storyID, req.user.id);
  res.json(Object.assign(clapsCount, { isClapped }));
};

const addComment = async function (req, res, next) {
  const { stories } = req.app.locals;
  stories
    .comment(Object.assign(req.body, { userID: req.user.id }))
    .then((storyID) => {
      req.params.storyID = storyID;
      next();
    })
    .catch(() => res.sendStatus(statusCodes.unprocessableEntity));
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

module.exports = {
  imageValidation: upload.single('image'),
  serveDashboard,
  createNewStory,
  renderEditor,
  saveStory,
  handleError,
  uploadImage,
  deleteUnusedImages,
  publishStory,
  updateClap,
  addComment,
  serveUserStoriesPage,
};
