require("dotenv").config(); 
const express = require("express");
const cors = require("cors");
const itineraryRoutes = require("./routes/itinerary_route");

const app = express();

app.use(cors());  // IMPORTANT
app.use(express.json());

app.use("/api/itinerary", itineraryRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});