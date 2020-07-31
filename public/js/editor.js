let editor;
const getAllElements = (selector) => document.querySelectorAll(selector);

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

const getAllTags = function () {
  const $tags = Array.from(getAllElements('.tags .tag'));
  return $tags.reduce((tags, $tag) => {
    const tag = $tag.innerText;
    tag && tags.push(tag);
    return tags;
  }, []);
};

const getEditorContent = async function () {
  const storyTitle = articleTitle.innerText;
  const storyID = articleTitle.getAttribute('storyid');

  const content = await editor.save();
  const tags = getAllTags();

  return Object.assign(content, { storyTitle, storyID, tags });
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
      image: { class: ImageTool, shortcut: 'CMD+SHIFT+I' },
    },
    data: { blocks: content },
  });
  togglePublishedOnTitle();
};

const openPopUp = function () {
  getElement('.modal-container').classList.remove('hidden');
};

const closePopUp = function () {
  getElement('.modal-container').classList.add('hidden');
};

const removeTagListener = function () {
  const $allTags = Array.from(getAllElements('.cross'));
  $allTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      tag.parentElement.classList.add('hidden');
      tag.parentElement.firstChild.innerText = '';
    });
  });
};

const addTag = function () {
  const $tagBox = getElement('.tags .hidden');
  const tagValue = tagInput.innerText.trim();
  tagInput.innerText = '';
  $tagBox.querySelector('.tag').innerText = tagValue;
  $tagBox.classList.remove('hidden');
};

const attachTagListener = function () {
  tagInput.addEventListener('keypress', (event) => {
    event.key === 'Enter' && addTag();
    const isTagBoxAvailable = getElement('.tags .hidden');
    !isTagBoxAvailable && (tagInput.style.display = 'none');
  });
  removeTagListener();
};

const main = function () {
  attachHeadListener();
  articleTitle.addEventListener('keypress', handleTitleKeypress);
  articleTitle.addEventListener('keyup', togglePublishedOnTitle);
  publishBtn.addEventListener('click', openPopUp);
  closeBtn.addEventListener('click', closePopUp);
  const $saveAsDraft = getElement('#saveAsDraft');
  $saveAsDraft && $saveAsDraft.addEventListener('click', saveDraft);
  createEditor();
  attachTagListener();
  publishNowBtn.addEventListener('click', publishBlog);
};

window.onload = main;
