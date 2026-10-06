const multer = require("multer");
const storage = multer.memoryStorage(); // salva no buffer
const upload = multer({ storage });

module.exports = upload;