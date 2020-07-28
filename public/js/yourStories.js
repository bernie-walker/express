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

window.onload = () => {
  attachHeadListener();
  attachOptionListeners();
};
