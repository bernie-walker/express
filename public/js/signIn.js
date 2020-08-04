const hideSignInPopup = () => backCover.classList.add('hidden-cover');

const hideSigInIfEsc = function () {
  if (event.key === 'Escape') {
    hideSignInPopup();
  }
};

const hideIfTargetIsCover = function () {
  if (event.target === event.currentTarget) {
    hideSignInPopup();
  }
};

const showSignInPopup = () => backCover.classList.remove('hidden-cover');

const attachSignInListeners = function () {
  signIn.addEventListener('click', showSignInPopup);
  closeIcon.addEventListener('click', hideSignInPopup);
  backCover.addEventListener('click', hideIfTargetIsCover);
  document.querySelector('body').addEventListener('keydown', hideSigInIfEsc);
};
