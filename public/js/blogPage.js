const updateResponseCount = function () {
  const comments = Array.from(document.querySelectorAll('.comment'));
  document.querySelector(
    '#response > span'
  ).innerText = `${comments.length} responses`;
};

const displayComments = function (comments) {
  commentList.innerHTML = comments;
  const element =
    document.querySelector('.comment') ||
    document.querySelector('.emptyMessage');
  element.scrollIntoView();
  updateResponseCount();
};

const addComment = async function () {
  const storyID = blogTitle.getAttribute('storyid');
  const comment = rawComment.innerText;
  rawComment.innerText = '';

  const commentList = await fetch('/addComment', {
    method: 'POST',
    body: JSON.stringify({ storyID, comment }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.text());

  displayComments(commentList);
};

const activateRespond = function () {
  if (rawComment.innerText.trim()) {
    respond.classList.remove('inactive');
  } else {
    respond.classList.add('inactive');
  }
};

const getComments = async function () {
  const storyID = blogTitle.getAttribute('storyid');
  const commentList = await fetch(`/commentList/${storyID}`).then((response) =>
    response.text()
  );
  displayComments(commentList);
};

const toggleComments = function () {
  comments.classList.toggle('hidden');
  getComments().then(viewComments);
};

const showOnHoverMsg = function () {
  linkCopiedMsg.innerHTML = 'Copy to clipboard';
};

const shareBlog = function () {
  const textArea = document.createElement('textarea');
  textArea.value = `localhost:3000/blogPage/${blogTitle.getAttribute(
    'storyid'
  )}`;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  linkCopiedMsg.innerHTML = 'Link copied';
};

const clapOnStory = async function () {
  const storyID = blogTitle.getAttribute('storyid');
  const response = await fetch(`/clap/${storyID}`, { method: 'POST' });
  const { isClapped, count } = await response.json();
  getElement('.story-response div').classList.remove('clapped');
  if (isClapped) {
    getElement('.story-response div').classList.add('clapped');
  }
  getElement('.story-response div span').innerText = `${count} claps`;
};

const main = function () {
  attachHeadListener();
  shareSection.addEventListener('click', shareBlog);
  shareSection.addEventListener('mouseover', showOnHoverMsg);
  rawComment.addEventListener('keyup', activateRespond);
  respond.addEventListener('click', addComment);
};

window.onload = main;
