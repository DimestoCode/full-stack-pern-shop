const ErrorHandler = require("../error/errorHandler");
const { User, Cart } = require("../models/models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

generateJwt = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.SECRET_KEY, {
    expiresIn: "24h",
  });
};

class UserController {
  async registration(req, res, next) {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return next(ErrorHandler.badRequest("Email or password is invalid"));
    }

    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return next(ErrorHandler.badRequest("Such user already exists"));
    }

    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({ email, password: hashPassword, role });
    const cart = await Cart.create({ userId: user.id });
    const token = generateJwt(user.id, user.email, user.role);

    return res.json({ token });
  }

  async login(req, res, next) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(ErrorHandler.badRequest("User not found"));
    }

    const comparePassword = await bcrypt.compare(password, user.password);
    if (!comparePassword) {
      return next(ErrorHandler.badRequest("Password is incorrect"));
    }

    const token = generateJwt(user.id, user.email, user.role);
    return res.json({ token });
  }

  async checkAuth(req, res, next) {
    const { id } = req.query;
    if (!id) {
      return next(ErrorHandler.badRequest("User ID is required"));
    }

    res.json(id);
  }
}

module.exports = new UserController();
