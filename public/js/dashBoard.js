const visitBlogPage = function (blogId) {
  window.location = `/blogPage/${blogId}`;
};

const attachBodyListeners = function () {
  Array.from(document.querySelectorAll('.card'), (card) =>
    card.addEventListener('click', visitBlogPage.bind(null, card.id))
  );
};

window.onload = () => {
  attachHeadListener();
  attachBodyListeners();
};
