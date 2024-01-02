const { Router } = require("express");
const { progressEmit } = require('../controllers/progress');

const router = Router();

router.get("/progress", progressEmit);

module.exports = router;
