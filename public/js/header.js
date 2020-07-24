const getElement = (selector) => document.querySelector(selector);

const main = function () {
  const $profile = getElement('#profile');
  $profile.addEventListener('click', () => {
    getElement('.profile-modal').classList.toggle('hidden');
  });
};

window.onload = main;
