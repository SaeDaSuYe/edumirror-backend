const { PrismaClient } = require("@prisma/client");
const { analyzePresentation } = require("./aiService");

const prisma = new PrismaClient();

const saveAnalysisResult = async (sessionId, analysisData) => {
  return await prisma.analysisResult.create({
    data: {
      sessionId,
      overallScore: analysisData.overall_score,
      expressionScore: analysisData.detailed_scores.expression,
      comprehensionScore: analysisData.detailed_scores.comprehension,
      deliveryScore: analysisData.detailed_scores.delivery,
      engagementScore: analysisData.detailed_scores.engagement,
      analysisData: JSON.stringify(analysisData),
    },
  });
};

const getAnalysisResult = async (sessionId, userId) => {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: userId,
    },
    include: {
      analysisResult: true,
    },
  });

  if (!session || !session.analysisResult) {
    throw new Error("분석 결과를 찾을 수 없습니다");
  }

  const analysisData = JSON.parse(session.analysisResult.analysisData);

  return {
    session_id: sessionId,
    overall_score: session.analysisResult.overallScore,
    detailed_scores: {
      expression: session.analysisResult.expressionScore,
      comprehension: session.analysisResult.comprehensionScore,
      delivery: session.analysisResult.deliveryScore,
      engagement: session.analysisResult.engagementScore,
    },
    ...analysisData,
  };
};

const processAnalysisInBackground = async (sessionId) => {
  try {
    console.log(`Starting analysis for session ${sessionId}`);

    // 세션 데이터 수집
    const sessionData = await getSessionData(sessionId);

    // AI 분석 수행
    const analysisResult = await analyzePresentation(sessionData);

    // 결과 저장
    await saveAnalysisResult(sessionId, analysisResult);

    // 세션 상태 업데이트
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });

    console.log(`Analysis completed for session ${sessionId}`);
  } catch (error) {
    console.error(`Analysis failed for session ${sessionId}:`, error);

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });
  }
};

const getSessionData = async (sessionId) => {
  // 실시간 데이터, 업로드된 파일 등 수집
  return {
    sessionId,
    // 실제 데이터 수집 로직 구현 필요
  };
};

module.exports = {
  saveAnalysisResult,
  getAnalysisResult,
  processAnalysisInBackground,
};
