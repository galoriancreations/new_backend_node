const { Router } = require("express");
const { uploadFile, getFile } = require('../controllers/uploads');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

router.post("/", upload.single("file"), uploadFile);
router.get('/:id', getFile);

module.exports = router;
