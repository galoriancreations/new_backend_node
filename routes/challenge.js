const { Router } = require("express");
const auth = require("../middleware/auth");
const { createChallenge } = require('../controllers/challenge');


const router = Router();

router.post("/", auth, createChallenge)

module.exports = router;