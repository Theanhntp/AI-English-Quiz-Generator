import { create } from "zustand";
import { QuizQuestion, QuizAnswer } from "@shared/schema";

interface QuizState {
  activeTab: string;
  selectedMaterial: string | null;
  isQuizModalOpen: boolean;
  currentQuestion: number;
  currentQuiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
  } | null;
  answers: QuizAnswer[];
  timeSpent: number;
  
  // Actions
  setActiveTab: (tab: string) => void;
  setSelectedMaterial: (materialId: string | null) => void;
  setQuizModalOpen: (open: boolean) => void;
  setCurrentQuestion: (question: number) => void;
  setCurrentQuiz: (quiz: any) => void;
  addAnswer: (answer: QuizAnswer) => void;
  updateAnswer: (questionId: string, answer: string) => void;
  setTimeSpent: (time: number) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  activeTab: "materials",
  selectedMaterial: null,
  isQuizModalOpen: false,
  currentQuestion: 0,
  currentQuiz: null,
  answers: [],
  timeSpent: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedMaterial: (materialId) => set({ selectedMaterial: materialId }),
  setQuizModalOpen: (open) => set({ isQuizModalOpen: open }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
  
  addAnswer: (answer) => {
    const { answers } = get();
    const existingIndex = answers.findIndex(a => a.questionId === answer.questionId);
    if (existingIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingIndex] = answer;
      set({ answers: newAnswers });
    } else {
      set({ answers: [...answers, answer] });
    }
  },

  updateAnswer: (questionId, answer) => {
    const { answers } = get();
    const existingIndex = answers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingIndex] = { ...newAnswers[existingIndex], answer };
      set({ answers: newAnswers });
    } else {
      set({ 
        answers: [...answers, { questionId, answer, isCorrect: false }] 
      });
    }
  },

  setTimeSpent: (time) => set({ timeSpent: time }),
  
  resetQuiz: () => set({
    currentQuestion: 0,
    currentQuiz: null,
    answers: [],
    timeSpent: 0,
    isQuizModalOpen: false,
  }),
}));
