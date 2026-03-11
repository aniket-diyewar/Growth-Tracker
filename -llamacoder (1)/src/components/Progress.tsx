import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Flame, Target, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { storage } from "../utils/storage";

export default function Progress() {
  const weeklyData = storage.loadWeeklyData();
  const streak = storage.loadStreak();
  const todayKey = storage.getTodayKey();

  // Calculate Weekly Stats
  const weeklyStats = useMemo(() => {
    let totalTasks = 0;
    let totalMinutes = 0;
    let daysActive = 0;
    let bestDay = { date: "", hours: 0 };

    Object.values(weeklyData).forEach((day) => {
      totalTasks += day.tasksCompleted;
      totalMinutes += (day.hoursStudied * 60) + day.minutesStudied;
      
      if (day.tasksCompleted > 0) daysActive++;

      const dayHours = day.hoursStudied + (day.minutesStudied / 60);
      if (dayHours > bestDay.hours) {
        bestDay = { date: day.date, hours: dayHours };
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const avgHours = daysActive > 0 ? (totalHours / daysActive).toFixed(1) : "0.0";

    return { totalTasks, totalHours, remainingMinutes, daysActive, bestDay, avgHours };
  }, [weeklyData]);

  // Weekly Goal - Updated to 3 hours
  const weeklyGoalHours = 3;
  const currentWeeklyHours = weeklyStats.totalHours + (weeklyStats.remainingMinutes / 60);
  const goalProgress = Math.min((currentWeeklyHours / weeklyGoalHours) * 100, 100);

  // Generate Current Month Heatmap Data
  const heatmapData = useMemo(() => {
    const days = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Start from the 1st of the current month
    const startDate = new Date(year, month, 1);
    
    // Iterate from the 1st to today
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split("T")[0];
      const dayData = weeklyData[dateKey];
      
      let intensity = 0;
      if (dayData) {
        const hours = dayData.hoursStudied + (dayData.minutesStudied / 60);
        if (hours > 0) intensity = 1;
        if (hours >= 0.5) intensity = 2; // 30 mins
        if (hours >= 1.5) intensity = 3; // 1.5 hours
        if (hours >= 2.5) intensity = 4; // 2.5 hours
      }
      
      days.push({ 
        date: dateKey, 
        intensity, 
        dayOfMonth: d.getDate() 
      });
    }
    return days;
  }, [weeklyData]);

  const getHeatmapColor = (intensity: number) => {
    switch (intensity) {
      case 1: return "bg-emerald-200";
      case 2: return "bg-emerald-400";
      case 3: return "bg-emerald-600";
      case 4: return "bg-emerald-800";
      default: return "bg-slate-100";
    }
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, etc.
  const adjustedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">Your Progress</h2>

      {/* Weekly Goal Card */}
      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="font-semibold">Weekly Goal</span>
            </div>
            <span className="text-2xl font-bold">
              {currentWeeklyHours.toFixed(1)}h / {weeklyGoalHours}h
            </span>
          </div>
          <div className="w-full bg-emerald-800/50 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500" 
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <p className="text-emerald-100 text-sm mt-2">
            {goalProgress >= 100 ? "🎉 Goal reached!" : `${(weeklyGoalHours - currentWeeklyHours).toFixed(1)}h to go`}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{streak} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Avg. Daily</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{weeklyStats.avgHours}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Month Activity Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {heatmapData.map((day) => (
              <div key={day.date} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-4 h-12 rounded-sm ${getHeatmapColor(day.intensity)}`}
                  title={`${day.date}: ${day.intensity > 0 ? "Active" : "Inactive"}`}
                />
                <span className="text-[10px] text-slate-400 w-4 text-center">
                  {day.dayOfMonth}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-500">
            <span>Less</span>
            <div className="w-2 h-2 rounded-sm bg-slate-100" />
            <div className="w-2 h-2 rounded-sm bg-emerald-200" />
            <div className="w-2 h-2 rounded-sm bg-emerald-400" />
            <div className="w-2 h-2 rounded-sm bg-emerald-600" />
            <div className="w-2 h-2 rounded-sm bg-emerald-800" />
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className="text-center">
                <div className={`text-xs font-medium mb-2 ${
                  idx === adjustedIndex ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {day}
                </div>
                <div
                  className={`h-24 rounded-lg flex flex-col items-center justify-end p-2 transition-all ${
                    idx === adjustedIndex ? "bg-emerald-50 ring-2 ring-emerald-500" : "bg-slate-50"
                  }`}
                >
                  {(() => {
                    // Calculate date key for this column
                    const date = new Date();
                    const diff = adjustedIndex - idx;
                    date.setDate(date.getDate() - diff);
                    const dateKey = date.toISOString().split("T")[0];
                    const dayData = weeklyData[dateKey];
                    
                    if (!dayData) return <div className="w-8 bg-slate-200 rounded-t h-1" />;
                    
                    const totalMinutes = (dayData.hoursStudied * 60) + dayData.minutesStudied;
                    const barHeight = Math.min((totalMinutes / 180) * 100, 100); // Max 3 hours
                    
                    return (
                      <>
                        <div className="w-8 bg-emerald-500 rounded-t transition-all" style={{ height: `${barHeight}%` }} />
                        <span className="text-xs text-slate-600 mt-1 font-medium">
                          {dayData.tasksCompleted}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-600 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Tasks: {weeklyStats.totalTasks}
            </span>
            <span className="font-semibold">
              {weeklyStats.totalHours}h {weeklyStats.remainingMinutes}m
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}