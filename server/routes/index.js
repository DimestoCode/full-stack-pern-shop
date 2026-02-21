const Router = require("express");
const router = new Router();

router.use("/user", require("./userRouter"));
router.use("/device", require("./deviceRouter"));
router.use("/brand", require("./brandRouter"));
router.use("/type", require("./typeRouter"));

module.exports = router;
