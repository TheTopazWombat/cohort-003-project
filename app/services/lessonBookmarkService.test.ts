import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import {
  getBookmark,
  isLessonBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  getUserBookmarks,
} from "./lessonBookmarkService";

let testModule: typeof schema.modules.$inferSelect;
let testLesson: typeof schema.lessons.$inferSelect;

describe("lessonBookmarkService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);

    testModule = testDb
      .insert(schema.modules)
      .values({
        courseId: base.course.id,
        title: "Test Module",
        position: 1,
      })
      .returning()
      .get();

    testLesson = testDb
      .insert(schema.lessons)
      .values({
        moduleId: testModule.id,
        title: "Test Lesson",
        position: 1,
      })
      .returning()
      .get();
  });

  describe("addBookmark", () => {
    it("creates a bookmark", () => {
      const bookmark = addBookmark({
        userId: base.user.id,
        lessonId: testLesson.id,
      });

      expect(bookmark).toBeDefined();
      expect(bookmark.userId).toBe(base.user.id);
      expect(bookmark.lessonId).toBe(testLesson.id);
      expect(bookmark.bookmarkedAt).toBeDefined();
    });
  });

  describe("getBookmark", () => {
    it("returns the bookmark when it exists", () => {
      addBookmark({ userId: base.user.id, lessonId: testLesson.id });

      const found = getBookmark({
        userId: base.user.id,
        lessonId: testLesson.id,
      });
      expect(found).toBeDefined();
      expect(found!.userId).toBe(base.user.id);
    });

    it("returns undefined when no bookmark exists", () => {
      const found = getBookmark({
        userId: base.user.id,
        lessonId: testLesson.id,
      });
      expect(found).toBeUndefined();
    });
  });

  describe("isLessonBookmarked", () => {
    it("returns true when bookmarked", () => {
      addBookmark({ userId: base.user.id, lessonId: testLesson.id });

      expect(
        isLessonBookmarked({ userId: base.user.id, lessonId: testLesson.id })
      ).toBe(true);
    });

    it("returns false when not bookmarked", () => {
      expect(
        isLessonBookmarked({ userId: base.user.id, lessonId: testLesson.id })
      ).toBe(false);
    });
  });

  describe("removeBookmark", () => {
    it("removes an existing bookmark", () => {
      addBookmark({ userId: base.user.id, lessonId: testLesson.id });
      removeBookmark({ userId: base.user.id, lessonId: testLesson.id });

      expect(
        isLessonBookmarked({ userId: base.user.id, lessonId: testLesson.id })
      ).toBe(false);
    });
  });

  describe("toggleBookmark", () => {
    it("adds bookmark when not bookmarked", () => {
      const result = toggleBookmark({
        userId: base.user.id,
        lessonId: testLesson.id,
      });

      expect(result.bookmarked).toBe(true);
      expect(
        isLessonBookmarked({ userId: base.user.id, lessonId: testLesson.id })
      ).toBe(true);
    });

    it("removes bookmark when already bookmarked", () => {
      addBookmark({ userId: base.user.id, lessonId: testLesson.id });

      const result = toggleBookmark({
        userId: base.user.id,
        lessonId: testLesson.id,
      });

      expect(result.bookmarked).toBe(false);
      expect(
        isLessonBookmarked({ userId: base.user.id, lessonId: testLesson.id })
      ).toBe(false);
    });
  });

  describe("getUserBookmarks", () => {
    it("returns bookmarks with joined course/module/lesson data", () => {
      addBookmark({ userId: base.user.id, lessonId: testLesson.id });

      const bookmarks = getUserBookmarks(base.user.id);
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].lessonTitle).toBe("Test Lesson");
      expect(bookmarks[0].moduleTitle).toBe("Test Module");
      expect(bookmarks[0].courseTitle).toBe("Test Course");
      expect(bookmarks[0].courseSlug).toBe("test-course");
    });

    it("returns empty array when user has no bookmarks", () => {
      expect(getUserBookmarks(base.user.id)).toHaveLength(0);
    });
  });
});
