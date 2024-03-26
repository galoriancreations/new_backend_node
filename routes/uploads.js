const { Router } = require("express");
const { uploadFile, getFile } = require("../controllers/uploads");
const auth = require("../middleware/auth");

const router = Router();

router.post("/", uploadFile);//need auth
// router.post("/", auth, uploadFile);
router.get("/:id", getFile);

module.exports = router;
