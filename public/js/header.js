const getElement = (selector) => document.querySelector(selector);

const gotoDashboard = () => {
  window.location = '/dashboard';
};

const attachGotoDashboardToLogo = function () {
  Array.from(document.querySelectorAll('#logo  svg'), (el) =>
    el.addEventListener('click', gotoDashboard)
  );
};

const attachHeadListener = function () {
  const $profile = getElement('#profile');
  $profile.addEventListener('click', () => {
    getElement('.profile-modal').classList.toggle('hidden');
  });

  attachGotoDashboardToLogo();

  attachBodyListeners();
};

window.onload = attachHeadListener;
