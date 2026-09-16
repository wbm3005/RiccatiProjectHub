const express = require("express");
const router = express.Router();

const pagos = require("../data/pagos");

router.get("/", (req, res) => {
  res.json(pagos);
});

module.exports = router;