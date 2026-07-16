import answerKeys from '../data/ielts_answer_keys.json';

export interface IeltsGradeResult {
  rawScore: number;
  bandScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  details: Record<string, {
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
}

// Convert Raw Score to IELTS Band Score (simplified estimation)
function getListeningBandScore(rawScore: number): number {
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 32) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 26) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 18) return 5.5;
  if (rawScore >= 16) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  return 0.0;
}

function getReadingBandScore(rawScore: number): number {
  // Assuming Academic Reading
  if (rawScore >= 39) return 9.0;
  if (rawScore >= 37) return 8.5;
  if (rawScore >= 35) return 8.0;
  if (rawScore >= 33) return 7.5;
  if (rawScore >= 30) return 7.0;
  if (rawScore >= 27) return 6.5;
  if (rawScore >= 23) return 6.0;
  if (rawScore >= 19) return 5.5;
  if (rawScore >= 15) return 5.0;
  if (rawScore >= 13) return 4.5;
  if (rawScore >= 10) return 4.0;
  return 0.0;
}

function normalizeText(text: string) {
  return text.toLowerCase().trim().replace(/[.,!?;:]/g, '');
}

export async function gradeIeltsExam(
  examId: string, // e.g. "IELTS_Mock_Test_1"
  skill: 'listening' | 'reading',
  userAnswers: Record<string, string>
): Promise<IeltsGradeResult> {
  const data = (answerKeys as any)[examId]?.[skill];
  
  if (!data) {
    throw new Error(`No answer key found for ${examId} - ${skill}`);
  }

  // Flatten questions from parts/passages
  let allQuestions: any[] = [];
  if (skill === 'listening' && data.parts) {
    data.parts.forEach((p: any) => {
      if (p.questions) allQuestions = allQuestions.concat(p.questions);
    });
  } else if (skill === 'reading' && data.passages) {
    data.passages.forEach((p: any) => {
      if (p.questions) allQuestions = allQuestions.concat(p.questions);
    });
  }

  let rawScore = 0;
  const details: Record<string, any> = {};

  allQuestions.forEach((q) => {
    const qNum = q.q_number.toString();
    const uAns = userAnswers[qNum] || '';
    const cAns = q.correct_answer || '';
    
    // Check correctness
    let isCorrect = false;
    
    // Sometimes there are multiple possible answers, but for simplicity we assume 1 string
    // Or we handle multiple choice A,B,C,D
    if (normalizeText(uAns) === normalizeText(cAns)) {
      isCorrect = true;
    } else if (q.type?.toLowerCase().includes('multiple_choice') || q.options?.length > 0) {
      // Check if they typed just the letter or the full text
      if (uAns.toLowerCase().startsWith(cAns.toLowerCase())) {
        isCorrect = true;
      }
    } else {
      // Check if it's one of the acceptable answers (e.g. "A / B" format)
      const possibleAnswers = cAns.split('/').map((s: string) => normalizeText(s));
      if (possibleAnswers.includes(normalizeText(uAns))) {
         isCorrect = true;
      }
    }

    if (isCorrect) {
      rawScore++;
    }

    details[qNum] = {
      userAnswer: uAns,
      correctAnswer: cAns,
      isCorrect,
      explanation: q.explanation_thai || q.explanation || ''
    };
  });

  const bandScore = skill === 'listening' ? getListeningBandScore(rawScore) : getReadingBandScore(rawScore);

  return {
    rawScore,
    bandScore,
    correctAnswers: rawScore,
    incorrectAnswers: allQuestions.length - rawScore,
    details
  };
}
