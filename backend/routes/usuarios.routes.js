const express = require("express");
const router = express.Router();

const usuarios = require("../data/usuarios");

router.get("/", (req, res) => {
  res.json(usuarios);
});

module.exports = router;