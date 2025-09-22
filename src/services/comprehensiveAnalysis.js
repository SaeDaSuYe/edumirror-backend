const { analyzePresentation } = require("./aiService");
const { saveAnalysisResult } = require("./analysisService");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const processComprehensiveAnalysis = async (sessionId) => {
  try {
    console.log(`Starting comprehensive analysis for session ${sessionId}`);

    // 1. 세션 데이터 수집
    const sessionData = await collectSessionData(sessionId);

    // 2. Gemini로 종합 분석
    const analysisResult = await analyzePresentation(sessionData);

    // 3. 결과 저장
    await saveAnalysisResult(sessionId, analysisResult);

    // 4. 세션 상태 업데이트
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        actualDuration: sessionData.sessionMetadata.actualDuration,
      },
    });

    console.log(`Comprehensive analysis completed for session ${sessionId}`);
  } catch (error) {
    console.error(
      `Comprehensive analysis failed for session ${sessionId}:`,
      error
    );

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });
  }
};

const collectSessionData = async (sessionId) => {
  // 세션의 모든 데이터 수집
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
    },
  });

  // 대본 데이터 (실제로는 별도 테이블에서 조회)
  const scriptText = ""; // 업로드된 대본 텍스트

  // 음성 텍스트 (실제로는 별도 테이블에서 조회)
  const transcribedText = ""; // Whisper로 변환된 텍스트

  // 실시간 메트릭 (실제로는 별도 테이블에서 집계)
  const realtimeMetrics = {
    avgVolume: 0.7,
    avgSpeakingPace: 150,
    audienceContactRatio: 65,
    pageTransitions: 8,
  };

  return {
    scriptText,
    transcribedText,
    sessionMetadata: {
      title: session.title,
      theme: session.theme,
      expectedDuration: session.expectedDuration,
      actualDuration: session.actualDuration || 0,
    },
    realtimeMetrics,
  };
};

module.exports = {
  processComprehensiveAnalysis,
  collectSessionData,
};
