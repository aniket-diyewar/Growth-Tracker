import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Play, Pause, RotateCcw, Check } from "lucide-react";
import { storage, Task } from "../utils/storage";
import { DEFAULT_TASKS } from "../utils/tasks";
import { useTimer } from "../hooks/useTimer";

interface StudySessionProps {
  onBack: () => void;
}

const TASK_DURATION_SECONDS = 30 * 60; // 30 minutes in seconds

export default function StudySession({ onBack }: StudySessionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    const savedTasks = storage.loadTasks();
    if (savedTasks.length === 0) {
      setTasks(DEFAULT_TASKS);
    } else {
      setTasks(savedTasks);
    }
  }, []);

  const handleTimerComplete = () => {
    saveProgress();
  };

  const { seconds, isRunning, start, pause, reset } = useTimer(
    TASK_DURATION_SECONDS,
    handleTimerComplete
  );

  const startTask = (taskId: string) => {
    if (activeTaskId && activeTaskId !== taskId) {
      reset();
    }
    setActiveTaskId(taskId);
    start();
  };

  const toggleTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    storage.saveTasks(updatedTasks);

    if (activeTaskId === taskId) {
      reset();
      setActiveTaskId(null);
    }

    saveProgress();
  };

  const saveProgress = () => {
    const completedTasks = tasks.filter((t) => t.completed).length;
    const hoursStudied = Math.floor(completedTasks * 0.5);
    const minutesStudied = (completedTasks * 30) % 60;

    const today = storage.getTodayKey();
    const weeklyData = storage.loadWeeklyData();

    weeklyData[today] = {
      date: today,
      tasksCompleted: completedTasks,
      hoursStudied,
      minutesStudied,
    };

    storage.saveWeeklyData(weeklyData);
    storage.saveLastStudyDate(today);

    const lastDate = storage.loadLastStudyDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const currentStreak = storage.loadStreak();

    if (lastDate === yesterday || lastDate === today) {
      if (lastDate !== today) {
        storage.saveStreak(currentStreak + 1);
      }
    } else if (lastDate === "") {
      storage.saveStreak(1);
    }
  };

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = () => {
    return ((TASK_DURATION_SECONDS - seconds) / TASK_DURATION_SECONDS) * 100;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-slate-800">Study Session</h2>
      </div>

      {activeTaskId && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-emerald-600 font-medium mb-2">Current Task</p>
            <p className="text-lg font-semibold text-slate-800 mb-4">
              {tasks.find((t) => t.id === activeTaskId)?.name}
            </p>
            
            <div className="mb-4">
              <div className="w-full bg-emerald-200 rounded-full h-3 mb-2">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>
              <p className="text-5xl font-bold text-emerald-600">{formatTime(seconds)}</p>
              <p className="text-sm text-slate-500 mt-2">
                {isRunning ? "Timer running..." : "Timer paused"}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {isRunning ? (
                <Button onClick={pause} variant="outline" size="icon">
                  <Pause className="w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={start} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              <Button onClick={reset} variant="outline" size="icon">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`transition-all ${
              task.completed ? "bg-emerald-50 border-emerald-200" : "hover:shadow-md"
            } ${activeTaskId === task.id ? "ring-2 ring-emerald-500" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 hover:border-emerald-500"
                    }`}
                  >
                    {task.completed && <Check className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        task.completed ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.name}
                    </p>
                    <p className="text-xs text-slate-500">{task.duration}</p>
                  </div>
                </div>
                {!task.completed && (
                  <Button
                    onClick={() => startTask(task.id)}
                    disabled={activeTaskId !== null && activeTaskId !== task.id}
                    size="sm"
                    variant={activeTaskId === task.id ? "default" : "outline"}
                    className={activeTaskId === task.id ? "bg-emerald-600" : ""}
                  >
                    {activeTaskId === task.id && isRunning ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    {activeTaskId === task.id ? (isRunning ? "Pause" : "Resume") : "Start"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}