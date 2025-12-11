export interface Lesson {
  id: string; // Added ID for tracking
  title: string;
  duration: string;
  description: string;
  isLocked?: boolean;
  content?: string; // HTML/Markdown content of the lesson
  imageUrl?: string; // AI generated image for this specific lesson
}

export interface Module {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  modules: Module[];
  thumbnailUrl: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDuration: string;
  instructor: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
}

// State machine for the wizard
export enum AppState {
  HOME = 'HOME',
  SELECTING_CATEGORY = 'SELECTING_CATEGORY', // AI suggests broad sectors
  SELECTING_TOPIC = 'SELECTING_TOPIC',       // AI suggests specific niche
  GENERATING = 'GENERATING',                 // Creating the course structure
  COURSE_VIEW = 'COURSE_VIEW'                // Watching/Reading the course
}