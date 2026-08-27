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
        return <div className="text-center py-20 text-slate-500 font-mono text-sm">Loading course curriculum...</div>;
    }

    if (!course) {
        return <div className="text-center py-20 text-red-400">Course not found.</div>;
    }

    const coursePrice = Number(course.price || 49.00).toFixed(2);
    const currency = course.currency || 'USD';
    const firstLessonId = course.next_lesson_id || course.sections?.[0]?.lessons?.[0]?.id;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Back link */}
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 mb-6 transition font-mono">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Courses</span>
            </Link>

            {statusMessage && (
                <div className="mb-6 p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-sm flex items-center gap-3 shadow-lg animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Course Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl mb-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-semibold">
                                {course.level}
                            </span>
                            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                                {course.category || 'Cybersecurity'}
                            </span>
                            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {course.duration || '4 Weeks'}
                            </span>
                            {course.is_unlocked ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold">
                                    <Unlock className="w-3 h-3" /> Unlocked & Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-400 text-xs font-semibold">
                                    <Lock className="w-3 h-3" /> Premium Course • ${coursePrice} {currency}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{course.title}</h1>
                        <p className="text-sm text-slate-300 leading-relaxed">{course.description}</p>

                        <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 font-mono">
                            <span>Instructor: <strong className="text-slate-200">{course.instructor_name || 'CyberLoy Lead'}</strong></span>
                            <span>•</span>
                            <span>Progression: <strong className="text-cyan-400 capitalize">{course.progression_mode || 'sequential'}</strong></span>
                        </div>
                    </div>

                    {/* Right Action / Progress Card */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shrink-0 min-w-[300px] text-center shadow-xl">
                        {course.is_unlocked ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs font-mono text-slate-400 mb-1">Course Progress</div>
                                    <div className="text-3xl font-black text-cyan-400 font-mono">{course.progress_percentage}%</div>
                                    <div className="w-full bg-slate-900 rounded-full h-2.5 my-3 border border-slate-800 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                                            style={{ width: `${course.progress_percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                        {course.completed_lessons} of {course.total_lessons} lessons completed
                                    </p>
                                </div>

                                {firstLessonId && (
                                    <Link
                                        to={`/learn/${course.id}/${firstLessonId}`}
                                        className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 group"
                                    >
                                        <Play className="w-4 h-4 fill-slate-950" />
                                        <span>{course.progress_percentage > 0 ? 'Continue Learning' : 'Start Course Now'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                )}

                                {course.progress_percentage >= 100 && (
                                    <Link
                                        to="/certificates"
                                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition"
                                    >
                                        <Award className="w-4 h-4" />
                                        <span>View Verified Certificate</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="text-xs text-slate-400">Unlock full video lessons, anti-skip playback & verified certificate.</div>
                                <div className="text-3xl font-black text-white font-mono">
                                    ${coursePrice} <span className="text-xs text-slate-500 font-sans font-normal">{currency}</span>
                                </div>
                                <button
                                    onClick={handleUnlockClick}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span>Unlock Course with Payment</span>
                                </button>
                                <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-mono">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Access • 100% Secure
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Course Curriculum & Sections */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                        <span>Course Curriculum & Video Lessons</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                        {course.sections?.length || 0} Sections • {course.total_lessons || 0} Lessons
                    </span>
                </div>

                {!course.is_unlocked && (
                    <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                            <span>This course curriculum is currently locked. Complete payment of ${coursePrice} to unlock video player tracking and complete lessons.</span>
                        </div>
                        <button
                            onClick={handleUnlockClick}
                            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
                        >
                            Unlock Now
                        </button>
                    </div>
                )}

                {course.sections?.map((section, sIdx) => (
                    <div key={section.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-cyan-300 font-mono">
                                    Section {sIdx + 1}: {section.title}
                                </span>
                                {section.description && (
                                    <p className="text-xs text-slate-400 mt-0.5">{section.description}</p>
                                )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                                {section.completed_lessons || 0}/{section.total_lessons || section.lessons?.length || 0} Completed
                            </span>
                        </div>

                        <div className="divide-y divide-slate-800/50">
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
                                                ? 'bg-cyan-950/10 hover:bg-slate-800/40'
                                                : isLocked
                                                    ? 'opacity-50 hover:bg-slate-950/40'
                                                    : 'hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {lesson.is_completed ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                ) : isLocked ? (
                                                    <Lock className="w-5 h-5 text-slate-600" />
                                                ) : (
                                                    <Play className="w-5 h-5 text-cyan-400" />
                                                )}
                                            </div>

                                            <div>
                                                <h4 className={`text-sm font-semibold ${lesson.is_completed ? 'text-slate-300' : 'text-white'}`}>
                                                    Lesson {lIdx + 1}: {lesson.title}
                                                </h4>
                                                {lesson.description && (
                                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{lesson.description}</p>
                                                )}
                                                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                                                    <span>{Math.round((lesson.duration_seconds || 600) / 60)} mins video</span>
                                                    <span>•</span>
                                                    <span>Requires 100% watch to unlock next</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="shrink-0 flex items-center gap-2">
                                            {lesson.is_completed ? (
                                                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono">
                                                    Completed
                                                </span>
                                            ) : isLocked ? (
                                                <span className="px-2.5 py-1 rounded text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800">
                                                    Locked
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-xs transition border border-cyan-500/30 font-mono">
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
