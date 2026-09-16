const express = require("express");
const router = express.Router();

const proyectos = require("../data/proyectos");

router.get("/", (req, res) => {
  res.json(proyectos);
});

module.exports = router;