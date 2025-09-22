const express = require("express");
const { uploadPresentation, uploadAudio } = require("../middleware/upload");
const { transcribeAudio, analyzeScript } = require("../services/aiService");
const {
  createSession,
  getSessionById,
  updateSessionStatus,
} = require("../services/sessionService");

const router = express.Router();

// 기존 자료 업로드
router.post(
  "/:sessionId/upload-material",
  uploadPresentation.single("presentation_file"),
  async (req, res) => {
    try {
      await getSessionById(req.params.sessionId, req.user.userId);

      const result = {
        status: "success",
        page_count: 0,
      };

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

// 음성 업로드 및 분석
router.post(
  "/:sessionId/upload-audio",
  uploadAudio.single("audio_file"),
  async (req, res) => {
    try {
      const session = await getSessionById(
        req.params.sessionId,
        req.user.userId
      );

      if (!req.file) {
        return res.status(400).json({
          status: "error",
          error_code: "NO_AUDIO_FILE",
          message: "음성 파일이 필요합니다",
        });
      }

      // Whisper로 음성 텍스트 변환
      const transcription = await transcribeAudio(req.file.path);

      // 세션에 음성 데이터 저장 (실제로는 데이터베이스에 저장)
      await updateSessionAudioData(session.id, {
        audioFilePath: req.file.path,
        transcription: transcription,
      });

      res.json({
        status: "success",
        transcription: {
          text: transcription.text,
          duration: transcription.duration,
          word_count: transcription.words?.length || 0,
        },
      });
    } catch (error) {
      res.status(400).json({
        status: "error",
        error_code: "AUDIO_PROCESSING_FAILED",
        message: error.message,
      });
    }
  }
);

// 발표 종료 (수정 - 종합 분석 추가)
router.post("/:sessionId/end", async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId, req.user.userId);

    await updateSessionStatus(session.id, "processing");

    // 백그라운드에서 종합 분석 시작
    processComprehensiveAnalysis(session.id);

    res.json({
      status: "session_completed",
      analysis_job_id: `analysis_${session.id}`,
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5분 후
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      error_code: "SESSION_END_FAILED",
      message: error.message,
    });
  }
});

module.exports = router;
