const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const generateSessionId = () => {
  return `session_${crypto.randomBytes(4).toString("hex")}`;
};

const createSession = async (userId, sessionData) => {
  const sessionId = generateSessionId();

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      title: sessionData.title,
      theme: sessionData.theme,
      backgroundNoise: sessionData.background_noise,
      aiQuestionsEnabled: sessionData.ai_questions_enabled,
      expectedDuration: sessionData.expected_duration,
    },
  });

  return {
    session_id: session.id,
    websocket_url: `ws://localhost:${process.env.PORT}/ws/${session.id}`,
  };
};

const getSessionById = async (sessionId, userId) => {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId: userId,
    },
  });

  if (!session) {
    throw new Error("세션을 찾을 수 없습니다");
  }

  return session;
};

const updateSessionStatus = async (sessionId, status) => {
  return await prisma.session.update({
    where: { id: sessionId },
    data: { status },
  });
};

const getUserSessions = async (userId, page = 1, limit = 10, theme = null) => {
  const skip = (page - 1) * limit;

  const where = {
    userId: userId,
    ...(theme && { theme }),
  };

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        analysisResult: {
          select: { overallScore: true },
        },
      },
    }),
    prisma.session.count({ where }),
  ]);

  return {
    sessions: sessions.map((session) => ({
      session_id: session.id,
      title: session.title,
      date: session.createdAt,
      duration: session.actualDuration,
      overall_score: session.analysisResult?.overallScore,
      theme: session.theme,
    })),
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / limit),
      total_count: total,
    },
  };
};

module.exports = {
  createSession,
  getSessionById,
  updateSessionStatus,
  getUserSessions,
};
