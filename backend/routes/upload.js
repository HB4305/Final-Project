const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

router.post("/", upload.single("file"), (req, res) => {
  res.json({
    location: `http://localhost:3000/uploads/${req.file.filename}`
  });
});

module.exports = router;
