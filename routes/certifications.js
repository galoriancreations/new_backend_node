const { Router } = require("express");

const auth = require("../middleware/auth");
const { sendCertification } = require('../controllers/certifications');

const router = Router();

router.use(auth);

router.post("/send", sendCertification);

module.exports = router;
