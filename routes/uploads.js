const { Router } = require("express");
const { uploadFile, getFile } = require('../controllers/uploads');

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get('/uploads/:id', getFile);

module.exports = router;
