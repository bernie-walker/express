const querystring = require('querystring');

const generateUrl = function (urlObject) {
  const { url, path, queryParams } = urlObject;
  return `${url}${path}?${querystring.stringify(queryParams)}`;
};

const generateUserInfoConfig = function (accessToken) {
  return {
    url: 'https://api.github.com/user',
    headers: {
      Authorization: `token ${accessToken}`,
      accept: 'application/json',
    },
  };
};

const generateAccessTokenConfig = function (code, clientID, clientSecret) {
  return {
    method: 'post',
    url: `https://github.com/login/oauth/access_token?client_id=${clientID}&client_secret=${clientSecret}&code=${code}`,
    headers: {
      accept: 'application/json',
    },
  };
};

class Fetch {
  constructor(httpClient, appID, appSecret) {
    this.httpClient = httpClient;
    this.appID = appID;
    this.appSecret = appSecret;
  }

  getAccessToken(code) {
    const config = generateAccessTokenConfig(code, this.appID, this.appSecret);

    return this.httpClient(config).then((response) => {
      const { access_token: accessToken } = response.data;

      if (accessToken) {
        return Promise.resolve(accessToken);
      }

      return Promise.reject();
    });
  }

  getUserInfo(userAccessToken) {
    const config = generateUserInfoConfig(userAccessToken);

    return this.httpClient(config).then((response) => {
      const {
        login: userID,
        name: userName,
        avatar_url: avatarURL,
        id: githubID,
      } = response.data;

      if (!githubID) {
        return Promise.reject();
      }

      return Promise.resolve({ userID, userName, avatarURL, githubID });
    });
  }
}

module.exports = { Fetch, generateUrl };
