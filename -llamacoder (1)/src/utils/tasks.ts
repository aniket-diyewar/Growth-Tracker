import { Task, Topic } from "./storage";

export const DEFAULT_TASKS: Task[] = [
  { id: "1", name: "Quant - Arithmetic", duration: "30 min", completed: false },
  { id: "2", name: "Quant - Algebra", duration: "30 min", completed: false },
  { id: "3", name: "DSA - Arrays", duration: "30 min", completed: false },
  { id: "4", name: "DSA - Strings", duration: "30 min", completed: false },
  { id: "5", name: "Logical Reasoning", duration: "30 min", completed: false },
  { id: "6", name: "Verbal Ability", duration: "30 min", completed: false },
  { id: "7", name: "Revision & Practice", duration: "30 min", completed: false },
];

export const DEFAULT_TOPICS: Topic[] = [
  // DSA Topics
  { id: "dsa-1", name: "Arrays", status: "not-started" },
  { id: "dsa-2", name: "Linked Lists", status: "not-started" },
  { id: "dsa-3", name: "Stacks & Queues", status: "not-started" },
  { id: "dsa-4", name: "Trees", status: "not-started" },
  { id: "dsa-5", name: "Graphs", status: "not-started" },
  { id: "dsa-6", name: "Dynamic Programming", status: "not-started" },
  { id: "dsa-7", name: "Sorting & Searching", status: "not-started" },
  { id: "dsa-8", name: "Hash Tables", status: "not-started" },
  // Aptitude Topics
  { id: "apt-1", name: "Percentage", status: "not-started" },
  { id: "apt-2", name: "Profit & Loss", status: "not-started" },
  { id: "apt-3", name: "Time & Work", status: "not-started" },
  { id: "apt-4", name: "Ratio & Proportion", status: "not-started" },
  { id: "apt-5", name: "Simple Interest", status: "not-started" },
  { id: "apt-6", name: "Time & Distance", status: "not-started" },
  { id: "apt-7", name: "Number System", status: "not-started" },
  { id: "apt-8", name: "Probability", status: "not-started" },
];

export const DSA_TOPICS = DEFAULT_TOPICS.filter((t) => t.id.startsWith("dsa"));
export const APTITUDE_TOPICS = DEFAULT_TOPICS.filter((t) => t.id.startsWith("apt"));