const showList = function (toShow, toHide) {
  getElement(`#${toShow}List`).classList.remove('hidden');
  getElement(`#${toHide}List`).classList.add('hidden');

  getElement(`#${toShow}`).classList.add('active');
  getElement(`#${toHide}`).classList.remove('active');
};

const attachOptionListeners = function () {
  drafts.addEventListener('click', function () {
    showList('drafts', 'published');
  });
  published.addEventListener('click', function () {
    showList('published', 'drafts');
  });
};

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
  attachOptionListeners();
};
