let editor;

const confirmSaveAndClearMessage = function () {
  setTimeout(() => {
    saveConfirmation.innerText = 'Draft Saved';
  }, 2000);
  setTimeout(() => {
    saveConfirmation.innerText = 'Draft';
  }, 3500);
};

const updateStory = function (url, story) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(story),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const saveDraft = async function () {
  saveConfirmation.innerText = 'Draft Saving...';
  const title = articleTitle.innerText;
  const storyID = articleTitle.getAttribute('storyid');

  const data = await editor.save();
  const draft = Object.assign(data, {
    articleTitle: title,
    storyID,
  });

  const response = await updateStory('/saveStory', draft);
  confirmSaveAndClearMessage();
};

const publishAndGotoBlog = async function (story) {
  const response = await updateStory('/publishStory', story);

  if (!response.ok) {
    alert('Story Could not be Published!!! Please retry.');
    return;
  }

  const { blogID } = await response.json();
  window.location = `/blogPage/${blogID}`;
};

const publishBlog = function () {
  const title = articleTitle.innerText.trim();

  if (!title) {
    alert('A story without a title does not seem cool right...');
  }

  editor.save().then((data) => {
    publishAndGotoBlog(Object.assign(data, { articleTitle: title }));
  });
};

const togglePublishedOnTitle = function () {
  if (articleTitle.innerText.trim()) {
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

const createEditor = async function () {
  const content = JSON.parse(localStorage.getItem('storyContent'));
  editor = new EditorJS({
    holder: 'editorjs',
    tools: {
      header: { class: Header, inlineToolbar: true, shortcut: 'CMD+SHIFT+H' },
      list: { class: List, inlineToolbar: true, shortcut: 'CMD+SHIFT+L' },
      Marker: { class: Marker, shortcut: 'CMD+SHIFT+M' },
      delimiter: { class: Delimiter },
      inlineCode: { class: InlineCode, shortcut: 'OPTION+CMD+SHIFT+C' },
    },
    data: { blocks: content },
  });
  togglePublishedOnTitle();
};

const main = function () {
  document
    .querySelector('#logo > svg')
    .addEventListener('click', gotoDashboard);
  articleTitle.addEventListener('keypress', handleTitleKeypress);
  articleTitle.addEventListener('keyup', togglePublishedOnTitle);
  publishBtn.addEventListener('click', publishBlog);
  saveAsDraft.addEventListener('click', saveDraft);
  createEditor();
};

window.onload = main;
