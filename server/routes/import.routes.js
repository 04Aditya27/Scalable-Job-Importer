const express = require("express");
const router = express.Router();

const importController = require("../controllers/import.controller");

router.post("/run", importController.runImport);

module.exports = router;
