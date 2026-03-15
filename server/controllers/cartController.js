const { Cart, CartDevice } = require("../models/models");
const ErrorHandler = require("../error/errorHandler");
class CartController {
  async getCartDevicesByUserId(req, res, next) {
    const { userId } = req.params;
    if (!userId) {
      return next(ErrorHandler.badRequest("User ID is required"));
    }
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return next(ErrorHandler.badRequest("Cart not found"));
    }
    const cartDevices = await CartDevice.findAll({
      where: { cartId: cart.id },
    });
    return res.json(cartDevices);
  }

  async addToCart(req, res, next) {
    const { userId } = req.params;
    const { deviceId } = req.body;
    if (!userId || !deviceId) {
      return next(ErrorHandler.badRequest("Required fields are missing"));
    }
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return next(ErrorHandler.badRequest("Cart not found"));
    }
    const cartDevice = await CartDevice.create({ cartId: cart.id, deviceId });
    return res.json(cartDevice);
  }

  async removeFromCart(req, res, next) {
    const { userId } = req.params;
    const { deviceId } = req.body;
    if (!userId || !deviceId) {
      return next(ErrorHandler.badRequest("Required fields are missing"));
    }
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return next(ErrorHandler.badRequest("Cart not found"));
    }
    const cartDevice = await CartDevice.findOne({
      where: { cartId: cart.id, deviceId },
    });
    if (!cartDevice) {
      return next(ErrorHandler.badRequest("Device not found in cart"));
    }
    await cartDevice.destroy();
    return res.json({ message: "Device removed from cart" });
  }

  async clearCart(req, res, next) {
    const { userId } = req.params;
    if (!userId) {
      return next(ErrorHandler.badRequest("User ID is required"));
    }
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return next(ErrorHandler.badRequest("Cart not found"));
    }
    await cart.destroy();
    return res.json({ message: "Cart cleared" });
  }
}
module.exports = new CartController();
