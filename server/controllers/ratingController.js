const { Rating } = require("../models/models");
const { Sequelize } = require("sequelize");

class RatingController {
  async create(req, res, next) {
    const { deviceId, rate, userId } = req.body;
    if (!deviceId || !rate || !userId) {
      return next(ErrorHandler.badRequest("Required fields are missing"));
    }

    const rating = await Rating.create({ deviceId, rate, userId });
    return res.json(rating);
  }

  async getAverageRatingPerDevice(req, res) {
    const { deviceId } = req.params;

    if (!deviceId) {
      return next(ErrorHandler.badRequest("Device ID is required"));
    }

    const result = await Rating.findOne({
      where: { deviceId },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("rate")), "averageRating"],
      ],
      raw: true,
    });
    return res.json(result?.averageRating || 0);
  }
}

module.exports = new RatingController();
