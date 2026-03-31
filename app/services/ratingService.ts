import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "~/db";
import { courseRatings } from "~/db/schema";

export function upsertRating(userId: number, courseId: number, rating: number) {
  const existing = db
    .select()
    .from(courseRatings)
    .where(
      and(
        eq(courseRatings.userId, userId),
        eq(courseRatings.courseId, courseId)
      )
    )
    .get();

  if (existing) {
    return db
      .update(courseRatings)
      .set({ rating, updatedAt: new Date().toISOString() })
      .where(eq(courseRatings.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(courseRatings)
    .values({ userId, courseId, rating })
    .returning()
    .get();
}

export function getUserRating(userId: number, courseId: number) {
  return (
    db
      .select({ rating: courseRatings.rating })
      .from(courseRatings)
      .where(
        and(
          eq(courseRatings.userId, userId),
          eq(courseRatings.courseId, courseId)
        )
      )
      .get()?.rating ?? null
  );
}

export function getCourseRatingStats(courseId: number) {
  const result = db
    .select({
      averageRating: sql<number>`avg(${courseRatings.rating})`,
      totalRatings: sql<number>`count(*)`,
    })
    .from(courseRatings)
    .where(eq(courseRatings.courseId, courseId))
    .get();

  return {
    averageRating: result?.averageRating ? Math.round(result.averageRating * 10) / 10 : 0,
    totalRatings: result?.totalRatings ?? 0,
  };
}

export function getCourseRatingStatsMap(courseIds: number[]) {
  if (courseIds.length === 0) return new Map<number, { averageRating: number; totalRatings: number }>();

  const results = db
    .select({
      courseId: courseRatings.courseId,
      averageRating: sql<number>`avg(${courseRatings.rating})`,
      totalRatings: sql<number>`count(*)`,
    })
    .from(courseRatings)
    .where(inArray(courseRatings.courseId, courseIds))
    .groupBy(courseRatings.courseId)
    .all();

  const map = new Map<number, { averageRating: number; totalRatings: number }>();
  for (const row of results) {
    map.set(row.courseId, {
      averageRating: row.averageRating ? Math.round(row.averageRating * 10) / 10 : 0,
      totalRatings: row.totalRatings ?? 0,
    });
  }
  return map;
}
