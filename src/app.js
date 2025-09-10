//기본 서버 구조 생성-메인 앱 파일 생성
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

// 미들웨어
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000", // 로컬 개발
      "http://localhost:5173", // Vite 기본 포트
      "https://edumirror-frontend.vercel.app", // 배포된 프론트엔드
    ],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get("/", (req, res) => {
  res.json({ message: "에듀미러 API 서버가 실행중입니다." });
});

// 정적 파일 제공
app.use("/api/docs", express.static(path.join(__dirname, "..", "docs")));

// 라우트 (추후 추가)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/my', require('./routes/user'));

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    error_code: "INTERNAL_ERROR",
    message: "내부 서버 오류가 발생했습니다.",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT}에서 실행중입니다.`);
});
