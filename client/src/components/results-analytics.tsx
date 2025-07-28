import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressChart } from "@/components/progress-chart";
import { Trophy, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

export function ResultsAnalytics() {
  const { data: stats } = useQuery<{
    totalMaterials: number;
    totalQuizzes: number;
    totalAttempts: number;
    avgScore: number;
  }>({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: attempts = [] } = useQuery<Array<{
    id: string;
    score: string;
    timeSpent: number;
    completedAt: string;
  }>>({
    queryKey: ["/api/results"],
  });

  const avgScore = stats?.avgScore || 0;
  const completionRate = attempts.length > 0 ? 100 : 0; // Simplified calculation
  const avgTime = attempts.length > 0 
    ? attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / attempts.length 
    : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Quiz Results & Analytics</h3>
          <p className="text-slate-600">Track student performance and quiz effectiveness</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              <SelectItem value="recent">Recent Quizzes</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-primary/5 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Average Score</p>
                <p className="text-3xl font-bold text-primary">{avgScore.toFixed(1)}%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5.2% from last month
                </p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-secondary/5 border-violet-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold text-secondary-600">{completionRate.toFixed(1)}%</p>
                <p className="text-sm text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2.1% from last month
                </p>
              </div>
              <div className="w-16 h-16 bg-secondary-600/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg. Time</p>
                <p className="text-3xl font-bold text-emerald-700">{formatTime(avgTime)}</p>
                <p className="text-sm text-red-600 flex items-center mt-1">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -1.5m from last month
                </p>
              </div>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Difficulty Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <div className="text-center">
                <p className="text-slate-500">Difficulty analysis chart</p>
                <p className="text-sm text-slate-400">Coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quiz Results */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No quiz attempts yet.</p>
              <p className="text-sm text-slate-500">Quiz results will appear here once students start taking quizzes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quiz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {attempts.slice(0, 5).map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">Quiz #{attempt.quizId.slice(-6)}</div>
                        <div className="text-sm text-slate-500">{attempt.totalQuestions} questions</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-slate-900">{parseFloat(attempt.score).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatTime(attempt.timeSpent || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
