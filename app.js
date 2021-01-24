const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

const paymentRoute = require("./paymentRoute");

const port = 5000;
app.use(cors());
app.use(bodyParser.json());
app.use("/api", paymentRoute);

app.listen(port, () => {
    console.log("App is running at ", port);
});
