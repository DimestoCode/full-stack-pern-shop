const fs = require("fs");
const { Device, DeviceInfo } = require("../models/models");
const ApiError = require("../error/errorHandler");
const path = require("path");
const uuid = require("uuid");

class DeviceController {
  async create(req, res, next) {
    try {
      const { name, price, brandId, typeId, info } = req.body;
      const img = req.files?.img;
      if (!img) {
        return next(ApiError.badRequest("Image file is required"));
      }

      let imageBuffer = img.data ?? img.buffer;
      if (!Buffer.isBuffer(imageBuffer) && img.tempFilePath) {
        imageBuffer = fs.readFileSync(img.tempFilePath);
      }
      if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        return next(ApiError.badRequest("Invalid image upload"));
      }

      const ext = (img.name && path.extname(img.name)) || ".jpg";
      const fileName = uuid.v4() + ext;
      const staticDir = path.resolve(__dirname, "..", "static");
      fs.mkdirSync(staticDir, { recursive: true });
      fs.writeFileSync(path.join(staticDir, fileName), imageBuffer);

      const device = await Device.create({
        name,
        price,
        brandId,
        typeId,
        img: fileName,
      });

      if (info) {
        info = JSON.parse(info);
        info.forEach(async (i) => {
          DeviceInfo.create({
            title: i.title,
            description: i.description,
            deviceId: device.id,
          });
        });
      }

      const created = await Device.findByPk(device.id, {
        include: [{ model: DeviceInfo, as: "info" }],
      });
      return res.json(created);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    let { brandId, typeId, limit = 9, page = 1 } = req.query;

    let offset = page * limit - limit;
    let devices;

    const listOpts = { limit, offset };

    if (!brandId && !typeId) {
      devices = await Device.findAndCountAll(listOpts);
    }

    if (brandId && !typeId) {
      devices = await Device.findAndCountAll({
        ...listOpts,
        where: { brandId },
      });
    }
    if (typeId && !brandId) {
      devices = await Device.findAndCountAll({
        ...listOpts,
        where: { typeId },
      });
    }

    if (brandId && typeId) {
      devices = await Device.findAndCountAll({
        ...listOpts,
        where: { brandId, typeId },
      });
    }

    return res.json(devices);
  }
  async getOne(req, res) {
    const { id } = req.params;

    const device = await Device.findOne({
      where: { id },
      include: [{ model: DeviceInfo, as: "info" }],
    });

    return res.json(device);
  }
}
module.exports = new DeviceController();
