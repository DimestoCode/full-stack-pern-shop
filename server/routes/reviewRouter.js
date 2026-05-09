const Router = require("express");
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");
const router = new Router();

router.post("/:deviceId", authMiddleware, reviewController.create);
router.get("/:deviceId", reviewController.getDeviceReviewData);

module.exports = router;
