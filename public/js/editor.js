const OK = 200;
let editor;

const getPublishStoryOptions = function (story) {
  return {
    method: 'POST',
    body: JSON.stringify(story),
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

const publishAndGotoBlog = async function (story) {
  const response = await fetch('/publishStory', getPublishStoryOptions(story));

  if (response.status !== OK) {
    alert('Story Could not be Published!!! Please retry.');
    return;
  }

  const { blogID } = await response.json();
  window.location = `/blogPage/${blogID}`;
};

const publishBlog = function () {
  const title = articleTitle.innerText;

  if (!title.match(/\S/)) {
    alert('A story without a title does not seem cool right...');
  }

  editor.save().then((data) => {
    publishAndGotoBlog(Object.assign(data, { articleTitle: title }));
  });
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

const gotoDashboard = function () {
  window.location = '/dashboard';
};

const createEditor = function () {
  editor = new EditorJS({
    holder: 'editorjs',
    tools: {
      header: { class: Header, inlineToolbar: true, shortcut: 'CMD+SHIFT+H' },
      list: { class: List, inlineToolbar: true, shortcut: 'CMD+SHIFT+L' },
      Marker: { class: Marker, shortcut: 'CMD+SHIFT+M' },
      delimiter: { class: Delimiter },
      inlineCode: { class: InlineCode },
    },
  });
};

const main = function () {
  createEditor();
  document
    .querySelector('#logo > svg')
    .addEventListener('click', gotoDashboard);
  articleTitle.addEventListener('keypress', handleTitleKeypress);
  articleTitle.addEventListener('keyup', togglePublishedOnTitle);
  publishBtn.addEventListener('click', publishBlog);
};

window.onload = main;
