import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { BookOpen, CheckCircle, Lock, Unlock, BarChart2, ArrowRight, Sparkles, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CourseListPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [coursesPerPage, setCoursesPerPage] = useState(6);

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

    const filteredCourses = useMemo(() => {
        return courses.filter((c) => {
            const matchesSearch =
                c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesLevel = selectedLevel === 'All' || c.level === selectedLevel;
            return matchesSearch && matchesLevel;
        });
    }, [courses, searchTerm, selectedLevel]);

    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage) || 1;
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * coursesPerPage;
        return filteredCourses.slice(start, start + coursesPerPage);
    }, [filteredCourses, currentPage, coursesPerPage]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Interactive Learning Platform</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">CyberLoy Course Catalog</h1>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl">
                        Enroll in cybersecurity modules, complete hands-on tasks, track your progress percentage, and earn verified certificates upon completion.
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search courses by title, topic, or keyword..."
                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedLevel}
                        onChange={(e) => {
                            setSelectedLevel(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                        <option value="All">All Difficulty Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Expert">Expert</option>
                    </select>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span>Show:</span>
                        <select
                            value={coursesPerPage}
                            onChange={(e) => {
                                setCoursesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-[#f8fafc] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                        >
                            <option value={3}>3</option>
                            <option value={6}>6</option>
                            <option value={12}>12</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400 text-xs">
                    Loading courses...
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
                    No courses found matching your search and filter criteria.
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedCourses.map((course) => {
                            const price = Number(course.price || 49.00).toFixed(2);
                            const currency = course.currency || 'USD';

                            return (
                                <div
                                    key={course.id}
                                    className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition group shadow-sm relative overflow-hidden"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                {course.level}
                                            </span>
                                            {course.is_unlocked ? (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                                    <Unlock className="w-3 h-3" /> Unlocked
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 font-mono">
                                                    ${price} {currency}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-[#0f172a] group-hover:text-blue-600 transition line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        {course.is_unlocked && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs mb-1 text-slate-600">
                                                    <span>Progress</span>
                                                    <span className="text-blue-600 font-bold">{course.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                                                        style={{ width: `${course.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                                                {course.modules_count || 0} Modules
                                            </span>

                                            <Link
                                                to={`/courses/${course.id}`}
                                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm ${
                                                    course.is_unlocked
                                                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                                                        : 'bg-[#0f172a] hover:bg-[#1e293b] text-white'
                                                }`}
                                            >
                                                {course.is_unlocked ? (
                                                    <>
                                                        <span>Continue Course</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
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

                    {/* Pagination Bar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                        <span>
                            Showing <span className="text-[#0f172a] font-bold">{(currentPage - 1) * coursesPerPage + 1}</span> to{' '}
                            <span className="text-[#0f172a] font-bold">{Math.min(currentPage * coursesPerPage, filteredCourses.length)}</span> of{' '}
                            <span className="text-blue-600 font-bold">{filteredCourses.length}</span> courses
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs flex items-center gap-1"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                    key={pg}
                                    onClick={() => setCurrentPage(pg)}
                                    className={`w-8 h-8 rounded-xl font-bold transition text-xs ${
                                        currentPage === pg
                                            ? 'bg-[#0f172a] text-white shadow-sm'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {pg}
                                </button>
                            ))}

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 text-xs font-semibold transition shadow-xs flex items-center gap-1"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
