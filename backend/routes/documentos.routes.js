const express = require("express");
const router = express.Router();

const documentos = require("../data/documentos");

router.get("/", (req, res) => {
  res.json(documentos);
});

module.exports = router;