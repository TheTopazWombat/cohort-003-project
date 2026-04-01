import { eq, and, desc } from "drizzle-orm";
import { db } from "~/db";
import { lessonBookmarks, lessons, modules, courses } from "~/db/schema";

export function getBookmark(opts: { userId: number; lessonId: number }) {
  return db
    .select()
    .from(lessonBookmarks)
    .where(
      and(
        eq(lessonBookmarks.userId, opts.userId),
        eq(lessonBookmarks.lessonId, opts.lessonId)
      )
    )
    .get();
}

export function isLessonBookmarked(opts: {
  userId: number;
  lessonId: number;
}) {
  return !!getBookmark(opts);
}

export function addBookmark(opts: { userId: number; lessonId: number }) {
  return db
    .insert(lessonBookmarks)
    .values({ userId: opts.userId, lessonId: opts.lessonId })
    .returning()
    .get();
}

export function removeBookmark(opts: { userId: number; lessonId: number }) {
  return db
    .delete(lessonBookmarks)
    .where(
      and(
        eq(lessonBookmarks.userId, opts.userId),
        eq(lessonBookmarks.lessonId, opts.lessonId)
      )
    )
    .returning()
    .get();
}

export function toggleBookmark(opts: { userId: number; lessonId: number }) {
  const existing = getBookmark(opts);
  if (existing) {
    removeBookmark(opts);
    return { bookmarked: false };
  }
  addBookmark(opts);
  return { bookmarked: true };
}

export function getUserBookmarks(userId: number) {
  return db
    .select({
      id: lessonBookmarks.id,
      lessonId: lessonBookmarks.lessonId,
      bookmarkedAt: lessonBookmarks.bookmarkedAt,
      lessonTitle: lessons.title,
      moduleTitle: modules.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
    })
    .from(lessonBookmarks)
    .innerJoin(lessons, eq(lessonBookmarks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(lessonBookmarks.userId, userId))
    .orderBy(desc(lessonBookmarks.bookmarkedAt))
    .all();
}
