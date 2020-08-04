const getElement = (selector) => document.querySelector(selector);

const gotoHome = () => {
  window.location = '/';
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

const attachProfileIconListeners = function () {
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

const attachSignOutListener = function () {
  const $confirmationBox = getElement('.sign-out-confirmation');
  signOut.addEventListener('click', () => {
    $confirmationBox.classList.add('open');
    getElement('body').classList.add('blur');
  });
  cancel.addEventListener('click', () => {
    $confirmationBox.classList.remove('open');
    getElement('body').classList.remove('blur');
  });
};

const attachHeadListener = function () {
  attachGotoDashboardToLogo();
  const profile = getElement('#profile');

  if (!profile) {
    attachSignInListeners();
    return;
  }

  attachProfileIconListeners();
  attachSignOutListener();
};
