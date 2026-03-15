const Router = require("express");
const ratingController = require("../controllers/ratingController");
const authMiddleware = require("../middleware/authMiddleware");
const router = new Router();

router.post("/", authMiddleware, ratingController.create);
router.get(
  "/:deviceId",
  authMiddleware,
  ratingController.getAverageRatingPerDevice
);

module.exports = router;
