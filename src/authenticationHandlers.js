const { generateUrl } = require('./resourceFetcher');
const statusCodes = require('./statusCodes.json');

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

const registerUser = async function (req, res, next) {
  const { users, expressDS } = req.app.locals;

  const registrationInfo = await expressDS.getTokenValue(req.cookies.regT);

  if (!registrationInfo) {
    res.sendStatus(statusCodes.unauthorized);
    return;
  }

  users
    .registerUser(Object.assign(registrationInfo, req.body))
    .then(() => {
      next();
    })
    .catch(() => {
      res.sendStatus(statusCodes.unprocessableEntity);
    });
};

const finishRegistration = async function (req, res) {
  const { expressDS } = req.app.locals;
  const { userID } = req.body;

  await expressDS.deleteTempToken(req.cookies.regT);
  res.clearCookie('regT');

  createSessionAndRedirect(res, expressDS, userID);
};

module.exports = {
  redirectToGithub,
  authenticateUser,
  redirectAuthenticated,
  takeToSignUp,
  registerUser,
  finishRegistration,
};
