const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const fireRoutes = require("./routes/fire.routes");
const policeRoutes = require("./routes/police.routes");
const trafficRoutes = require("./routes/traffic.routes");
const municipalRoutes = require("./routes/municipal.routes");
const citizenRoutes = require("./routes/citizen.routes");
const coreRoutes = require("./routes/core.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const { errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/fire", fireRoutes);
app.use("/police", policeRoutes);
app.use("/traffic", trafficRoutes);
app.use("/municipal", municipalRoutes);
app.use("/citizen", citizenRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/", coreRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

module.exports = app;
