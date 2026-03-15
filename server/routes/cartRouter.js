const Router = require("express");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middleware/authMiddleware");
const router = new Router();

router.get("/:userId", authMiddleware, cartController.getCartDevicesByUserId);
router.patch("/:userId/add", authMiddleware, cartController.addToCart);
router.patch("/:userId/remove", authMiddleware, cartController.removeFromCart);
router.delete("/:userId", authMiddleware, cartController.clearCart);

module.exports = router;
