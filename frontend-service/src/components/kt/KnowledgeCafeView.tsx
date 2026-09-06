import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { CourseCatalog } from './CourseCatalog';
import { CurriculumSidebar } from './CurriculumSidebar';
import { LessonViewer } from './LessonViewer';
import { LessonDoubtDrawer } from './LessonDoubtDrawer';
import { CourseCompletionModal } from './CourseCompletionModal';
import type { CourseDetail, CourseSummary, LessonDetail } from '@/types';

interface KnowledgeCafeViewProps {
  selectedModel: string;
  onViewSource: (file: string, service?: string) => void;
  onExploreInChat: (service: string) => void;
}

export function KnowledgeCafeView({
  selectedModel,
  onViewSource,
  onExploreInChat,
}: KnowledgeCafeViewProps) {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<CourseDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonDetail | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState<boolean>(false);
  const [isDoubtDrawerOpen, setIsDoubtDrawerOpen] = useState<boolean>(false);
  const [isAskingDoubt, setIsAskingDoubt] = useState<boolean>(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);

  // Load course catalog
  const loadCourses = async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await apiClient.listCourses();
      setCourses(res);
    } catch (e) {
      console.error('Failed to load courses:', e);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Handle Course Selection & Enrollment
  const handleSelectCourse = async (courseId: string) => {
    try {
      setActiveCourseId(courseId);
      setIsLoadingLesson(true);

      // Enroll or resume
      const enrollRes = await apiClient.enrollInCourse(courseId);
      setActiveCourse(enrollRes.course);

      const targetLessonId =
        enrollRes.current_lesson?.id || enrollRes.course.lessons[0]?.id;

      if (targetLessonId) {
        setActiveLessonId(targetLessonId);
        const lessonRes = await apiClient.getLesson(courseId, targetLessonId, selectedModel);
        setActiveLesson(lessonRes);
      }
    } catch (e) {
      console.error('Error starting course:', e);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Handle Lesson Switching
  const handleSelectLesson = async (lessonId: string) => {
    if (!activeCourseId) return;
    setActiveLessonId(lessonId);
    setIsLoadingLesson(true);
    try {
      const lessonRes = await apiClient.getLesson(activeCourseId, lessonId, selectedModel);
      setActiveLesson(lessonRes);
    } catch (e) {
      console.error('Error fetching lesson:', e);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Handle Complete & Next Lesson Flow
  const handleContinueLesson = async () => {
    if (!activeCourseId || !activeLessonId) return;

    try {
      const compRes = await apiClient.completeLesson(activeCourseId, activeLessonId);

      // Update local course details
      if (activeCourse) {
        const updatedLessons = activeCourse.lessons.map((l) => {
          if (l.id === activeLessonId) {
            return { ...l, status: 'completed' as const };
          }
          if (compRes.next_lesson && l.id === compRes.next_lesson.id) {
            return { ...l, status: 'current' as const };
          }
          return l;
        });

        setActiveCourse({
          ...activeCourse,
          enrollment: compRes.enrollment,
          lessons: updatedLessons,
        });
      }

      // Check if course is complete
      if (compRes.is_course_completed) {
        setIsCompletionModalOpen(true);
      } else if (compRes.next_lesson) {
        handleSelectLesson(compRes.next_lesson.id);
      }
    } catch (e) {
      console.error('Error completing lesson:', e);
    }
  };

  // Handle In-Lesson Doubt
  const handleAskDoubt = async (question: string) => {
    if (!activeCourseId || !activeLessonId) return;
    setIsAskingDoubt(true);
    try {
      const doubt = await apiClient.askLessonDoubt(
        activeCourseId,
        activeLessonId,
        question,
        selectedModel
      );
      if (activeLesson) {
        setActiveLesson({
          ...activeLesson,
          doubts: [...activeLesson.doubts, doubt],
        });
      }
    } catch (e) {
      console.error('Error asking doubt:', e);
    } finally {
      setIsAskingDoubt(false);
    }
  };

  // Handle Knowledge Check Submission
  const handleSubmitCheck = async (selectedOptionIndex: number) => {
    if (!activeCourseId || !activeLessonId) {
      throw new Error('No active lesson');
    }
    return apiClient.submitKnowledgeCheck(
      activeCourseId,
      activeLessonId,
      selectedOptionIndex
    );
  };

  // Return to Catalog
  const handleBackToCatalog = () => {
    setActiveCourseId(null);
    setActiveCourse(null);
    setActiveLessonId(null);
    setActiveLesson(null);
    loadCourses();
  };

  // If viewing catalog
  if (!activeCourseId || !activeCourse) {
    return (
      <CourseCatalog
        courses={courses}
        isLoading={isLoadingCatalog}
        onSelectCourse={handleSelectCourse}
      />
    );
  }

  // Current lesson index check for last lesson
  const currentLessonIndex = activeCourse.lessons.findIndex((l) => l.id === activeLessonId);
  const isLastLesson = currentLessonIndex === activeCourse.lessons.length - 1;

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* 10-Lesson Creator Curriculum Sidebar */}
      <CurriculumSidebar
        course={activeCourse}
        activeLessonId={activeLessonId || ''}
        onSelectLesson={handleSelectLesson}
        onBackToCatalog={handleBackToCatalog}
      />

      {/* Main Lesson Reading Panel */}
      {activeLesson ? (
        <LessonViewer
          lesson={activeLesson}
          isLoading={isLoadingLesson}
          onContinue={handleContinueLesson}
          onOpenDoubtDrawer={() => setIsDoubtDrawerOpen(true)}
          onViewSource={onViewSource}
          onSubmitCheck={handleSubmitCheck}
          isLastLesson={isLastLesson}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          Loading lesson...
        </div>
      )}

      {/* Interactive Doubt Clearing Drawer */}
      <LessonDoubtDrawer
        isOpen={isDoubtDrawerOpen}
        onClose={() => setIsDoubtDrawerOpen(false)}
        lessonTitle={activeLesson?.title || ''}
        doubts={activeLesson?.doubts || []}
        onAskDoubt={handleAskDoubt}
        isAsking={isAskingDoubt}
      />

      {/* Completion Modal */}
      <CourseCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        course={activeCourse}
        onExploreInChat={onExploreInChat}
      />
    </div>
  );
}
