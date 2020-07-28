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

const getEditorContent = async function () {
  const storyTitle = articleTitle.innerText;
  const storyID = articleTitle.getAttribute('storyid');

  const content = await editor.save();
  return Object.assign(content, {
    storyTitle,
    storyID,
  });
};

const saveDraft = async function () {
  saveConfirmation.innerText = 'Draft Saving...';

  const editorContent = await getEditorContent();
  const response = await updateStory('/saveStory', editorContent);

  if (response.ok) {
    confirmSaveAndClearMessage();
  } else {
    alert('Story could not be saved!!!');
  }
};

const publishAndGotoBlog = async function (editorContent) {
  const response = await updateStory('/publishStory', editorContent);

  if (!response.ok) {
    alert('Story Could not be Published!!! Please retry.');
    return;
  }

  window.location = response.url;
};

const publishBlog = async function () {
  const editorContent = await getEditorContent();

  if (!editorContent.storyTitle.trim()) {
    alert('A story without a title does not seem cool right...');
    return;
  }

  publishAndGotoBlog(editorContent);
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
