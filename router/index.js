const express = require('express');
const router = express.Router();
const indexController = require("../controller/index");

router.get("/", (req, res) => {
    res.send("Hello world!").status(200);
});

router.post("/get-number-of-incoming-messages", indexController.getNumberOfIncomingMessages);

module.exports = router;
