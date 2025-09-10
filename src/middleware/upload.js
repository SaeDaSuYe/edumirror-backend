const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 디렉토리 확인 및 생성
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.UPLOAD_PATH, "presentations");
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sessionId = req.params.sessionId;
    const ext = path.extname(file.originalname);
    cb(null, `${sessionId}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".ppt", ".pptx"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("지원하지 않는 파일 형식입니다"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
  },
  fileFilter,
});

module.exports = upload;
