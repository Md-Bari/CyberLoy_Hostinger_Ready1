import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import YouTubePlayer from '../components/YouTubePlayer';
import {
    BookOpen, CheckCircle2, Circle, Lock, Play, ArrowLeft, ArrowRight,
    ChevronDown, ChevronUp, ShieldCheck, Award, FileText, Sparkles, AlertCircle, Download
} from 'lucide-react';

export default function LearnCoursePage() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [completionToast, setCompletionToast] = useState('');
    const [assessmentAnswers, setAssessmentAnswers] = useState([]);
    const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);

    useEffect(() => {
        loadClassroomData(lessonId);
    }, [courseId, lessonId]);

    const loadClassroomData = async (targetLessonId) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.getLesson(courseId, targetLessonId);
            setData(res);
            const currentSubmissionAnswers = res?.lesson?.assessment_submission?.answers || [];
            setAssessmentAnswers(Array.isArray(currentSubmissionAnswers) ? currentSubmissionAnswers : []);
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

    const handleAssessmentSubmit = async () => {
        if (!data?.lesson?.assessment_type || data.lesson.assessment_type === 'none') {
            return;
        }

        setAssessmentSubmitting(true);
        try {
            await api.submitAssessment(courseId, lessonId, assessmentAnswers);
            setCompletionToast('✅ Assessment submitted successfully.');
            setTimeout(() => setCompletionToast(''), 5000);
            await loadClassroomData(lessonId);
        } catch (err) {
            console.error('Failed to submit assessment:', err);
            setError(err.message || 'Failed to submit assessment.');
        } finally {
            setAssessmentSubmitting(false);
        }
    };


    if (loading && !data) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center text-blue-600 font-mono text-sm">
                <span className="animate-pulse">Loading Classroom Theatre & Video Curriculum...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold text-[#0f172a]">Lesson Access Notice</h2>
                <p className="text-sm text-slate-500">{error || 'Lesson not found or locked.'}</p>
                <div className="pt-2">
                    <Link
                        to={`/courses/${courseId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
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
    const assessmentQuestions = Array.isArray(lesson.assessment_config)
        ? lesson.assessment_config
        : (Array.isArray(lesson.assessment_config?.questions) ? lesson.assessment_config.questions : []);
    const assessmentMaxAttempts = Number(lesson.assessment_config?.max_attempts || 3);
    const attemptsUsed = Number(lesson.assessment_attempts_used || 0);
    const submission = lesson.assessment_submission;
    const submissionResults = Array.isArray(submission?.question_results) ? submission.question_results : [];
    const assessmentLocked = submission?.passed
        || submission?.status === 'submitted'
        || attemptsUsed >= assessmentMaxAttempts;

    return (
        <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex flex-col">
            {/* Top Navigation Bar */}
            <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-16 z-30">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/courses/${courseId}`}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition font-mono"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Course Curriculum</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-sm font-bold text-[#0f172a] tracking-tight line-clamp-1">{course.title}</h1>
                    </div>
                </div>

                {/* Overall Course Progress */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                        <div className="text-[11px] font-mono text-slate-500">
                            Course Progress: <span className="text-blue-600 font-bold">{course.progress_percentage}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            {course.completed_lessons} of {course.total_lessons} lessons completed
                        </div>
                    </div>
                    <div className="w-24 sm:w-32 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                            className={`h-full transition-all duration-500 ${isCourse100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                            style={{ width: `${course.progress_percentage}%` }}
                        />
                    </div>
                    {isCourse100 && (
                        <Link
                            to="/certificates"
                            className="hidden md:flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold font-mono"
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>100% Certificate Ready</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Completion Banner Alert */}
            {completionToast && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-center text-xs font-semibold text-emerald-700 flex items-center justify-center gap-2 animate-in fade-in">
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{completionToast}</span>
                </div>
            )}

            {/* Main Classroom Layout */}
            <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Video Theatre & Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* YouTube Player — only for lessons that have a video. Assessment-only
                        lessons are completed by passing the assessment instead. */}
                    {lesson.youtube_video_id && (
                        <YouTubePlayer
                            videoId={lesson.youtube_video_id}
                            lessonId={lesson.id}
                            lessonDuration={lesson.duration_seconds || 0}
                            initialProgress={lesson.watch_percentage || 0}
                            isCompleted={lesson.is_completed}
                            requiredPercentage={lesson.required_watch_percentage || 100}
                            onProgressUpdate={handleProgressUpdate}
                            onCompleted={handleLessonCompleted}
                        />
                    )}

                    {/* Lesson Title & Navigation Buttons */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div>
                                <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                                    Section {lesson.section?.sort_order || 1} • Lesson {lesson.sort_order || 1}
                                </span>
                                <h2 className="text-xl font-bold text-[#0f172a] mt-2 tracking-tight">{lesson.title}</h2>
                            </div>

                            {/* Previous & Next Navigation */}
                            <div className="flex items-center gap-2.5 shrink-0">
                                {navigation.previous_lesson_id ? (
                                    <button
                                        onClick={() => navigate(`/learn/${courseId}/${navigation.previous_lesson_id}`)}
                                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Previous</span>
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 text-xs font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
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
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        }`}
                                    >
                                        <span>Next Lesson</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lesson Description & Content */}
                        <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                            {lesson.description && (
                                <p className="text-slate-600">{lesson.description}</p>
                            )}
                            {lesson.content && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                                    <div className="text-blue-700 font-bold mb-2 flex items-center gap-1.5">
                                        <FileText className="w-4 h-4" /> Notes & Key Learning Points
                                    </div>
                                    <p>{lesson.content}</p>
                                </div>
                            )}

                            {lesson.pdf_url && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="text-blue-700 font-bold mb-2 flex items-center gap-1.5 text-xs">
                                        <Download className="w-4 h-4" /> Learning Material PDF
                                    </div>
                                    <a
                                        href={lesson.pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                                    >
                                        <Download className="w-4 h-4" />
                                        Open PDF Resource
                                    </a>
                                </div>
                            )}

                            {lesson.assessment_type && lesson.assessment_type !== 'none' && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <div className="text-blue-700 font-bold mb-2 flex items-center gap-1.5 text-xs">
                                        <FileText className="w-4 h-4" /> Assessment
                                    </div>

                                    {submission && (
                                        <div role="status" className="space-y-3 text-xs text-slate-600">
                                            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border font-semibold ${
                                                submission.passed
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                    : submission.status === 'submitted'
                                                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                        : 'bg-red-50 border-red-200 text-red-700'
                                            }`}>
                                                {submission.passed ? 'Passed' : submission.status === 'submitted' ? 'Waiting for instructor review' : 'Not passed'}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-slate-500">
                                                <p>Attempt {submission.attempt_number} of {assessmentMaxAttempts}</p>
                                                {submission.score !== null && submission.score !== undefined && <p className="text-blue-700 font-semibold">Overall score: {submission.score}%</p>}
                                            </div>
                                            {submission.teacher_notes && <p className="text-slate-600">Instructor feedback: {submission.teacher_notes}</p>}
                                        </div>
                                    )}

                                    {submissionResults.length > 0 && (
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                                                <span>Question-by-question review</span>
                                                <span className="text-blue-700">{submission.score ?? 0}% total</span>
                                            </div>
                                            <div className="space-y-2">
                                                {submissionResults.map((result, index) => {
                                                    const selectedLabel = result.selected_answer ?? 'No answer selected';
                                                    const isCorrect = Boolean(result.is_correct);
                                                    return (
                                                        <div key={`${result.question}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                                            <div className="flex items-center justify-between gap-2 text-[11px]">
                                                                <span className="font-semibold text-slate-800">Q{index + 1}. {result.question || `Question ${index + 1}`}</span>
                                                                <span className={`rounded-full px-2 py-0.5 font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 grid gap-1 text-[11px] text-slate-600 sm:grid-cols-2">
                                                                <p><span className="text-slate-500">Your answer:</span> {selectedLabel}</p>
                                                                {result.correct_answer && <p><span className="text-slate-500">Correct answer:</span> {result.correct_answer}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {!assessmentLocked && (
                                        <div className="space-y-4">
                                            {submission && <p className="text-xs text-amber-700">You may submit another attempt.</p>}
                                            {assessmentQuestions.length === 0 ? (
                                                <p className="text-xs text-slate-500">No assessment questions are configured yet for this lesson.</p>
                                            ) : (
                                                assessmentQuestions.map((question, index) => (
                                                    <div key={index} className="space-y-2 p-3 rounded-xl bg-white border border-slate-200">
                                                        <p id={`assessment-question-${index}`} className="text-xs font-semibold text-slate-800">
                                                            {index + 1}. {question.question || question.text || `Question ${index + 1}`}
                                                        </p>

                                                        {lesson.assessment_type === 'mcq' ? (
                                                            <div role="radiogroup" aria-labelledby={`assessment-question-${index}`} className="space-y-2">
                                                                {(question.options || []).map((option, optionIndex) => (
                                                                    <label key={optionIndex} className="flex items-center gap-2 text-xs text-slate-700">
                                                                        <input
                                                                            type="radio"
                                                                            aria-label={`${question.question || question.text || `Question ${index + 1}`}: ${option}`}
                                                                            name={`question-${index}`}
                                                                            checked={assessmentAnswers[index] === option}
                                                                            onChange={() => {
                                                                                setAssessmentAnswers((prev) => {
                                                                                    const next = [...(prev || [])];
                                                                                    next[index] = option;
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            className="accent-blue-600"
                                                                        />
                                                                        <span>{option}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <textarea
                                                                aria-labelledby={`assessment-question-${index}`}
                                                                rows="3"
                                                                value={assessmentAnswers[index] || ''}
                                                                onChange={(e) => {
                                                                    setAssessmentAnswers((prev) => {
                                                                        const next = [...(prev || [])];
                                                                        next[index] = e.target.value;
                                                                        return next;
                                                                    });
                                                                }}
                                                                placeholder="Write your response here..."
                                                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                                            />
                                                        )}
                                                    </div>
                                                ))
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleAssessmentSubmit}
                                                disabled={assessmentSubmitting || assessmentQuestions.length === 0}
                                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition disabled:opacity-50"
                                            >
                                                {assessmentSubmitting ? 'Submitting...' : 'Submit Assessment'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Course Curriculum Sidebar */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-36">
                    <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                <span>Course Curriculum</span>
                            </h3>
                            <span className="text-[11px] text-slate-500 font-mono">
                                {course.sections?.length || 0} Sections • {course.total_lessons || 0} Lessons
                            </span>
                        </div>
                        <span className="text-xs font-bold text-blue-700 font-mono bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                            {course.progress_percentage}%
                        </span>
                    </div>

                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-3 space-y-3">
                        {course.sections?.map((sec, secIdx) => (
                            <div key={sec.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                    <div className="font-semibold text-xs text-slate-800">
                                        {sec.title}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                        {sec.completed_lessons}/{sec.total_lessons}
                                    </span>
                                </div>

                                <div className="divide-y divide-slate-100">
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
                                                        ? 'bg-blue-50 border-l-2 border-blue-600 text-blue-700'
                                                        : isLocked
                                                            ? 'opacity-50 cursor-not-allowed text-slate-500'
                                                            : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="mt-0.5 shrink-0">
                                                    {isDone ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    ) : isCurrent ? (
                                                        <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
                                                    ) : isLocked ? (
                                                        <Lock className="w-4 h-4 text-slate-400" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-medium leading-tight truncate ${isCurrent ? 'font-bold text-[#0f172a]' : ''}`}>
                                                        {les.title}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                                                        {les.youtube_video_id && les.duration_seconds > 0
                                                            ? <span>{Math.round(les.duration_seconds / 60)} mins</span>
                                                            : les.assessment_type && les.assessment_type !== 'none' && (
                                                                <span>{les.assessment_type === 'mcq' ? 'Quiz' : 'Assignment'}</span>
                                                            )}
                                                        {isDone && <span className="text-emerald-600 font-bold">• {les.youtube_video_id ? '100% Watched' : 'Completed'}</span>}
                                                        {isLocked && <span className="text-amber-600">• Locked</span>}
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
