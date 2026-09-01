import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import YouTubePlayer from '../components/YouTubePlayer';
import {
    BookOpen, CheckCircle2, Circle, Lock, Play, ArrowLeft, ArrowRight,
    ChevronDown, ChevronUp, ShieldCheck, Award, FileText, Sparkles, AlertCircle
} from 'lucide-react';

export default function LearnCoursePage() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [completionToast, setCompletionToast] = useState('');

    useEffect(() => {
        loadClassroomData(lessonId);
    }, [courseId, lessonId]);

    const loadClassroomData = async (targetLessonId) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.getLesson(courseId, targetLessonId);
            setData(res);
        } catch (err) {
            console.error('Failed to load lesson:', err);
            setError(err.message || 'Failed to load lesson content.');
        } finally {
            setLoading(false);
        }
    };

    const handleLessonCompleted = (progressData) => {
        setCompletionToast('🎉 Lesson Completed! Next lesson is now unlocked.');

        // Update local state to immediately show completion
        setData((prev) => {
            if (!prev) return prev;
            const updatedSections = prev.course.sections.map((sec) => {
                let secComp = 0;
                const updatedLessons = sec.lessons.map((les) => {
                    const isNowComp = les.id == lessonId ? true : les.is_completed;
                    if (isNowComp) secComp++;
                    return { ...les, is_completed: isNowComp };
                });
                return {
                    ...sec,
                    completed_lessons: secComp,
                    progress_percentage: sec.total_lessons > 0 ? Math.round((secComp / sec.total_lessons) * 100) : 0,
                    lessons: updatedLessons,
                };
            });

            return {
                ...prev,
                lesson: { ...prev.lesson, is_completed: true },
                course: {
                    ...prev.course,
                    progress_percentage: progressData.course_progress_percentage || prev.course.progress_percentage,
                    completed_lessons: progressData.completed_lessons || prev.course.completed_lessons,
                    sections: updatedSections,
                },
            };
        });

        setTimeout(() => setCompletionToast(''), 6000);
    };

    const handleProgressUpdate = (progressData) => {
        if (progressData.lesson_completed) {
            handleLessonCompleted(progressData);
        } else if (progressData.course_progress_percentage !== undefined) {
            setData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    course: {
                        ...prev.course,
                        progress_percentage: progressData.course_progress_percentage,
                        completed_lessons: progressData.completed_lessons,
                    },
                };
            });
        }
    };


    if (loading && !data) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center text-cyan-400 font-mono text-sm">
                <span className="animate-pulse">Loading Classroom Theatre & Video Curriculum...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-xl mx-auto my-20 p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                <h2 className="text-xl font-bold text-white">Lesson Access Notice</h2>
                <p className="text-sm text-slate-400">{error || 'Lesson not found or locked.'}</p>
                <div className="pt-2">
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Return to Course Overview</span>
                    </Link>
                </div>
            </div>
        );
    }

    const { course, lesson, navigation } = data;
    const isCompleted = lesson.is_completed;
    const isCourse100 = course.progress_percentage >= 100;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Top Navigation Bar */}
            <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-16 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/courses/${courseId}`}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition font-mono"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Course Curriculum</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-800" />
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight line-clamp-1">{course.title}</h1>
                    </div>
                </div>

                {/* Overall Course Progress */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        <div className="text-[11px] font-mono text-slate-400">
                            Course Progress: <span className="text-cyan-400 font-bold">{course.progress_percentage}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            {course.completed_lessons} of {course.total_lessons} lessons completed
                        </div>
                    </div>
                    <div className="w-24 sm:w-32 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                            className={`h-full transition-all duration-500 ${isCourse100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                            style={{ width: `${course.progress_percentage}%` }}
                        />
                    </div>
                    {isCourse100 && (
                        <Link
                            to="/certificates"
                            className="hidden md:flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono"
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>100% Certificate Ready</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Completion Banner Alert */}
            {completionToast && (
                <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-6 py-3 text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2 animate-in fade-in">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{completionToast}</span>
                </div>
            )}

            {/* Main Classroom Layout */}
            <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Video Theatre & Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* YouTube Player */}
                    <YouTubePlayer
                        videoId={lesson.youtube_video_id || 'inWWhr5tnEA'}
                        lessonId={lesson.id}
                        lessonDuration={lesson.duration_seconds || 0}
                        initialProgress={lesson.watch_percentage || 0}
                        isCompleted={lesson.is_completed}
                        requiredPercentage={lesson.required_watch_percentage || 100}
                        onProgressUpdate={handleProgressUpdate}
                        onCompleted={handleLessonCompleted}
                    />

                    {/* Lesson Title & Navigation Buttons */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                            <div>
                                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                                    Section {lesson.section?.sort_order || 1} • Lesson {lesson.sort_order || 1}
                                </span>
                                <h2 className="text-xl font-bold text-white mt-2 tracking-tight">{lesson.title}</h2>
                            </div>

                            {/* Previous & Next Navigation */}
                            <div className="flex items-center gap-2.5 shrink-0">
                                {navigation.previous_lesson_id ? (
                                    <button
                                        onClick={() => navigate(`/learn/${courseId}/${navigation.previous_lesson_id}`)}
                                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Previous</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 text-xs font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Previous</span>
                                    </button>
                                )}

                                {navigation.next_lesson_id && (
                                    <button
                                        onClick={() => navigate(`/learn/${courseId}/${navigation.next_lesson_id}`)}
                                        disabled={!isCompleted && course.progression_mode === 'sequential' && user?.role !== 'admin'}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                                            isCompleted || course.progression_mode !== 'sequential' || user?.role === 'admin'
                                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                        }`}
                                    >
                                        <span>Next Lesson</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lesson Description & Content */}
                        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                            {lesson.description && (
                                <p className="text-slate-300">{lesson.description}</p>
                            )}
                            {lesson.content && (
                                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300">
                                    <div className="text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4" /> Notes & Key Learning Points
                                    </div>
                                    <p>{lesson.content}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Course Curriculum Sidebar */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl sticky top-36">
                    <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-cyan-400" />
                                <span>Course Curriculum</span>
                            </h3>
                            <span className="text-[11px] text-slate-500 font-mono">
                                {course.sections?.length || 0} Sections • {course.total_lessons || 0} Lessons
                            </span>
                        </div>
                        <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                            {course.progress_percentage}%
                        </span>
                    </div>

                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto divide-y divide-slate-800/60 p-3 space-y-3">
                        {course.sections?.map((sec, secIdx) => (
                            <div key={sec.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
                                <div className="p-3.5 bg-slate-950 border-b border-slate-800/60 flex items-center justify-between">
                                    <div className="font-semibold text-xs text-slate-200">
                                        {sec.title}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {sec.completed_lessons}/{sec.total_lessons}
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-800/40">
                                    {sec.lessons?.map((les) => {
                                        const isCurrent = les.is_current || les.id == lessonId;
                                        const isDone = les.is_completed;
                                        const isLocked = les.is_locked && !isDone && user?.role !== 'admin';

                                        return (
                                            <button
                                                key={les.id}
                                                type="button"
                                                disabled={isLocked}
                                                onClick={() => !isLocked && navigate(`/learn/${courseId}/${les.id}`)}
                                                className={`w-full text-left p-3 flex items-start gap-3 transition ${
                                                    isCurrent
                                                        ? 'bg-cyan-950/40 border-l-2 border-cyan-400 text-cyan-300'
                                                        : isLocked
                                                            ? 'opacity-40 cursor-not-allowed bg-slate-950/30'
                                                            : 'hover:bg-slate-800/50 text-slate-300'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {isDone ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    ) : isCurrent ? (
                                                        <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                                                    ) : isLocked ? (
                                                        <Lock className="w-4 h-4 text-slate-600" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-slate-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-medium leading-tight truncate ${isCurrent ? 'font-bold text-white' : ''}`}>
                                                        {les.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                                                        <span>{Math.round(les.duration_seconds / 60)} mins</span>
                                                        {isDone && <span className="text-emerald-400 font-bold">• 100% Watched</span>}
                                                        {isLocked && <span className="text-amber-500">• Locked</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
