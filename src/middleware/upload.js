const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 업로드 디렉토리 확인 및 생성
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 발표자료 업로드
const presentationStorage = multer.diskStorage({
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

// 음성 업로드
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.env.AUDIO_UPLOAD_PATH);
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const sessionId = req.params.sessionId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${sessionId}_${timestamp}${ext}`);
  },
});

const audioFileFilter = (req, file, cb) => {
  const allowedTypes = [".mp3", ".wav", ".m4a", ".webm"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("지원하지 않는 오디오 형식입니다"), false);
  }
};

// 발표자료 업로드
const uploadPresentation = multer({
  storage: presentationStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".ppt", ".pptx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  },
});

// 음성 업로드
const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: parseInt(process.env.AUDIO_MAX_SIZE) || 104857600 }, // 100MB
  fileFilter: audioFileFilter,
});

module.exports = {
  uploadPresentation,
  uploadAudio,
};
