const openStory = function () {
  window.location = this.getAttribute('target_url');
};

const attachCardListeners = function () {
  Array.from(document.querySelectorAll('.card'), (card) =>
    card.addEventListener('click', openStory)
  );
};

window.onload = () => {
  attachHeadListener();
  attachCardListeners();
};
