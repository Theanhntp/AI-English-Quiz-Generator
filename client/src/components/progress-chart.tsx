import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ProgressChart() {
  const { data: attempts = [] } = useQuery<Array<{
    score: string;
    completedAt: string;
  }>>({
    queryKey: ["/api/results"],
  });

  // Transform attempts data for chart
  const chartData = attempts
    .slice(-10) // Last 10 attempts
    .map((attempt, index: number) => ({
      attempt: index + 1,
      score: parseFloat(attempt.score),
      date: new Date(attempt.completedAt).toLocaleDateString(),
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
        <div className="text-center">
          <p className="text-slate-500">No data available</p>
          <p className="text-sm text-slate-400">Take some quizzes to see your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="attempt" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
            labelFormatter={(label) => `Attempt ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(207, 90%, 54%)"
            strokeWidth={3}
            dot={{ fill: "hsl(207, 90%, 54%)", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(207, 90%, 54%)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
