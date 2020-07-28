const showList = function (toShow, toHide) {
  const showingDiv = document.getElementById(toShow).classList.remove('hidden');
  const hiddenDiv = document.getElementById(toHide).classList.add('hidden');
};

const attachOptionListeners = function () {
  Drafts.addEventListener('click', function () {
    document.getElementById('Drafts').style['border-bottom'] =
      '1.5px solid black';
    document.getElementById('Published').style['border-bottom'] = '0';
    showList('DraftsList', 'PublishedList');
  });
  Published.addEventListener('click', function () {
    document.getElementById('Drafts').style['border-bottom'] = '0';
    document.getElementById('Published').style['border-bottom'] =
      '1.5px solid black';
    showList('PublishedList', 'DraftsList');
  });
};

const visitBlogPage = function (blogId) {
  window.location = `/blogPage/${blogId}`;
};

const attachCardListeners = function () {
  Array.from(document.querySelectorAll('.card'), (card) =>
    card.addEventListener('click', visitBlogPage.bind(null, card.id))
  );
};

window.onload = () => {
  attachHeadListener();
  attachCardListeners();
  attachOptionListeners();
};
