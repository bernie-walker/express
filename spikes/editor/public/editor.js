const editor = new EditorJS({
  holder: 'editorjs',
  tools: {
    list: { class: List, shortcut: 'CMD+SHIFT+L' },
    image: {
      class: ImageTool,
      config: {
        endpoints: { byFile: 'http://localhost:3000/uploadImage' },
      },
      shortcut: 'CMD+SHIFT+I',
    },
  },
});
const saveButton = document.getElementById('save-button');
const output = document.getElementById('output');
saveButton.addEventListener('click', () => {
  editor.save().then((savedData) => {
    output.innerHTML = JSON.stringify(savedData, null, 4);
    const title = document.querySelector('.title').innerText;
    output.innerHTML = title + output.innerHTML;
  });
});
