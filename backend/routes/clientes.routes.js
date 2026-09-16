const express = require("express");
const router = express.Router();

const clientes = require("../data/clientes");

router.get("/", (req, res) => {
  res.json(clientes);
});

module.exports = router;