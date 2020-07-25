let editor;

const saveAndPublish = async function (title) {
  const data = await editor.save();
  out.innerHTML = JSON.stringify(Object.assign(data, { articleTitle: title }));
};

const publishBlog = function () {
  const title = articleTitle.innerText;

  if (!title) {
    alert('A story without a title does not seem cool right...');
  }

  saveAndPublish(title);
};

const togglePublishedOnTitle = function () {
  if (articleTitle.innerText.match(/\S/)) {
    publishBtn.classList.remove('inactive');
  } else {
    publishBtn.classList.add('inactive');
  }
};

const handleTitleKeypress = function () {
  if (event.key === 'Enter') {
    document.querySelector('#editorjs div[contenteditable=true]').focus();
  }
  togglePublishedOnTitle();
};

const createEditor = function () {
  editor = new EditorJS({
    holder: 'editorjs',
  });
};

const main = function () {
  createEditor();
  articleTitle.addEventListener('keypress', handleTitleKeypress);
  articleTitle.addEventListener('keyup', togglePublishedOnTitle);
  publishBtn.addEventListener('click', publishBlog);
};

window.onload = main;
