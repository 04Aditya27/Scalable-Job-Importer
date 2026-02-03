const express = require("express");
const router = express.Router();

const importLogsController = require("../controllers/importLogs.controller");

router.get("/", importLogsController.getImportLogs);

module.exports = router;
