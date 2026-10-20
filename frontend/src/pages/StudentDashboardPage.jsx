import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { BookOpen, Award, Bell, TrendingUp, CheckCircle, Clock } from 'lucide-react';

export default function StudentDashboardPage() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.studentDashboard();
            setDashboard(res);
        } catch (e) {
            console.error('Failed to load dashboard', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center text-slate-500 text-sm">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f7fb] py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
                            <p className="text-slate-600 text-sm mt-1">Continue your learning journey today</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/courses" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Browse Courses
                            </Link>
                            <Link to="/certificates" className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                My Certificates
                            </Link>
                        </div>
                    </div>
                </div>

                {dashboard?.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[{ label: 'Enrolled', value: dashboard.stats.enrolled_courses, icon: BookOpen }, { label: 'Completed', value: dashboard.stats.completed_courses, icon: CheckCircle }, { label: 'In Progress', value: dashboard.stats.in_progress, icon: TrendingUp }, { label: 'Certificates', value: dashboard.stats.certificates, icon: Award }, { label: 'Hours Est.', value: dashboard.stats.total_hours, icon: Clock }].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-600 text-xs font-medium">{stat.label}</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                    <stat.icon className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" />My Courses</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {dashboard?.courses?.length === 0 && <p className="text-center text-slate-500 py-8 text-sm">No courses enrolled yet</p>}
                                {dashboard?.courses?.map((course) => (
                                    <Link key={course.id} to={`/courses/${course.id}`} className="block p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{course.title}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{course.category} • {course.level}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-40 bg-slate-200 rounded-full h-2 overflow-hidden"><div className="bg-blue-600 h-full" style={{ width: `${course.progress_percentage}%` }} /></div>
                                                <span className="text-xs font-semibold text-slate-700">{course.progress_percentage}%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">{course.completed_lessons}/{course.total_lessons} lessons completed</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {dashboard?.announcements?.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <div className="p-6 border-b border-slate-200">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-600" />Announcements</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {dashboard.announcements.map((ann) => (
                                        <div key={ann.id} className="p-4 border-l-4 border-blue-600 bg-blue-50/50 rounded-r-xl">
                                            <h3 className="font-semibold text-slate-900 text-sm">{ann.title}</h3>
                                            <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{ann.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Bell className="w-5 h-5 text-indigo-600" />Notifications</h2>
                            </div>
                            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                                {dashboard?.notifications?.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">No notifications yet</p>}
                                {dashboard?.notifications?.map((n) => (
                                    <div key={n.id} className="p-3 border border-slate-200 rounded-lg">
                                        <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                                        <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Award className="w-5 h-5 text-amber-600" />Recent Certificates</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {dashboard?.certificates?.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">No certificates yet</p>}
                                {dashboard?.certificates?.map((cert) => (
                                    <div key={cert.id} className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg">
                                        <p className="font-medium text-slate-900 text-sm">{cert.course?.title}</p>
                                        <p className="text-xs text-slate-600 mt-1">Code: {cert.certificate_code}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
