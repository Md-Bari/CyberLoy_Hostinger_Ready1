import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { BookOpen, CheckCircle, Lock, Unlock, BarChart2, ArrowRight, Sparkles } from 'lucide-react';

export default function CourseListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const data = await api.getCourses();
            setCourses(data || []);
        } catch (e) {
            console.error('Failed to load courses:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header banner */}
            <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-400 text-xs font-mono mb-3">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Interactive Learning Platform</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">CyberLoy Course Catalog</h1>
                    <p className="text-slate-400 text-sm mt-1 max-w-xl">
                        Enroll in cybersecurity modules, complete hands-on tasks, track your progress percentage, and earn verified certificates upon completion.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-mono text-sm">
                    Loading courses...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const price = Number(course.price || 49.00).toFixed(2);
                        const currency = course.currency || 'USD';

                        return (
                            <div
                                key={course.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition group shadow-lg relative overflow-hidden"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                            {course.level}
                                        </span>
                                        {course.is_unlocked ? (
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/80">
                                                <Unlock className="w-3 h-3" /> Unlocked
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/80 font-mono">
                                                ${price} {currency}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition line-clamp-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                        {course.description}
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800/80">
                                    {course.is_unlocked && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[11px] font-mono mb-1 text-slate-300">
                                                <span>Progress</span>
                                                <span className="text-cyan-400 font-bold">{course.progress_percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                                <div
                                                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                                                    style={{ width: `${course.progress_percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                            <BarChart2 className="w-3.5 h-3.5" />
                                            {course.modules_count || 0} Modules
                                        </span>

                                        <Link
                                            to={`/courses/${course.id}`}
                                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition ${
                                                course.is_unlocked
                                                    ? 'bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/30'
                                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950'
                                            }`}
                                        >
                                            {course.is_unlocked ? (
                                                <>
                                                    <span>Continue Course</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-3.5 h-3.5" />
                                                    <span>Unlock Course</span>
                                                </>
                                            )}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
