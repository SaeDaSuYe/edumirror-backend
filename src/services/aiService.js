const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeScript = async (scriptText) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `다음 발표 대본을 분석해주세요:
                
                대본: "${scriptText}"
                
                다음 형식으로 JSON 응답해주세요:
                {
                    "word_count": 단어수,
                    "estimated_duration": 예상시간(초),
                    "key_topics": ["주요", "키워드", "배열"]
                }`,
        },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Script analysis failed:", error);
    return {
      word_count: scriptText.split(" ").length,
      estimated_duration: Math.ceil(scriptText.split(" ").length * 0.5),
      key_topics: [],
    };
  }
};

const generateQuestions = async (
  keywords,
  difficultyLevel = "high_school",
  count = 3
) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `다음 키워드들을 바탕으로 ${difficultyLevel} 수준의 질문 ${count}개를 생성해주세요:
                
                키워드: ${keywords.join(", ")}
                
                다음 형식으로 JSON 응답해주세요:
                {
                    "questions": [
                        {
                            "question_id": "q1",
                            "text": "질문 내용",
                            "difficulty": "medium",
                            "expected_answer_duration": 60
                        }
                    ]
                }`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Question generation failed:", error);
    return { questions: [] };
  }
};

const analyzePresentation = async (sessionData) => {
  // 종합 분석 로직 (추후 구현)
  return {
    overall_score: 85,
    detailed_scores: {
      expression: 80,
      comprehension: 90,
      delivery: 85,
      engagement: 82,
    },
  };
};

module.exports = {
  analyzeScript,
  generateQuestions,
  analyzePresentation,
};
