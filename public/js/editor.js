let editor;

const createEditor = function () {
  editor = new EditorJS({
    holder: 'editorjs',
  });
};

const main = function () {
  createEditor();
};

window.onload = main;
