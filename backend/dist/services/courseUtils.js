"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenLessons = flattenLessons;
exports.findLessonById = findLessonById;
exports.findLessonOrder = findLessonOrder;
exports.getNextLessonId = getNextLessonId;
exports.getLessonTitleById = getLessonTitleById;
exports.getTotalLessonCount = getTotalLessonCount;
exports.computeProgressPercent = computeProgressPercent;
function flattenLessons(course) {
    const modules = [...course.curriculum].sort((a, b) => a.order - b.order);
    const flattened = [];
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
function findLessonById(course, lessonId) {
    const all = flattenLessons(course);
    return all.find((item) => item.lesson.lessonId === lessonId) ?? null;
}
function findLessonOrder(course, lessonId) {
    const all = flattenLessons(course);
    return all.findIndex((item) => item.lesson.lessonId === lessonId);
}
function getNextLessonId(course, lessonId) {
    const all = flattenLessons(course);
    const index = all.findIndex((item) => item.lesson.lessonId === lessonId);
    if (index === -1 || index + 1 >= all.length)
        return null;
    return all[index + 1].lesson.lessonId;
}
function getLessonTitleById(course, lessonId) {
    const found = findLessonById(course, lessonId);
    return found?.lesson.title ?? null;
}
function getTotalLessonCount(course) {
    return flattenLessons(course).length;
}
function computeProgressPercent(completedCount, totalCount) {
    if (totalCount <= 0)
        return 0;
    return Math.round((completedCount / totalCount) * 100);
}
