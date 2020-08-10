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
  await imageStorage.delete(storyID, content);
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

// eslint-disable-next-line no-unused-vars
const handleError = function (error, req, res, next) {
  if (error) {
    res.status(statusCodes.unprocessableEntity);
    res.send({ error: error.message });
  }
};

const uploadImage = async function (req, res) {
  const { imageStorage } = req.app.locals;
  const { storyID } = req.params;

  const cloudImage = await imageStorage.upload(storyID, req.file);

  res.send({ success: 1, file: { url: cloudImage } });
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
