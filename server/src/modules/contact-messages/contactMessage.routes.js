const express = require("express");
const router = express.Router();
const contactController = require("./contactMessage.controller");

// This file is used for both public and admin routes depending on where it's mounted in app.js
router.post("/", contactController.createMessage);
router.get("/", contactController.getMessages);

module.exports = router;
