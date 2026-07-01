import hsk1AnswerKey from '../data/hsk1_answer_key.json';
import hsk2AnswerKey from '../data/hsk2_answer_key.json';
import hsk3AnswerKey from '../data/hsk3_answer_key.json';
import hsk4AnswerKey from '../data/hsk4_answer_key.json';
import hsk5AnswerKey from '../data/hsk5_answer_key.json';
import hsk6AnswerKey from '../data/hsk6_answer_key.json';

export interface ExamResult {
  totalScore: number;
  maxScore: number;
  isPass: boolean;
  parts: {
    listening: { score: number; max: number };
    reading: { score: number; max: number };
    writing: { score: number; max: number };
  };
  results: {
    questionNumber: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanationThai: string;
  }[];
}

export function gradeExam(level: string, examId: string, userAnswers: Record<string, string>): ExamResult {
  if (level === 'HSK1' && (hsk1AnswerKey as any)[examId]) {
    const answers = (hsk1AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    const results = [];
    
    for (let i = 1; i <= 40; i++) {
      const qNum = i.toString();
      const correctAns = answers[qNum] || "";
      const userAns = userAnswers[qNum] || "";
      const isCorrect = userAns !== "" && correctAns.toLowerCase() === userAns.toLowerCase();
      
      if (isCorrect) {
        if (i <= 20) listeningCorrect++;
        else readingCorrect++;
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanationThai: ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 20) * 100);
    const readingScore = Math.round((readingCorrect / 20) * 100);
    const totalScore = listeningScore + readingScore;
    const isPass = totalScore >= 120;
    
    return {
      totalScore,
      maxScore: 200,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: 0, max: 0 }
      },
      results
    };
  }

  if (level === 'HSK2' && (hsk2AnswerKey as any)[examId]) {
    const answers = (hsk2AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    const results = [];
    
    for (let i = 1; i <= 60; i++) {
      const qNum = i.toString();
      const correctAns = answers[qNum] || "";
      const userAns = userAnswers[qNum] || "";
      const isCorrect = userAns !== "" && correctAns.toLowerCase() === userAns.toLowerCase();
      
      if (isCorrect) {
        if (i <= 35) listeningCorrect++;
        else readingCorrect++;
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAns,
        isCorrect,
        explanationThai: ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 35) * 100);
    const readingScore = Math.round((readingCorrect / 25) * 100);
    const totalScore = listeningScore + readingScore;
    const isPass = totalScore >= 120;
    
    return {
      totalScore,
      maxScore: 200,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: 0, max: 0 }
      },
      results
    };
  }

  if (level === 'HSK3' && (hsk3AnswerKey as any)[examId]) {
    const answers = (hsk3AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let writingScore = 0;
    const results = [];
    
    for (let i = 1; i <= 80; i++) {
      const qNum = i.toString();
      const correctAnsRaw = answers[qNum] || "";
      const userAns = (userAnswers[qNum] || "").trim();
      
      let isCorrect = false;
      if (i <= 70) {
        isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
        if (isCorrect) {
          if (i <= 40) listeningCorrect++;
          else readingCorrect++;
        }
      } else {
        const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
        const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
        isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
        if (isCorrect) {
          if (i <= 75) writingScore += 12;
          else writingScore += 8;
        }
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAnsRaw,
        isCorrect,
        explanationThai: ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 40) * 100);
    const readingScore = Math.round((readingCorrect / 30) * 100);
    const totalScore = listeningScore + readingScore + writingScore;
    const isPass = totalScore >= 180;
    
    return {
      totalScore,
      maxScore: 300,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: writingScore, max: 100 }
      },
      results
    };
  }

  if (level === 'HSK4' && (hsk4AnswerKey as any)[examId]) {
    const answers = (hsk4AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let writingScore = 0;
    const results = [];
    
    for (let i = 1; i <= 100; i++) {
      const qNum = i.toString();
      const correctAnsRaw = answers[qNum] || "";
      const userAns = (userAnswers[qNum] || "").trim();
      
      let isCorrect = false;
      if (i <= 85) {
        isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
        if (isCorrect) {
          if (i <= 45) listeningCorrect++;
          else readingCorrect++;
        }
      } else if (i <= 95) {
        const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
        const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
        isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
        if (isCorrect) {
          writingScore += 5;
        }
      } else {
        isCorrect = false;
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAnsRaw,
        isCorrect,
        explanationThai: i > 95 ? "พาร์ทนี้เป็นอัตนัย (แต่งประโยค) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 45) * 100);
    const readingScore = Math.round((readingCorrect / 40) * 100);
    const totalScore = listeningScore + readingScore + writingScore;
    const isPass = totalScore >= 150;
    
    return {
      totalScore,
      maxScore: 250,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: writingScore, max: 50 }
      },
      results
    };
  }

  if (level === 'HSK5' && (hsk5AnswerKey as any)[examId]) {
    const answers = (hsk5AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    let writingScore = 0;
    const results = [];
    
    for (let i = 1; i <= 100; i++) {
      const qNum = i.toString();
      const correctAnsRaw = answers[qNum] || "";
      const userAns = (userAnswers[qNum] || "").trim();
      
      let isCorrect = false;
      if (i <= 90) {
        isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
        if (isCorrect) {
          if (i <= 45) listeningCorrect++;
          else readingCorrect++;
        }
      } else if (i <= 98) {
        const cleanUserAns = userAns.replace(/[。！？?!\s]/g, "");
        const possibleAnswers = correctAnsRaw.split("/").map((a: string) => a.replace(/[。！？?!\s]/g, ""));
        isCorrect = cleanUserAns !== "" && possibleAnswers.includes(cleanUserAns);
        if (isCorrect) {
          writingScore += 5;
        }
      } else {
        isCorrect = false;
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAnsRaw,
        isCorrect,
        explanationThai: i > 98 ? "พาร์ทนี้เป็นอัตนัย (แต่งประโยคสั้นๆ) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 45) * 100);
    const readingScore = Math.round((readingCorrect / 45) * 100);
    const totalScore = listeningScore + readingScore + writingScore;
    const isPass = totalScore >= 144;
    
    return {
      totalScore,
      maxScore: 240,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: writingScore, max: 40 }
      },
      results
    };
  }

  if (level === 'HSK6' && (hsk6AnswerKey as any)[examId]) {
    const answers = (hsk6AnswerKey as any)[examId];
    let listeningCorrect = 0;
    let readingCorrect = 0;
    const results = [];
    
    for (let i = 1; i <= 101; i++) {
      const qNum = i.toString();
      const correctAnsRaw = answers[qNum] || "";
      const userAns = (userAnswers[qNum] || "").trim();
      
      let isCorrect = false;
      if (i <= 100) {
        isCorrect = userAns !== "" && correctAnsRaw.toLowerCase() === userAns.toLowerCase();
        if (isCorrect) {
          if (i <= 50) listeningCorrect++;
          else readingCorrect++;
        }
      } else {
        isCorrect = false;
      }
      
      results.push({
        questionNumber: qNum,
        userAnswer: userAns,
        correctAnswer: correctAnsRaw,
        isCorrect,
        explanationThai: i === 101 ? "พาร์ทนี้เป็นอัตนัย (เขียนสรุปความ) ระบบยังไม่สามารถตรวจให้คะแนนได้ในขณะนี้" : ""
      });
    }
    
    const listeningScore = Math.round((listeningCorrect / 50) * 100);
    const readingScore = Math.round((readingCorrect / 50) * 100);
    const totalScore = listeningScore + readingScore;
    const isPass = totalScore >= 120;
    
    return {
      totalScore,
      maxScore: 200,
      isPass,
      parts: {
        listening: { score: listeningScore, max: 100 },
        reading: { score: readingScore, max: 100 },
        writing: { score: 0, max: 0 }
      },
      results
    };
  }

  throw new Error(`Grading not supported or missing answer key for ${level} - ${examId}`);
}
