const getElement = (selector) => document.querySelector(selector);

const gotoHome = () => {
  const homeLocation = getElement('#profile') ? '/dashboard' : '/';
  window.location = homeLocation;
};

const attachGotoDashboardToLogo = function () {
  Array.from(document.querySelectorAll('#logo  svg'), (el) =>
    el.addEventListener('click', gotoHome)
  );
};

const attachToGoToProfile = function () {
  const $userName = getElement('#username');
  const userID = $userName.innerText;
  $userName.addEventListener('click', () => {
    window.location = `/profile/${userID}`;
  });
};

const attachHeadListener = function () {
  attachGotoDashboardToLogo();
  const profile = getElement('#profile');

  if (!profile) {
    return;
  }

  profile.addEventListener('click', () => {
    getElement('.profile-modal').classList.toggle('hidden');
  });

  getElement('body').addEventListener('click', (event) => {
    if (!event.target.id) {
      getElement('.profile-modal').classList.add('hidden');
    }
  });

  attachToGoToProfile();
};
