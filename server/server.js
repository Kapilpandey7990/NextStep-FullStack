const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });

const connectDB = require("./config/db");
const situationRoutes = require("./routes/situationRoutes");

const app = express();

connectDB();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/situations", situationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "NextStep backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});