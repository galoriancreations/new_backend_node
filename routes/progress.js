const { Router } = require("express");
const { progressEmit } = require('../controllers/progress');

const router = Router();

router.get("/", progressEmit);

module.exports = router;
