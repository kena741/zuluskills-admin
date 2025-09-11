export type ModuleRecord = {
    id: string;
    title: string;
    description?: string;
    ordinal?: number;
    // Add other fields as needed
};
export type LessonType = "video" | "text" | "task" | "quiz";

export type Lesson = {
    id: string;
    title: string;
    type: LessonType;
    content?: string; // for text/task description
    videoUrl?: string; // for video lessons
    durationMinutes?: number;
    dueAt?: string; // ISO timestamp for deadlines
};

export type Module = {
    id: string;
    title: string;
    lessons: Lesson[];
};

export type Project = {
    id: string;
    title: string;
    description?: string;
    modules: Module[];
};

export type Progress = {
    projectId: string;
    userId: string;
    completedLessonIds: string[];
};
