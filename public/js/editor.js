let editor;
const getAllElements = (selector) => document.querySelectorAll(selector);

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

let isReadyToSave = true;

const saveDraft = async function () {
  if (!articleTitle.innerText.trim() || !isReadyToSave) {
    return;
  }

  saveConfirmation.innerText = 'Draft Saving...';
  isReadyToSave = false;
  setTimeout(async () => {
    const editorContent = await getEditorContent();
    const response = await updateStory('/saveStory', editorContent);
    if (response.ok) {
      saveConfirmation.innerText = 'Draft Saved';
    }
    isReadyToSave = true;
  }, 3000);
};

const saveAndPublish = async function () {
  const editorContent = await getEditorContent();
  const response = await updateStory('/saveStory', editorContent);

  if (response.ok) {
    window.location = `/blogPage/${editorContent.storyID}`;
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
  const $button = getAllElements('.story-actions .btn')[0];
  if (articleTitle.innerText.trim()) {
    $button.classList.remove('inactive');
  } else {
    $button.classList.add('inactive');
  }
};

const handleTitleKeypress = function () {
  if (event.key === 'Enter') {
    document.querySelector('#editorjs div[contenteditable=true]').focus();
  }
  togglePublishedOnTitle();
};

const createEditor = async function () {
  const storyID = articleTitle.getAttribute('storyid');
  const content = JSON.parse(localStorage.getItem('storyContent'));
  editor = new EditorJS({
    holder: 'editorjs',
    tools: {
      header: { class: Header, inlineToolbar: true, shortcut: 'CMD+SHIFT+H' },
      list: { class: List, inlineToolbar: true, shortcut: 'CMD+SHIFT+L' },
      Marker: { class: Marker, shortcut: 'CMD+SHIFT+M' },
      delimiter: { class: Delimiter },
      inlineCode: { class: InlineCode, shortcut: 'OPTION+CMD+SHIFT+C' },
      image: {
        class: ImageTool,
        config: {
          endpoints: { byFile: `http://localhost:3000/uploadImage/${storyID}` },
        },
        shortcut: 'CMD+SHIFT+I',
      },
    },
    data: { blocks: content },
  });
  getElement('#publishBtn') && togglePublishedOnTitle();
};

const openPopUp = function () {
  getElement('.modal-container').classList.remove('hidden');
};

const closePopUp = function () {
  getElement('.modal-container').classList.add('hidden');
};

const removeTagListener = function () {
  getElement('.tags').addEventListener('click', (event) => {
    if (event.target.className === 'cross') {
      event.target.parentElement.remove();
    }
    if (getElement('.tags').childElementCount < 5) {
      tagInput.removeAttribute('disabled');
    }
  });
};

const addTag = function () {
  getElement('.tags').innerHTML += `<div class="tagBox">
      <div class="tag">${tagInput.value.trim()}</div>
      <div class="cross">&#215;</div>
    </div>`;
  tagInput.value = '';
};

const disableInput = function () {
  if (getElement('.tags').childElementCount >= 5) {
    tagInput.setAttribute('disabled', true);
  }
};

const attachTagListener = function () {
  tagInput.addEventListener('keypress', (event) => {
    event.key === 'Enter' && addTag();
    disableInput();
  });

  disableInput();
  removeTagListener();
  closeBtn.addEventListener('click', closePopUp);
};

const attachSaveOrPublishStory = function () {
  if (publishBtn.innerText === 'Publish') {
    editorjs.addEventListener('keyup', saveDraft);
    articleTitle.addEventListener('keyup', saveDraft);
  }
  publishBtn.addEventListener('click', openPopUp);
  const $publishNowBtn = getElement('#publishNowBtn');
  $publishNowBtn && $publishNowBtn.addEventListener('click', publishBlog);
};

const main = function () {
  attachHeadListener();
  articleTitle.addEventListener('keypress', handleTitleKeypress);
  articleTitle.addEventListener('keyup', togglePublishedOnTitle);
  createEditor();
  attachSaveOrPublishStory();
  attachTagListener();
};

window.onload = main;
