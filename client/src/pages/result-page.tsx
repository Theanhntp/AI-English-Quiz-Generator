import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Trophy, ArrowLeft } from "lucide-react";

export default function ResultPage() {
  const { id } = useParams();

  const { data: result, isLoading } = useQuery<{
    id: string;
    score: string;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    completedAt: string;
    quizId: string;
  }>({
    queryKey: ["/api/result", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-slate-600">Result not found</p>
        </div>
      </div>
    );
  }

  const score = parseFloat(result.score);
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Improvement";

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Results Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className={`w-12 h-12 mx-auto mb-4 ${scoreColor}`} />
              <p className="text-3xl font-bold text-slate-900">{score}%</p>
              <p className="text-sm text-slate-500">Your Score</p>
              <Badge 
                variant="secondary" 
                className={`mt-2 ${score >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                  score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
              >
                {scoreLabel}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
              <p className="text-3xl font-bold text-slate-900">
                {result.correctAnswers}/{result.totalQuestions}
              </p>
              <p className="text-sm text-slate-500">Correct Answers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <p className="text-3xl font-bold text-slate-900">
                {formatTime(result.timeSpent || 0)}
              </p>
              <p className="text-sm text-slate-500">Time Spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Completed on:</span>
                <p className="font-medium">
                  {new Date(result.completedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Quiz ID:</span>
                <p className="font-medium">{result.quizId}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Performance Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Questions Attempted</span>
                  <span className="font-medium">{result.totalQuestions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Correct Answers</span>
                  <span className="font-medium text-emerald-600">{result.correctAnswers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Incorrect Answers</span>
                  <span className="font-medium text-red-600">
                    {result.totalQuestions - result.correctAnswers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy Rate</span>
                  <span className={`font-medium ${scoreColor}`}>{score.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex space-x-4">
                <Button className="flex-1" onClick={() => window.location.href = "/"}>
                  Take Another Quiz
                </Button>
                <Button variant="outline" className="flex-1">
                  Review Answers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
