class Header {
  constructor({ data }) {
    this.data = data;
  }
  render() {
    const div = document.createElement('div');
    div.classList.add('title');
    div.contentEditable = true;
    this.data.text && (div.innerText = this.data.text);
    return div;
  }
  save(blockContent) {
    return { text: blockContent.innerText };
  }
}
