const userNameAvailable = function () {
  userName.classList.remove('invalid');
  userName.classList.add('valid');
  submitBtn.classList.remove('inactive');
};

const invalidUserName = function () {
  userName.classList.remove('valid');
  userName.classList.add('invalid');
  submitBtn.classList.add('inactive');
};

const checkAvailability = async function (userName) {
  const response = await fetch(`/checkUsername/${userName}`).then((res) =>
    res.json()
  );

  if (response.available) {
    userNameAvailable();
  } else {
    invalidUserName();
  }
};

const validateUserName = function () {
  const username = userName.value.trim();

  if (!username || username.match(/\s/)) {
    invalidUserName();
  } else {
    checkAvailability(username);
  }
};

const main = function () {
  userName.addEventListener('keyup', validateUserName);
  validateUserName();
};

window.onload = main;
