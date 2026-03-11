import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Flame, Clock, CheckCircle, Play } from "lucide-react";
import { storage, Task, DailyProgress } from "../utils/storage";
import { DEFAULT_TASKS } from "../utils/tasks";

interface DashboardProps {
  onStartSession: () => void;
}

export default function Dashboard({ onStartSession }: DashboardProps) {
  const [streak, setStreak] = useState(0);
  const [todayProgress, setTodayProgress] = useState<DailyProgress>({
    date: storage.getTodayKey(),
    tasksCompleted: 0,
    hoursStudied: 0,
    minutesStudied: 0,
  });

  useEffect(() => {
    // Load streak
    const savedStreak = storage.loadStreak();
    setStreak(savedStreak);

    // Load today's progress
    const weeklyData = storage.loadWeeklyData();
    const today = storage.getTodayKey();
    if (weeklyData[today]) {
      setTodayProgress(weeklyData[today]);
    }

    // Check and update streak
    const lastStudyDate = storage.loadLastStudyDate();
    const todayDate = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (lastStudyDate === yesterday) {
      // Streak continues
    } else if (lastStudyDate !== todayDate) {
      // Streak broken (unless it's the first day)
      if (lastStudyDate !== "") {
        storage.saveStreak(0);
        setStreak(0);
      }
    }
  }, []);

  const formatTime = (hours: number, minutes: number) => {
    if (hours === 0 && minutes === 0) return "0m";
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 space-y-4">
      {/* Streak Card */}
      <Card className="bg-gradient-to-br from-orange-500 to-amber-500 border-0 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Current Streak</p>
              <p className="text-4xl font-bold mt-1">{streak} Days</p>
            </div>
            <Flame className="w-16 h-16 text-orange-200" />
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Tasks Done</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold">{todayProgress.tasksCompleted}/7</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-500">Time Studied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {formatTime(todayProgress.hoursStudied, todayProgress.minutesStudied)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Plan Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's 3-Hour Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEFAULT_TASKS.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-medium text-slate-700">{task.name}</span>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                {task.duration}
              </span>
            </div>
          ))}
          <p className="text-xs text-slate-400 text-center pt-2">+ 3 more tasks</p>
        </CardContent>
      </Card>

      {/* Start Session Button */}
      <Button
        onClick={onStartSession}
        size="lg"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold"
      >
        <Play className="w-5 h-5 mr-2" />
        Start Study Session
      </Button>
    </div>
  );
}