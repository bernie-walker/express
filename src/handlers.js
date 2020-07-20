const logRequest = function (req, res, next) {
  process.stdout.write(`${req.method} ${req.url}`);
  next();
};

module.exports = { logRequest };
