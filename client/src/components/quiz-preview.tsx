import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronDown, Edit, Share, CheckCircle } from "lucide-react";
import { QuizQuestion } from "@shared/schema";

interface QuizPreviewProps {
  quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
    difficultyLevel: string;
  };
  onPublish: () => void;
  isPublishing: boolean;
}

export function QuizPreview({ quiz, onPublish, isPublishing }: QuizPreviewProps) {
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const displayedQuestions = showAllQuestions ? quiz.questions : quiz.questions.slice(0, 3);

  const getQuestionTypeBadge = (type: string) => {
    const typeMap = {
      multiple_choice: { label: "Multiple Choice", color: "bg-blue-100 text-blue-700" },
      true_false: { label: "True/False", color: "bg-green-100 text-green-700" },
      fill_blank: { label: "Fill in Blank", color: "bg-purple-100 text-purple-700" },
    };
    
    const config = typeMap[type as keyof typeof typeMap] || { label: type, color: "bg-gray-100 text-gray-700" };
    
    return (
      <Badge className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const renderQuestion = (question: QuizQuestion, index: number) => {
    return (
      <Card key={question.id} className="border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h5 className="font-medium text-slate-900">Question {index + 1}</h5>
            {getQuestionTypeBadge(question.type)}
          </div>
          
          <p className="text-slate-700 mb-4">{question.question}</p>
          
          {question.type === "multiple_choice" && question.options && (
            <div className="space-y-2">
              <RadioGroup value={question.correctAnswer} className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center p-2 hover:bg-slate-50 rounded transition-colors">
                    <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                    <Label htmlFor={`${question.id}-${optionIndex}`} className="ml-3 text-sm text-slate-700 flex-1">
                      {option}
                    </Label>
                    {option === question.correctAnswer && (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
          
          {question.type === "true_false" && (
            <div className="flex space-x-4">
              <div className="flex items-center p-2 hover:bg-slate-50 rounded transition-colors">
                <RadioGroup value={question.correctAnswer} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id={`${question.id}-true`} />
                    <Label htmlFor={`${question.id}-true`} className="text-sm text-slate-700">True</Label>
                    {question.correctAnswer === "true" && (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id={`${question.id}-false`} />
                    <Label htmlFor={`${question.id}-false`} className="text-sm text-slate-700">False</Label>
                    {question.correctAnswer === "false" && (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {question.type === "fill_blank" && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-2">Correct Answer:</p>
              <p className="font-medium text-slate-900">{question.correctAnswer}</p>
            </div>
          )}

          {question.explanation && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <p className="text-sm text-blue-800">
                <strong>Explanation:</strong> {question.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {quiz.questions.length} questions • {quiz.difficultyLevel} level
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm"
              onClick={onPublish}
              disabled={isPublishing}
              className="bg-primary hover:bg-primary/90"
            >
              <Share className="w-4 h-4 mr-1" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {displayedQuestions.map((question, index) => renderQuestion(question, index))}
          
          {quiz.questions.length > 3 && (
            <div className="text-center py-4">
              <Button 
                variant="ghost"
                onClick={() => setShowAllQuestions(!showAllQuestions)}
                className="text-primary hover:text-primary/90"
              >
                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${showAllQuestions ? 'rotate-180' : ''}`} />
                {showAllQuestions 
                  ? `Show fewer questions` 
                  : `Show all ${quiz.questions.length} questions`
                }
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
