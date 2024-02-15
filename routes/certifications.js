const { Router } = require("express");

const auth = require("../middleware/auth");
const {
  sendCertification,
  getCertifications,
  getCertificationById
} = require("../controllers/certifications");

const router = Router();

router.use(auth);

router.post("/send", sendCertification);
router.get("/type/:type", getCertifications);
router.get("/:id", getCertificationById);

module.exports = router;
