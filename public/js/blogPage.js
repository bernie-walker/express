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

const main = function () {
  attachHeadListener();
  logo.addEventListener('click', () => {
    window.location = '/dashboard';
  });

  shareSection.addEventListener('click', shareBlog);
  shareSection.addEventListener('mouseout', showOnHoverMsg);
};

window.onload = main;
