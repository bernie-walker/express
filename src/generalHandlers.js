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
  if (!(req.user && req.user.isSignedIn)) {
    res.sendStatus(statusCodes.unauthorized);
    return;
  }
  next();
};

const closeSession = async function (req, res) {
  const { sesID } = req.cookies;
  const { expressDS } = req.app.locals;
  await expressDS.deleteSession(sesID);
  res.clearCookie('sesID');
  res.redirect('/');
};

// eslint-disable-next-line no-unused-vars
const handleUnprocessableEntity = function (error, req, res, next) {
  res.sendStatus(statusCodes[error.message]);
};

module.exports = {
  logRequest,
  attachUserIfSignedIn,
  authorizeUser,
  closeSession,
  handleUnprocessableEntity,
};
