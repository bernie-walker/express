const MESSAGE_APPEARANCE_TIME = 3000;

const hideLinkCopiedMsg = function () {
  linkCopiedMsg.classList.add('hidden');
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
  linkCopiedMsg.classList.remove('hidden');
  setTimeout(hideLinkCopiedMsg, MESSAGE_APPEARANCE_TIME);
};

const main = function () {
  attachHeadListener();
  logo.addEventListener('click', () => {
    window.location = '/dashboard';
  });

  shareBtn.addEventListener('click', shareBlog);
};

window.onload = main;
