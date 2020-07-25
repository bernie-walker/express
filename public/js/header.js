const getElement = (selector) => document.querySelector(selector);

const attachHeadListener = function () {
  const $profile = getElement('#profile');
  $profile.addEventListener('click', () => {
    getElement('.profile-modal').classList.toggle('hidden');
  });

  logo.onclick = () => {
    window.location = '/dashboard';
  };

  attachBodyListeners();
};

window.onload = attachHeadListener;
