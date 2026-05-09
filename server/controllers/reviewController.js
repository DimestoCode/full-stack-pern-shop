const { Review, User } = require("../models/models");
const { Sequelize } = require("sequelize");
const ErrorHandler = require("../error/errorHandler");

class ReviewController {
  async create(req, res, next) {
    try {
      const deviceId = Number(req.params.deviceId);
      const { rate, review } = req.body;
      const userId = req.user?.id;

      if (
        !Number.isFinite(deviceId) ||
        !userId ||
        rate == null ||
        typeof review !== "string" ||
        !review.trim()
      ) {
        return next(ErrorHandler.badRequest("Required fields are missing"));
      }

      const r = Number(rate);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return next(ErrorHandler.badRequest("Rate must be an integer from 1 to 5"));
      }

      const row = await Review.create({
        deviceId,
        rate: r,
        userId,
        review: review.trim(),
      });
      return res.json(row);
    } catch (e) {
      return next(ErrorHandler.internal(e.message));
    }
  }

  async getDeviceReviewData(req, res, next) {
    const deviceId = Number(req.params.deviceId);

    if (!Number.isFinite(deviceId)) {
      return next(ErrorHandler.badRequest("Device ID is required"));
    }

    try {
      const [avgRow, deviceReviews] = await Promise.all([
        Review.findOne({
          where: { deviceId },
          attributes: [
            [Sequelize.fn("AVG", Sequelize.col("rate")), "averageRating"],
          ],
          raw: true,
        }),
        Review.findAll({
          where: { deviceId },
          limit: 50,
          order: [["createdAt", "DESC"]],
          include: [{ model: User, attributes: ["id", "email"] }],
        }),
      ]);

      const averageRating =
        avgRow?.averageRating != null
          ? Number.parseFloat(String(avgRow.averageRating))
          : null;

      return res.json({
        averageRating: Number.isFinite(averageRating) ? averageRating : null,
        deviceReviews,
      });
    } catch (e) {
      return next(ErrorHandler.internal(e.message));
    }
  }
}

module.exports = new ReviewController();
