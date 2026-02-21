const ErrorHandler = require("../error/errorHandler");

module.exports = function (err, req, res, next) {
  console.log(err);
  if (err instanceof ErrorHandler) {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Unexpected error" });
};
