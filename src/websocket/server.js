const WebSocket = require("ws");
const url = require("url");
const { verifyToken } = require("../utils/jwt");

const clients = new Map(); // sessionId -> WebSocket connections

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({
    server,
    path: "/ws",
  });

  wss.on("connection", (ws, request) => {
    try {
      const pathname = url.parse(request.url).pathname;
      const sessionId = pathname.split("/").pop();

      if (!sessionId || !sessionId.startsWith("session_")) {
        ws.close(1008, "Invalid session ID");
        return;
      }

      ws.sessionId = sessionId;

      // 클라이언트 연결 저장
      if (!clients.has(sessionId)) {
        clients.set(sessionId, new Set());
      }
      clients.get(sessionId).add(ws);

      console.log(`WebSocket connected: ${sessionId}`);

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data);
          handleRealtimeData(ws, message);
        } catch (error) {
          console.error("Invalid message format:", error);
        }
      });

      ws.on("close", () => {
        if (clients.has(sessionId)) {
          clients.get(sessionId).delete(ws);
          if (clients.get(sessionId).size === 0) {
            clients.delete(sessionId);
          }
        }
        console.log(`WebSocket disconnected: ${sessionId}`);
      });
    } catch (error) {
      console.error("WebSocket connection error:", error);
      ws.close(1011, "Server error");
    }
  });

  return wss;
};

const handleRealtimeData = (ws, data) => {
  const { type, timestamp } = data;

  switch (type) {
    case "audio_chunk":
      processAudioData(ws.sessionId, data);
      break;
    case "page_turn":
      processPageTurn(ws.sessionId, data);
      break;
    case "gaze_data":
      processGazeData(ws.sessionId, data);
      break;
    default:
      console.log("Unknown message type:", type);
  }
};

const processAudioData = (sessionId, data) => {
  // 음성 데이터 분석 로직
  const { volume_level, speaking_pace } = data;

  // 실시간 피드백 생성
  let feedback = null;
  if (volume_level < 0.3) {
    feedback = {
      type: "realtime_feedback",
      message: "목소리를 조금 더 크게 해보세요",
      feedback_type: "volume_low",
    };
  }

  if (feedback) {
    broadcastToSession(sessionId, feedback);
  }
};

const processPageTurn = (sessionId, data) => {
  console.log(`Page turn in ${sessionId}:`, data);
  // 슬라이드 전환 데이터 저장
};

const processGazeData = (sessionId, data) => {
  console.log(`Gaze data in ${sessionId}:`, data);
  // 시선 추적 데이터 저장
};

const broadcastToSession = (sessionId, message) => {
  if (clients.has(sessionId)) {
    clients.get(sessionId).forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
};

module.exports = {
  setupWebSocket,
  broadcastToSession,
};
