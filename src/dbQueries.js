const latestNStoriesQuery = function (count, offset) {
  return `SELECT usr.display_name as authorName, str.*
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  WHERE state='published'
  ORDER BY str.last_modified DESC
  LIMIT ${offset},${count};`;
};

const publishedStoryQuery = function (storyID) {
  return `SELECT usr.display_name as authorName,usr.avatar_url as authorAvatar,
  str.title,str.content,str.id as storyID,str.written_by as authorID,
  date(str.last_modified) as lastModified, tag
  FROM stories AS str
  JOIN users AS usr 
  ON str.written_by = usr.id
  LEFT JOIN tags
  ON str.id = tags.tag_on
  WHERE state='published' AND str.id='${storyID}';`;
};

const storyOfUserQuery = function (storyID, userID) {
  return `SELECT title, content, state, id as storyID 
          FROM stories 
          WHERE id='${storyID}' AND written_by='${userID}';`;
};

const updateStoryQuery = function (state) {
  const status = state ? `state='${state}',` : '';
  return `UPDATE stories SET title=?, content=?,
   ${status} 
  last_modified=CURRENT_TIMESTAMP
  WHERE id=? AND written_by=?`;
};

const findAccountQuery = function (gitID) {
  return `
  SELECT id as userID 
  FROM users WHERE github_id='${gitID}'`;
};

const userInfoQuery = function (userID) {
  return `
  SELECT id, display_name, avatar_url
  FROM users WHERE id='${userID}'`;
};

const userStoriesQuery = function (userID, state) {
  return `
SELECT title, id as storyID, date(last_modified) as lastModified
FROM stories 
WHERE written_by='${userID}' AND state='${state}' 
ORDER BY last_modified DESC;`;
};

const userProfileQuery = function (userID) {
  return `
  SELECT usr.id as profileID, usr.display_name as profileName, 
  usr.avatar_url as profileAvatar, usr.bio,
  str.id as storyID, str.title, str.content, 
  str.cover_image as coverImage, date(str.last_modified) as lastModified
  FROM users as usr 
  LEFT JOIN stories as str ON usr.id=str.written_by 
  WHERE usr.id='${userID}' AND (str.state='published' OR str.state IS NULL);
  `;
};

const addTagsQuery = function (tags, storyID) {
  const tagsAndStoryID = tags.map((tag) => `('${storyID}', '${tag}')`);
  return `INSERT INTO tags(tag_on, tag)
          VALUES ${tagsAndStoryID.join(',')};`;
};

const addClapQuery = function () {
  return 'INSERT INTO claps (clapped_on, clapped_by) VALUES(?,?);';
};

const removeClapQuery = function () {
  return 'DELETE FROM claps WHERE clapped_on=? AND clapped_by=?;';
};

const isClappedQuery = function () {
  return 'SELECT * FROM claps WHERE clapped_on=? AND clapped_by=?;';
};

const clapCountQuery = function () {
  return 'SELECT count(*) as count FROM claps WHERE clapped_on=?;';
};

module.exports = {
  latestNStoriesQuery,
  publishedStoryQuery,
  storyOfUserQuery,
  updateStoryQuery,
  userInfoQuery,
  findAccountQuery,
  userStoriesQuery,
  userProfileQuery,
  addTagsQuery,
  addClapQuery,
  removeClapQuery,
  isClappedQuery,
  clapCountQuery,
};
