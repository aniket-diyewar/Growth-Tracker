import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { CheckCircle2, Circle, Clock, RotateCcw, ArrowLeft } from "lucide-react";
import { storage, Topic, SavedTopics } from "../utils/storage";
import { DSA_TOPICS, APTITUDE_TOPICS } from "../utils/tasks";

interface TopicsTrackerProps {
  onBack?: () => void;
}

type TopicStatus = "not-started" | "in-progress" | "done";

export default function TopicsTracker({ onBack }: TopicsTrackerProps) {
  const [dsaTopics, setDsaTopics] = useState<Topic[]>([]);
  const [aptitudeTopics, setAptitudeTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const savedTopics = storage.loadTopics();
    
    if (!savedTopics || !savedTopics.dsa || !savedTopics.aptitude) {
      setDsaTopics(DSA_TOPICS);
      setAptitudeTopics(APTITUDE_TOPICS);
    } else {
      setDsaTopics(savedTopics.dsa);
      setAptitudeTopics(savedTopics.aptitude);
    }
  }, []);

  const toggleStatus = (category: "dsa" | "aptitude", id: string) => {
    const currentList = category === "dsa" ? [...dsaTopics] : [...aptitudeTopics];
    const topicIndex = currentList.findIndex((t) => t.id === id);
    
    if (topicIndex === -1) return;

    const currentStatus = currentList[topicIndex].status;
    const nextStatus: TopicStatus = 
      currentStatus === "not-started" ? "in-progress" :
      currentStatus === "in-progress" ? "done" : "not-started";

    currentList[topicIndex] = { ...currentList[topicIndex], status: nextStatus };

    if (category === "dsa") {
      setDsaTopics(currentList);
      storage.saveTopics({ dsa: currentList, aptitude: aptitudeTopics });
    } else {
      setAptitudeTopics(currentList);
      storage.saveTopics({ dsa: dsaTopics, aptitude: currentList });
    }
  };

  const resetAll = () => {
    if (confirm("Are you sure you want to reset all topic progress?")) {
      const resetDsa = DSA_TOPICS.map(t => ({ ...t, status: "not-started" as TopicStatus }));
      const resetApt = APTITUDE_TOPICS.map(t => ({ ...t, status: "not-started" as TopicStatus }));
      
      setDsaTopics(resetDsa);
      setAptitudeTopics(resetApt);
      storage.saveTopics({ dsa: resetDsa, aptitude: resetApt });
    }
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case "done": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "in-progress": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-slate-300" />;
    }
  };

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case "done": return "bg-emerald-50 border-emerald-200 hover:border-emerald-400";
      case "in-progress": return "bg-amber-50 border-amber-200 hover:border-amber-400";
      default: return "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50";
    }
  };

  const renderTopicList = (topics: Topic[], category: "dsa" | "aptitude") => (
    <div className="grid grid-cols-2 gap-3">
      {topics.map((topic) => (
        <div
          key={topic.id}
          onClick={() => toggleStatus(category, topic.id)}
          className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer select-none active:scale-95 ${getStatusColor(topic.status)}`}
        >
          {getStatusIcon(topic.status)}
          <span className={`text-sm font-medium text-center ${
            topic.status === "done" ? "text-emerald-700 line-through" : "text-slate-700"
          }`}>
            {topic.name}
          </span>
        </div>
      ))}
    </div>
  );

  const calculateProgress = (topics: Topic[]) => {
    if (!topics || topics.length === 0) return 0;
    const done = topics.filter(t => t.status === "done").length;
    return Math.round((done / topics.length) * 100);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h2 className="text-xl font-bold text-slate-800">Topics Tracker</h2>
        </div>
        <Button variant="outline" size="sm" onClick={resetAll}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">DSA Ladder</CardTitle>
            <span className="text-sm font-semibold text-emerald-600">{calculateProgress(dsaTopics)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${calculateProgress(dsaTopics)}%` }} />
          </div>
        </CardHeader>
        <CardContent>{renderTopicList(dsaTopics, "dsa")}</CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Aptitude Skills</CardTitle>
            <span className="text-sm font-semibold text-amber-600">{calculateProgress(aptitudeTopics)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${calculateProgress(aptitudeTopics)}%` }} />
          </div>
        </CardHeader>
        <CardContent>{renderTopicList(aptitudeTopics, "aptitude")}</CardContent>
      </Card>
    </div>
  );
}