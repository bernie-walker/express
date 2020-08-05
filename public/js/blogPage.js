const insertCommentsIfNotHidden = async function () {
  const storyID = blogTitle.getAttribute('storyid');
  const list = await fetch(`/commentList/${storyID}`).then((response) =>
    response.text()
  );
  commentList.innerHTML = list;
};

const toggleComments = function () {
  comments.classList.toggle('hidden');
  rawComment.focus();
  insertCommentsIfNotHidden();
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
};

window.onload = main;
