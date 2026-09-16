import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, CheckCircle2, Lock, Unlock, Play, ArrowLeft, ArrowRight,
    ShieldCheck, Sparkles, CreditCard, Clock, BarChart2, Award, FileText
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const fetchCourseDetails = async () => {
        try {
            const data = await api.getCourseDetails(id);
            setCourse(data);
        } catch (e) {
            console.error('Failed to load course details:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUnlockClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = async (res) => {
        setShowPaymentModal(false);
        setCourse((prev) => prev ? {
            ...prev,
            is_unlocked: true,
            is_enrolled: true,
            payment_status: 'paid',
        } : prev);
        setStatusMessage('🎉 Payment confirmed! Course successfully unlocked — you can now begin all lessons.');
        try {
            await fetchCourseDetails();
        } catch (e) {
            console.error('Background refresh error:', e);
        }
        setTimeout(() => setStatusMessage(''), 6000);
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#f4f7fb] text-slate-500">
                <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-xs font-semibold">Loading course curriculum...</p>
            </div>
        );
    }

    if (!course) {
        return <div className="text-center py-20 text-red-500 font-semibold">Course not found.</div>;
    }

    const coursePrice = Number(course.price || 49.00).toFixed(2);
    const currency = course.currency || 'USD';
    const firstLessonId = course.next_lesson_id || course.sections?.[0]?.lessons?.[0]?.id;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Back link */}
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition font-semibold">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Courses</span>
            </Link>

            {statusMessage && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-sm animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Course Header Banner (Clean White Card) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                                {course.level}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                                {course.category || 'Cybersecurity'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" /> {course.duration || '4 Weeks'}
                            </span>
                            {course.is_unlocked ? (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                                    <Unlock className="w-3 h-3" /> Unlocked & Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                                    <Lock className="w-3 h-3" /> Premium Course • ${coursePrice} {currency}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">{course.title}</h1>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{course.description}</p>

                        <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
                            <span>Instructor: <strong className="text-[#0f172a]">{course.instructor_name || 'CyberLoy Lead'}</strong></span>
                            <span>•</span>
                            <span>Progression: <strong className="text-blue-600 capitalize">{course.progression_mode || 'sequential'}</strong></span>
                        </div>
                    </div>

                    {/* Right Action / Progress Card (Clean White Small Card) */}
                    <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-6 shrink-0 min-w-[300px] text-center shadow-xs">
                        {course.is_unlocked ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1 font-semibold">Course Progress</div>
                                    <div className="text-3xl font-black text-blue-600">{course.progress_percentage}%</div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 my-3 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                                            style={{ width: `${course.progress_percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {course.completed_lessons} of {course.total_lessons} lessons completed
                                    </p>
                                </div>

                                {firstLessonId && (
                                    <Link
                                        to={`/learn/${course.id}/${firstLessonId}`}
                                        className="w-full py-3 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 group"
                                    >
                                        <Play className="w-4 h-4 fill-white" />
                                        <span>{course.progress_percentage > 0 ? 'Continue Learning' : 'Start Course Now'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}

                                {course.progress_percentage >= 100 && (
                                    <Link
                                        to="/certificates"
                                        className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                    >
                                        <Award className="w-4 h-4 text-amber-600" />
                                        <span>View Verified Certificate</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-xs text-slate-500">Unlock full video lessons, anti-skip playback & verified certificate.</div>
                                <div className="text-3xl font-black text-[#0f172a]">
                                    ${coursePrice} <span className="text-xs text-slate-400 font-normal">{currency}</span>
                                </div>
                                <button
                                    onClick={handleUnlockClick}
                                    className="w-full py-3 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4 text-cyan-400" />
                                    <span>Unlock Course with Payment</span>
                                </button>
                                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1 font-semibold">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant Access • 100% Secure
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Curriculum & Sections */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>Course Curriculum & Video Lessons</span>
                    </h2>
                    <span className="text-xs text-slate-500">
                        {course.sections?.length || 0} Sections • {course.total_lessons || 0} Lessons
                    </span>
                </div>

                {!course.is_unlocked && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                            <span>This course curriculum is currently locked. Complete payment of ${coursePrice} to unlock video player tracking and complete lessons.</span>
                        </div>
                        <button
                            onClick={handleUnlockClick}
                            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                        >
                            Unlock Now
                        </button>
                    </div>
                )}

                {course.sections?.map((section, sIdx) => (
                    <div key={section.id} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-[#f8fafc] px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-700">
                                    Section {sIdx + 1}: {section.title}
                                </span>
                                {section.description && (
                                    <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                )}
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">
                                {section.completed_lessons || 0}/{section.total_lessons || section.lessons?.length || 0} Completed
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {section.lessons?.map((lesson, lIdx) => {
                                const isLocked = lesson.is_locked && !lesson.is_completed && user?.role !== 'admin';

                                return (
                                    <div
                                        key={lesson.id}
                                        onClick={() => {
                                            if (!isLocked && course.is_unlocked) {
                                                navigate(`/learn/${course.id}/${lesson.id}`);
                                            } else if (!course.is_unlocked) {
                                                handleUnlockClick();
                                            }
                                        }}
                                        className={`p-5 flex items-start justify-between gap-4 transition cursor-pointer ${
                                            lesson.is_completed
                                                ? 'bg-blue-50/20 hover:bg-blue-50/40'
                                                : isLocked
                                                    ? 'opacity-60 hover:bg-slate-50'
                                                    : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {lesson.is_completed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                ) : isLocked ? (
                                                    <Lock className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <Play className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>

                                            <div>
                                                <h4 className={`text-sm font-semibold ${lesson.is_completed ? 'text-slate-600' : 'text-[#0f172a]'}`}>
                                                    Lesson {lIdx + 1}: {lesson.title}
                                                </h4>
                                                {lesson.description && (
                                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{lesson.description}</p>
                                                )}
                                                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                                                    <span>{Math.round((lesson.duration_seconds || 600) / 60)} mins video</span>
                                                    <span>•</span>
                                                    <span>Requires 100% watch to unlock next</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {lesson.is_completed ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                                                    Completed
                                                </span>
                                            ) : isLocked ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 border border-slate-200">
                                                    Locked
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition border border-blue-200">
                                                    Watch Video →
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                course={course}
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
            />
        </div>
    );
}
