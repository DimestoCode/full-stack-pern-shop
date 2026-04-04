require("dotenv").config();
const express = require("express");
const sequelize = require("./db");
const models = require("./models/models");
const cors = require("cors");
const router = require("./routes/index");
const errorMiddleware = require("./middleware/errorMiddleware");
const fileUpload = require("express-fileupload");
const path = require("path");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/static", express.static(path.resolve(__dirname, "static")));
app.use(fileUpload({}));
app.use("/api", router);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

const startDB = async () => {
  try {
    await sequelize.authenticate();
    // Allow ALTER … SET NOT NULL on img after migrating away from null img / BYTEA
    await sequelize
      .query(
        `UPDATE "devices" SET "img" = '_placeholder.jpg' WHERE "img" IS NULL`,
      )
      .catch(() => {});
    await sequelize.sync({ alter: true });
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startDB();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
