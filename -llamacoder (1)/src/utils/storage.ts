const STORAGE_KEYS = {
  TASKS: "placement_prep_tasks",
  STREAK: "placement_prep_streak",
  WEEKLY_DATA: "placement_prep_weekly",
  TOPICS: "placement_prep_topics",
  LAST_STUDY_DATE: "placement_prep_last_date",
};

export interface Task {
  id: string;
  name: string;
  duration: string;
  completed: boolean;
}

export interface DailyProgress {
  date: string;
  tasksCompleted: number;
  hoursStudied: number;
  minutesStudied: number;
}

export interface Topic {
  id: string;
  name: string;
  status: "done" | "in-progress" | "not-started";
}

// Added interface for the specific UI structure
export interface SavedTopics {
  dsa: Topic[];
  aptitude: Topic[];
}

export interface WeeklyData {
  [key: string]: DailyProgress;
}

export const storage = {
  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  loadTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) return [];
    return JSON.parse(data);
  },

  saveStreak: (streak: number) => {
    localStorage.setItem(STORAGE_KEYS.STREAK, streak.toString());
  },

  loadStreak: (): number => {
    const data = localStorage.getItem(STORAGE_KEYS.STREAK);
    return data ? parseInt(data, 10) : 0;
  },

  saveLastStudyDate: (date: string) => {
    localStorage.setItem(STORAGE_KEYS.LAST_STUDY_DATE, date);
  },

  loadLastStudyDate: (): string => {
    return localStorage.getItem(STORAGE_KEYS.LAST_STUDY_DATE) || "";
  },

  saveWeeklyData: (data: WeeklyData) => {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_DATA, JSON.stringify(data));
  },

  loadWeeklyData: (): WeeklyData => {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_DATA);
    return data ? JSON.parse(data) : {};
  },

  // Corrected to handle the SavedTopics object
  saveTopics: (topics: SavedTopics) => {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics));
  },

  loadTopics: (): SavedTopics | null => {
    const data = localStorage.getItem(STORAGE_KEYS.TOPICS);
    return data ? JSON.parse(data) : null;
  },

  getTodayKey: (): string => {
    return new Date().toISOString().split("T")[0];
  },

  getWeekDates: (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  },
};