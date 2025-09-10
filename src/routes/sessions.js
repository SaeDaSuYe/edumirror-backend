const express = require("express");
const upload = require("../middleware/upload");
const {
  createSession,
  getSessionById,
  updateSessionStatus,
} = require("../services/sessionService");
const { analyzeScript } = require("../services/aiService");

const router = express.Router();

// 세션 생성
router.post("/create", async (req, res) => {
  try {
    const result = await createSession(req.user.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      status: "error",
      error_code: "SESSION_CREATE_FAILED",
      message: error.message,
    });
  }
});

// 자료 업로드
router.post(
  "/:sessionId/upload-material",
  upload.single("presentation_file"),
  async (req, res) => {
    try {
      // 세션 소유권 확인
      await getSessionById(req.params.sessionId, req.user.userId);

      const result = {
        status: "success",
        page_count: 0, // PDF 페이지 수 분석 로직 추가 필요
      };

      // 대본이 있으면 AI 분석
      if (req.body.script_text) {
        const scriptAnalysis = await analyzeScript(req.body.script_text);
        result.script_analysis = scriptAnalysis;
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({
        status: "error",
        error_code: "UPLOAD_FAILED",
        message: error.message,
      });
    }
  }
);

// 발표 시작
router.post("/:sessionId/start", async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId, req.user.userId);

    // 세션 상태를 active로 변경
    await updateSessionStatus(session.id, "active");

    // AI 질문 생성 (추후 구현)
    const aiQuestions = [];

    res.json({
      status: "recording_started",
      recording_id: `rec_${Date.now()}`,
      ai_questions: aiQuestions,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error_code: "SESSION_START_FAILED",
      message: error.message,
    });
  }
});

// 발표 종료
router.post("/:sessionId/end", async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId, req.user.userId);

    // 세션 상태를 completed로 변경
    await updateSessionStatus(session.id, "completed");

    // 백그라운드 분석 시작
    // processAnalysisInBackground(session.id);

    res.json({
      status: "session_completed",
      analysis_job_id: `analysis_${session.id}`,
      estimated_completion: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error_code: "SESSION_END_FAILED",
      message: error.message,
    });
  }
});

// 분석 상태 확인
router.get("/:sessionId/analysis-status", async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId, req.user.userId);

    res.json({
      session_id: session.id,
      status: session.status,
      progress: session.status === "completed" ? 100 : 0,
      result_available: session.status === "completed",
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      error_code: "SESSION_NOT_FOUND",
      message: error.message,
    });
  }
});

// 분석 결과 조회
router.get("/:sessionId/analysis", async (req, res) => {
  try {
    const { getAnalysisResult } = require("../services/analysisService");
    const result = await getAnalysisResult(
      req.params.sessionId,
      req.user.userId
    );
    res.json(result);
  } catch (error) {
    res.status(404).json({
      status: "error",
      error_code: "ANALYSIS_NOT_FOUND",
      message: error.message,
    });
  }
});

// 개선 제안 조회
router.get("/:sessionId/suggestions", async (req, res) => {
  try {
    // 임시 제안 데이터
    const suggestions = {
      priority_improvements: [
        {
          category: "speech_pace",
          severity: "medium",
          description: "발표 속도가 다소 빨랐습니다",
          specific_feedback: "2분 30초~4분 구간에서 속도 조절이 필요합니다",
          improvement_tip: "중요한 내용 앞에서 잠시 멈춤을 활용해보세요",
        },
      ],
      next_practice_recommendation: {
        focus_area: "speech_pace",
        recommended_theme: "informative",
        practice_duration: 5,
      },
    };

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error_code: "SUGGESTIONS_FAILED",
      message: error.message,
    });
  }
});

module.exports = router;
