const express = require("express");
const router = express.Router();

const actividades = require("../data/actividades");

router.get("/", (req, res) => {
  res.json(actividades);
});

module.exports = router;