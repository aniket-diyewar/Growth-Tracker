import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Home, Clock, BarChart3, BookOpen } from "lucide-react";
import Dashboard from "../components/Dashboard";
import StudySession from "../components/StudySession";
import Progress from "../components/Progress";
import TopicsTracker from "../components/TopicsTracker";

type Screen = "dashboard" | "study" | "progress" | "topics";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
      });
    }
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return <Dashboard onStartSession={() => setActiveScreen("study")} />;
      case "study":
        return <StudySession onBack={() => setActiveScreen("dashboard")} />;
      case "progress":
        return <Progress />;
      case "topics":
        return <TopicsTracker />;
      default:
        return <Dashboard onStartSession={() => setActiveScreen("study")} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-sm">
        <header className="bg-emerald-600 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Growth Tracker</h1>
            </div>
            {notificationPermission === "default" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={requestNotificationPermission}
                className="text-xs"
              >
                Enable Alerts
              </Button>
            )}
          </div>
        </header>

        <main className="pb-20">
          {renderScreen()}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200">
          <div className="max-w-md mx-auto flex justify-around py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveScreen("dashboard")}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                activeScreen === "dashboard" ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveScreen("study")}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                activeScreen === "study" ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-xs">Study</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveScreen("progress")}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                activeScreen === "progress" ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Progress</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveScreen("topics")}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                activeScreen === "topics" ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Topics</span>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}