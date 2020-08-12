const moment = require('moment');
const multer = require('multer');
const statusCodes = require('./statusCodes.json');

const upload = multer({
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.match(/image\/(jpg|jpeg|png)$/)) {
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

const attachStory = async function (req, res, next) {
  const { stories } = req.app.locals;
  const storyID = req.body.storyID || req.params.storyID;
  const story = await stories.getPrivateStory(storyID, req.user.id);

  if (!story) {
    next(new Error('Story does not exist'));
  } else {
    req.app.locals.story = story;
    next();
  }
};

const renderEditor = async function (req, res) {
  const { story } = req.app.locals;
  const storyContent = await story.get();
  res.render('editor', Object.assign(storyContent, req.user));
};

const deleteUnusedImages = async function (req, res, next) {
  const { imageStorage, story } = req.app.locals;
  const { blocks: content } = req.body;
  const { content: oldContent } = await story.get();
  await imageStorage.delete(content, oldContent);
  next();
};

const saveStory = async function (req, res) {
  const { story } = req.app.locals;
  const { storyTitle: title, blocks: content } = req.body;
  story.save({ title, content, author: req.user.id }).then(res.end.bind(res));
};

const publishStory = async function (req, res, next) {
  const { story } = req.app.locals;
  const { storyTitle: title, blocks: content, storyID, tags } = req.body;

  story
    .publish({ title, content, tags, author: req.user.id })
    .then(() => res.redirect(`/blogPage/${storyID}`))
    .catch(() => next(new Error('Wrong data')));
};

const uploadImage = async function (req, res) {
  const { imageStorage } = req.app.locals;
  const { storyID } = req.params;

  const cloudImage = await imageStorage.upload(storyID, req.file);

  res.send({ success: 1, file: { url: cloudImage } });
};

const updateClap = async function (req, res, next) {
  const { stories } = req.app.locals;
  const story = await stories.getPublicStory(req.params.storyID);

  if (!story) {
    next(new Error('Story does not exist'));
    return;
  }

  const clapInfo = await story.toggleClap(req.user.id);
  res.json(clapInfo);
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
  attachStory,
  saveStory,
  publishStory,
  uploadImage,
  deleteUnusedImages,
  updateClap,
  addComment,
  serveUserStoriesPage,
};
