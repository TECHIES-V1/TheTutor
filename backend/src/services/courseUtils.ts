import { ICourse, ILesson } from "../models/Course";

export interface LessonWithModule {
  moduleId: string;
  moduleTitle: string;
  lesson: ILesson;
}

export function flattenLessons(course: ICourse): LessonWithModule[] {
  const modules = [...course.curriculum].sort((a, b) => a.order - b.order);
  const flattened: LessonWithModule[] = [];

  for (const module of modules) {
    const lessons = [...module.lessons].sort((a, b) => a.order - b.order);
    for (const lesson of lessons) {
      flattened.push({
        moduleId: module.moduleId,
        moduleTitle: module.title,
        lesson,
      });
    }
  }

  return flattened;
}

export function findLessonById(course: ICourse, lessonId: string): LessonWithModule | null {
  const all = flattenLessons(course);
  return all.find((item) => item.lesson.lessonId === lessonId) ?? null;
}

export function findLessonOrder(course: ICourse, lessonId: string): number {
  const all = flattenLessons(course);
  return all.findIndex((item) => item.lesson.lessonId === lessonId);
}

export function getNextLessonId(course: ICourse, lessonId: string): string | null {
  const all = flattenLessons(course);
  const index = all.findIndex((item) => item.lesson.lessonId === lessonId);
  if (index === -1 || index + 1 >= all.length) return null;
  return all[index + 1].lesson.lessonId;
}

export function getLessonTitleById(course: ICourse, lessonId: string): string | null {
  const found = findLessonById(course, lessonId);
  return found?.lesson.title ?? null;
}

export function getTotalLessonCount(course: ICourse): number {
  return flattenLessons(course).length;
}

export function computeProgressPercent(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

