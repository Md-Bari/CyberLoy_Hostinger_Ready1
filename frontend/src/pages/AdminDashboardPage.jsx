import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import PortalSidebar from '../components/PortalSidebar';
import {
    Shield, Users, BookOpen, Award, CheckCircle, AlertCircle, DollarSign,
    CreditCard, Plus, Lock, Check, Trash2, Eye, Play, Sparkles, X, ChevronRight,
    Search, Filter, RefreshCw, Edit3, Settings, Save, ArrowUpRight, CheckSquare,
    TrendingUp, BarChart2, ChevronLeft, UserCheck, CheckCircle2, ShieldAlert, PhoneCall, Mail
} from 'lucide-react';



export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [courses, setCourses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'support' | 'builder' | 'payments' | 'new_course'
    const [issuing, setIssuing] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Emergency Support State
    const [emergencyTickets, setEmergencyTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    // Search & Pagination state for Users Directory
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;



    // Course Builder State
    const [selectedCourseForBuilder, setSelectedCourseForBuilder] = useState(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [newSectionDesc, setNewSectionDesc] = useState('');
    const [addingSection, setAddingSection] = useState(false);

    // Edit Course Modal State
    const [editingCourseModal, setEditingCourseModal] = useState(null);
    const [editCourseForm, setEditCourseForm] = useState({
        title: '',
        description: '',
        level: 'Beginner',
        category: 'Cybersecurity',
        duration: '4 Weeks',
        price: '49.00',
        progression_mode: 'sequential',
        status: 'published',
    });
    const [savingCourse, setSavingCourse] = useState(false);

    // Edit Section Modal State
    const [editingSectionModal, setEditingSectionModal] = useState(null);
    const [editSectionForm, setEditSectionForm] = useState({ title: '', description: '' });
    const [savingSection, setSavingSection] = useState(false);

    // Add / Edit Lesson Modal State
    const [lessonModalSectionId, setLessonModalSectionId] = useState(null);
    const [editingLessonModal, setEditingLessonModal] = useState(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDesc, setNewLessonDesc] = useState('');
    const [newLessonYoutubeUrl, setNewLessonYoutubeUrl] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState('600');
    const [addingLesson, setAddingLesson] = useState(false);

    // New Course Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newLevel, setNewLevel] = useState('Beginner');
    const [newCategory, setNewCategory] = useState('Cybersecurity');
    const [newDuration, setNewDuration] = useState('4 Weeks');
    const [newPrice, setNewPrice] = useState('49.00');
    const [newProgressionMode, setNewProgressionMode] = useState('sequential');
    const [creatingCourse, setCreatingCourse] = useState(false);

    useEffect(() => {
        loadAdminData();
    }, []);

    const fetchEmergencyTickets = async () => {
        setLoadingTickets(true);
        try {
            const data = await api.getEmergencySupportTickets();
            setEmergencyTickets(data || []);
        } catch (err) {
            console.error('Failed to load emergency tickets:', err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const handleUpdateTicketStatus = async (id, status) => {
        try {
            await api.updateEmergencySupportStatus(id, status);
            setEmergencyTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            setMessage(`Ticket #${id} status updated to ${status}.`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [statsData, activitiesData, coursesData, paymentsData, ticketsData] = await Promise.all([
                api.getAdminStats(),
                api.getUserActivities(),
                api.getCourses(),
                api.getAdminPayments().catch(() => []),
                api.getEmergencySupportTickets().catch(() => []),
            ]);
            setStats(statsData);
            setActivities(activitiesData || []);
            setCourses(coursesData || []);
            setPayments(paymentsData || []);
            setEmergencyTickets(ticketsData || []);


            // Refresh builder course state if selected
            if (selectedCourseForBuilder) {
                const refreshed = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(refreshed);
            }
        } catch (e) {
            console.error('Failed to load admin data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleIssueCertificate = async (userId, courseId, userName, courseTitle) => {
        if (!window.confirm(`Issue verified completion certificate to ${userName} for "${courseTitle}"?`)) {
            return;
        }

        setIssuing(`${userId}-${courseId}`);
        setMessage('');

        try {
            const res = await api.issueCertificate({ user_id: userId, course_id: courseId });
            setMessage(`Success! Certificate (${res.certificate?.certificate_code}) issued to ${userName}.`);
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to issue certificate');
        } finally {
            setIssuing(null);
        }
    };

    const handleViewStudentDetail = async (userId) => {
        setLoadingDetail(true);
        try {
            const res = await api.getStudentProgressDetail(userId);
            setSelectedStudentDetail(res);
        } catch (e) {
            alert('Failed to load student progress detail');
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setCreatingCourse(true);
        setMessage('');

        try {
            await api.createCourse({
                title: newTitle,
                description: newDescription,
                level: newLevel,
                category: newCategory,
                duration: newDuration,
                price: parseFloat(newPrice) || 0,
                progression_mode: newProgressionMode,
                status: 'published',
            });

            setMessage(`Course "${newTitle}" published successfully!`);
            setNewTitle('');
            setNewDescription('');
            setNewPrice('49.00');
            setActiveTab('builder');
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to create course');
        } finally {
            setCreatingCourse(false);
        }
    };

    const openEditCourseModal = (course) => {
        setEditingCourseModal(course);
        setEditCourseForm({
            title: course.title,
            description: course.description || '',
            level: course.level || 'Beginner',
            category: course.category || 'Cybersecurity',
            duration: course.duration || '4 Weeks',
            price: String(course.price || 49.00),
            progression_mode: course.progression_mode || 'sequential',
            status: course.status || 'published',
        });
    };

    const handleSaveCourseSettings = async (e) => {
        e.preventDefault();
        if (!editingCourseModal) return;
        setSavingCourse(true);
        try {
            await api.updateCourse(editingCourseModal.id, {
                ...editCourseForm,
                price: parseFloat(editCourseForm.price) || 0,
            });
            setMessage(`Course "${editCourseForm.title}" updated successfully!`);
            setEditingCourseModal(null);
            await loadAdminData();
            if (selectedCourseForBuilder?.id === editingCourseModal.id) {
                const refreshed = await api.getCourseDetails(editingCourseModal.id);
                setSelectedCourseForBuilder(refreshed);
            }
        } catch (e) {
            alert(e.message || 'Failed to update course settings');
        } finally {
            setSavingCourse(false);
        }
    };

    const handleDeleteCourse = async (courseId, courseTitle) => {
        if (!window.confirm(`Delete course "${courseTitle}" and all its sections/lessons?`)) return;
        try {
            await api.deleteCourse(courseId);
            setMessage(`Course "${courseTitle}" deleted.`);
            if (selectedCourseForBuilder?.id === courseId) {
                setSelectedCourseForBuilder(null);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to delete course');
        }
    };

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!selectedCourseForBuilder) return;
        setAddingSection(true);
        try {
            await api.addSection(selectedCourseForBuilder.id, {
                title: newSectionTitle,
                description: newSectionDesc,
            });
            setNewSectionTitle('');
            setNewSectionDesc('');
            const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
            setSelectedCourseForBuilder(updated);
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to add section');
        } finally {
            setAddingSection(false);
        }
    };

    const openEditSectionModal = (sec) => {
        setEditingSectionModal(sec);
        setEditSectionForm({
            title: sec.title,
            description: sec.description || '',
        });
    };

    const handleSaveSection = async (e) => {
        e.preventDefault();
        if (!editingSectionModal) return;
        setSavingSection(true);
        try {
            await api.updateSection(editingSectionModal.id, editSectionForm);
            setEditingSectionModal(null);
            if (selectedCourseForBuilder) {
                const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(updated);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to update section');
        } finally {
            setSavingSection(false);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!lessonModalSectionId) return;
        setAddingLesson(true);
        try {
            await api.addLesson(lessonModalSectionId, {
                title: newLessonTitle,
                description: newLessonDesc,
                youtube_url: newLessonYoutubeUrl,
                duration_seconds: parseInt(newLessonDuration, 10) || 600,
            });
            setNewLessonTitle('');
            setNewLessonDesc('');
            setNewLessonYoutubeUrl('');
            setLessonModalSectionId(null);
            if (selectedCourseForBuilder) {
                const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(updated);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to add lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const openEditLessonModal = (les) => {
        setEditingLessonModal(les);
        setNewLessonTitle(les.title);
        setNewLessonDesc(les.description || '');
        setNewLessonYoutubeUrl(les.youtube_url || (les.youtube_video_id ? `https://www.youtube.com/watch?v=${les.youtube_video_id}` : ''));
        setNewLessonDuration(String(les.duration_seconds || 600));
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!editingLessonModal) return;
        setAddingLesson(true);
        try {
            await api.updateLesson(editingLessonModal.id, {
                title: newLessonTitle,
                description: newLessonDesc,
                youtube_url: newLessonYoutubeUrl,
                duration_seconds: parseInt(newLessonDuration, 10) || 600,
            });
            setEditingLessonModal(null);
            if (selectedCourseForBuilder) {
                const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(updated);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to update lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await api.deleteLesson(lessonId);
            if (selectedCourseForBuilder) {
                const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(updated);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to delete lesson');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Delete section and all its lessons?')) return;
        try {
            await api.deleteSection(sectionId);
            if (selectedCourseForBuilder) {
                const updated = await api.getCourseDetails(selectedCourseForBuilder.id);
                setSelectedCourseForBuilder(updated);
            }
            await loadAdminData();
        } catch (e) {
            alert(e.message || 'Failed to delete section');
        }
    };

    // Filtered data based on search term
    const filteredActivities = activities.filter((student) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const matchesUser = student.user_name?.toLowerCase().includes(term) || student.user_email?.toLowerCase().includes(term);
        const matchesCourse = student.courses?.some((c) => c.course_title?.toLowerCase().includes(term));
        return matchesUser || matchesCourse;
    });

    const filteredPayments = payments.filter((p) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.transaction_id?.toLowerCase().includes(term) ||
            p.user?.name?.toLowerCase().includes(term) ||
            p.user?.email?.toLowerCase().includes(term) ||
            p.course?.title?.toLowerCase().includes(term)
        );
    });

    if (loading && !stats) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <p className="text-slate-400 font-medium text-sm">Loading LMS Control Center...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Admin Command Center Header Banner */}

                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">

                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Administrator Control Console</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">LMS Command Center</h1>
                        <p className="text-slate-400 text-sm mt-2 max-w-2xl leading-relaxed">
                            Monitor student video progress, issue verified completion certificates, edit interactive course curricula, and audit payment transactions in real time.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={() => setActiveTab('new_course')}
                            className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Create New Course</span>
                        </button>
                        <Link
                            to="/admin/builder"
                            className="px-5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-100 font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600 shadow-md"
                        >
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            <span>Course Builder</span>
                        </Link>
                        <Link
                            to="/admin/task-builder"
                            className="px-5 py-3 rounded-2xl bg-cyan-950/80 hover:bg-cyan-950 text-cyan-400 font-bold text-xs flex items-center gap-2 transition-all border border-cyan-800/80 shadow-md"
                        >
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                            <span>ISO 27001 Task Builder</span>
                        </Link>
                    </div>

                </div>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="font-medium">{message}</span>
                    </div>
                    <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-200 p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Glowing KPI Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>TOTAL REVENUE</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sans tracking-tight mt-3">
                        ${Number(stats?.total_revenue || 0).toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">Verified Payments</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>STUDENTS</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight mt-3">
                        {stats?.total_students || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">Active Enrollees</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>COURSES</span>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <BookOpen className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight mt-3">
                        {stats?.total_courses || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">Published Curricula</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>ENROLLMENTS</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight mt-3">
                        {stats?.total_enrollments || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">Course Registrations</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>COMPLETED</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Check className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight mt-3">
                        {stats?.completed_enrollments || 0}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">100% Watched</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>CERTIFICATES</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Award className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-sans tracking-tight mt-3">
                        {stats?.certificates_issued || 0}
                    </div>
                    {stats?.pending_certificates > 0 ? (
                        <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/80 px-2 py-0.5 rounded mt-1 inline-block">
                            {stats.pending_certificates} Pending
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-500 mt-1 block font-medium">Issued Credentials</span>
                    )}
                </div>
            </div>

            {/* VIEW 1: Analytics & Charts Overview (Default Dashboard Tab) */}
            {(activeTab === 'analytics' || !activeTab) && (
                <div className="space-y-8">
                    {/* Analytics Section 1: Visual Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Chart Card 1: Monthly Growth Trends */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                                        <span>Monthly Revenue & Growth Analytics</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Real-time revenue progression ($ USD)</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono font-bold uppercase">
                                    Live Audit
                                </span>
                            </div>

                            {/* Bar Chart Visualization (100% Database Driven) */}
                            <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800/80 pb-3">
                                {(stats?.monthly_trends || []).map((m) => {
                                    const maxRev = Math.max(...(stats?.monthly_trends || []).map(t => t.revenue), 100);
                                    const heightPct = m.revenue > 0 ? Math.min(100, Math.max(15, (m.revenue / maxRev) * 100)) : 10;
                                    return (
                                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                                            <span className="text-[10px] font-mono text-cyan-400 font-bold opacity-0 group-hover:opacity-100 transition">
                                                ${m.revenue}
                                            </span>
                                            <div className="w-full max-w-[36px] bg-slate-950 rounded-xl overflow-hidden h-36 flex items-end p-1 border border-slate-800">
                                                <div
                                                    className="w-full bg-gradient-to-t from-cyan-600 via-blue-500 to-emerald-400 rounded-lg transition-all duration-700 group-hover:brightness-125"
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-mono text-slate-400 font-bold">{m.month}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400" />
                                    <span>Verified Revenue</span>
                                </div>
                                <span className="text-emerald-400 font-bold">${Number(stats?.total_revenue || 0).toFixed(2)} Total</span>
                            </div>
                        </div>

                        {/* Chart Card 2: Course Completion Rates */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <BarChart2 className="w-5 h-5 text-emerald-400" />
                                        <span>Course Completion & Enrollment Breakdown</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Performance across published curricula</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                                    {courses.length} Courses
                                </span>
                            </div>

                            <div className="space-y-4 pt-2 max-h-60 overflow-y-auto pr-1">
                                {courses.map((c) => {
                                    const enrCount = c.enrollments_count || 0;
                                    const compCount = c.completions_count || 0;
                                    const rate = enrCount > 0 ? Math.round((compCount / enrCount) * 100) : 0;
                                    return (
                                        <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-white truncate max-w-[220px]">{c.title}</span>
                                                <span className="font-mono text-cyan-400 font-bold">{rate}% Completion</span>
                                            </div>
                                            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${rate}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                                <span>{enrCount} Enrolled Students</span>
                                                <span className="text-emerald-400 font-bold">{compCount} Finished (100%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Analytics Section 2: Shortcut Banner to Paginated Users Management Page */}
                    <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">Student & User Management Portal</h3>
                            </div>
                            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                                Access the paginated user directory to search students, inspect individual watch logs, and issue 100% completion certificates.
                            </p>
                        </div>

                        <button
                            onClick={() => setActiveTab('users')}
                            className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shrink-0 transition-all shadow-xl shadow-cyan-500/20 hover:scale-105"
                        >
                            <span>Manage All Users ({activities.length} Accounts)</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* VIEW 2: Dedicated Paginated Users Directory Page */}
            {(activeTab === 'users' || activeTab === 'students') && (
                <div className="space-y-6">
                    {/* Header Bar with Search Input */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-cyan-400" /> Users & Students Directory
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Search, filter, and view detailed progress profiles for registered students.</p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by student name or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Paginated Users Data Table */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        {(() => {
                            const filtered = activities.filter((u) =>
                                u.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                u.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            const totalPages = Math.ceil(filtered.length / usersPerPage) || 1;
                            const startIndex = (currentPage - 1) * usersPerPage;
                            const paginatedUsers = filtered.slice(startIndex, startIndex + usersPerPage);

                            if (filtered.length === 0) {
                                return (
                                    <div className="p-12 text-center text-slate-500 text-xs font-mono">
                                        No users found matching "{searchTerm}".
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                                                <tr>
                                                    <th className="p-4 w-16"># ID</th>
                                                    <th className="p-4">Student Profile</th>
                                                    <th className="p-4">Joined Date</th>
                                                    <th className="p-4 text-center">Courses Enrolled</th>
                                                    <th className="p-4 text-center">100% Finished</th>
                                                    <th className="p-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/80 font-sans">
                                                {paginatedUsers.map((student) => {
                                                    const finishedCount = student.courses?.filter(c => c.progress_percentage >= 100).length || 0;
                                                    return (
                                                        <tr key={student.user_id} className="hover:bg-slate-800/40 transition">
                                                            <td className="p-4 font-mono text-slate-500 font-bold">
                                                                #{student.user_id}
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow">
                                                                        {student.user_name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-bold text-white block">{student.user_name}</span>
                                                                        <span className="text-[11px] text-cyan-400 font-mono block">{student.user_email}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 font-mono text-slate-400 text-xs">
                                                                {student.joined_at}
                                                            </td>
                                                            <td className="p-4 text-center font-mono font-bold text-slate-200">
                                                                {student.courses?.length || 0} Courses
                                                            </td>
                                                            <td className="p-4 text-center font-mono">
                                                                {finishedCount > 0 ? (
                                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                                                                        ✓ {finishedCount} Finished
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-500 text-xs">-</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <button
                                                                    onClick={() => handleViewStudentDetail(student.user_id)}
                                                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white font-bold text-xs transition flex items-center gap-1.5 ml-auto border border-slate-700"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                                                    <span>See Details</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls Footer */}
                                    <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
                                        <span className="text-slate-400">
                                            Showing <span className="text-white font-bold">{startIndex + 1}</span> to{' '}
                                            <span className="text-white font-bold">{Math.min(startIndex + usersPerPage, filtered.length)}</span> of{' '}
                                            <span className="text-cyan-400 font-bold">{filtered.length}</span> students
                                        </span>

                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                            </button>

                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                                <button
                                                    key={pg}
                                                    onClick={() => setCurrentPage(pg)}
                                                    className={`w-8 h-8 rounded-xl font-bold transition ${
                                                        currentPage === pg
                                                            ? 'bg-cyan-500 text-slate-950 shadow-md'
                                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {pg}
                                                </button>
                                            ))}

                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
                                            >
                                                Next <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* VIEW 3: Emergency Support Escalation Tickets Table */}
            {activeTab === 'support' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
                                <h3 className="text-xl font-bold text-white">Emergency Support Escalation Requests</h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Real-time incident response submissions, client contact info & breach details.</p>
                        </div>

                        <button
                            onClick={fetchEmergencyTickets}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold transition flex items-center gap-2 border border-slate-700 shrink-0"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                            <span>Refresh Logs</span>
                        </button>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        {emergencyTickets.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 text-xs font-mono">
                                No emergency incident requests recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                                        <tr>
                                            <th className="p-4 w-16"># Ticket</th>
                                            <th className="p-4">Client / Organization</th>
                                            <th className="p-4">Contact Info</th>
                                            <th className="p-4">Incident Description</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/80 font-sans">
                                        {emergencyTickets.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                                <td className="p-4 font-mono text-rose-400 font-bold">
                                                    #{t.id}
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-bold text-white block">{t.name}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono block">Submitted: {new Date(t.created_at).toLocaleString()}</span>
                                                </td>
                                                <td className="p-4 font-mono">
                                                    <div className="space-y-1">
                                                        <a href={`mailto:${t.email}`} className="text-cyan-400 hover:underline flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-cyan-400" />
                                                            <span>{t.email}</span>
                                                        </a>
                                                        <a href={`tel:${t.contact}`} className="text-emerald-400 hover:underline flex items-center gap-1.5">
                                                            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                                                            <span>{t.contact}</span>
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="p-4 max-w-sm">
                                                    <p className="text-slate-200 text-xs leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                                                        {t.description}
                                                    </p>
                                                </td>
                                                <td className="p-4 text-center font-mono">
                                                    {t.status === 'resolved' ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                                                            ✓ Resolved
                                                        </span>
                                                    ) : t.status === 'in_progress' ? (
                                                        <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold text-[10px] animate-pulse">
                                                            ⚡ In Progress
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px] animate-pulse">
                                                            🚨 Pending Action
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {t.status !== 'in_progress' && (
                                                            <button
                                                                onClick={() => handleUpdateTicketStatus(t.id, 'in_progress')}
                                                                className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 text-[11px] font-semibold transition"
                                                            >
                                                                Investigate
                                                            </button>
                                                        )}
                                                        {t.status !== 'resolved' && (
                                                            <button
                                                                onClick={() => handleUpdateTicketStatus(t.id, 'resolved')}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 text-[11px] font-semibold transition"
                                                            >
                                                                Mark Resolved
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* TAB 2: Course & Video Curriculum Builder */}
            {activeTab === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Courses Sidebar */}
                    <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-white text-sm">Select Course to Edit</h3>
                            <button
                                onClick={() => setActiveTab('new_course')}
                                className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3.5 h-3.5" /> New Course
                            </button>
                        </div>

                        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                            {courses.map((c) => (
                                <div
                                    key={c.id}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                                        selectedCourseForBuilder?.id === c.id
                                            ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/50'
                                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={async () => {
                                            const full = await api.getCourseDetails(c.id);
                                            setSelectedCourseForBuilder(full);
                                        }}
                                    >
                                        <div className="font-bold text-sm text-white line-clamp-1">{c.title}</div>
                                        <div className="mt-1.5 text-xs text-slate-400 flex items-center justify-between">
                                            <span>
                                                {c.level} • {c.sections?.length || 0} Sections
                                            </span>
                                            <span className="text-emerald-400 font-bold font-mono">${c.price || 49}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                                        <button
                                            onClick={() => openEditCourseModal(c)}
                                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-semibold text-xs"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit Settings
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(c.id, c.title)}
                                            className="text-slate-500 hover:text-red-400 p-1 transition"
                                            title="Delete Course"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Builder Main Curriculum Area */}
                    <div className="lg:col-span-8 space-y-6">
                        {selectedCourseForBuilder ? (
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                                    <div>
                                        <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
                                            Curriculum & Content Editor
                                        </span>
                                        <h2 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
                                            {selectedCourseForBuilder.title}
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-1">{selectedCourseForBuilder.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditCourseModal(selectedCourseForBuilder)}
                                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Sections & Lessons List */}
                                <div className="space-y-6">
                                    {selectedCourseForBuilder.sections?.map((sec, sIdx) => (
                                        <div key={sec.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-xs font-bold text-cyan-400">
                                                        Module {sIdx + 1}: {sec.title}
                                                    </span>
                                                    {sec.description && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{sec.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => openEditSectionModal(sec)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition"
                                                        title="Edit Section Title"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setLessonModalSectionId(sec.id)}
                                                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition border border-cyan-500/30"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Add Lesson</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSection(sec.id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"
                                                        title="Delete Section"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="divide-y divide-slate-800/40 p-2">
                                                {sec.lessons?.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-slate-500">
                                                        No lessons in this module yet. Click "+ Add Lesson" above.
                                                    </div>
                                                ) : (
                                                    sec.lessons?.map((les, lIdx) => (
                                                        <div
                                                            key={les.id}
                                                            className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/60 rounded-xl transition"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 text-xs font-bold font-mono">
                                                                    {lIdx + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-bold text-white">{les.title}</div>
                                                                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                                        <span className="text-cyan-400 font-mono">
                                                                            ID: {les.youtube_video_id || 'None'}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{Math.round((les.duration_seconds || 600) / 60)} mins</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => openEditLessonModal(les)}
                                                                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLesson(les.id)}
                                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition"
                                                                    title="Delete Lesson"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Section Form */}
                                <form onSubmit={handleAddSection} className="p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-cyan-400" /> Add New Curriculum Section
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Section Title (e.g. Section 3: Advanced Cloud Threat Response)"
                                            value={newSectionTitle}
                                            onChange={(e) => setNewSectionTitle(e.target.value)}
                                            required
                                            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description (Optional)"
                                            value={newSectionDesc}
                                            onChange={(e) => setNewSectionDesc(e.target.value)}
                                            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={addingSection}
                                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md"
                                    >
                                        {addingSection ? 'Creating Section...' : 'Add Section'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
                                Select a course from the left sidebar to edit curriculum, YouTube video links, or course settings.
                            </div>
                        )}
                    </div>
                </div>
            )}




            {/* TAB 3: Payment Transactions */}
            {activeTab === 'payments' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Course Payment Transactions</h3>
                            <p className="text-xs text-slate-400 mt-1">Real-time audit log of all student course unlocks and payments</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3.5 py-1.5 rounded-xl border border-emerald-800/80 font-mono">
                            {filteredPayments.length} Transactions
                        </span>
                    </div>

                    {filteredPayments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 text-sm">
                            {searchTerm ? 'No transactions match your search filter.' : 'No payment transactions recorded yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[11px] border-b border-slate-800">
                                    <tr>
                                        <th className="p-4">Transaction ID</th>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Course</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                    {filteredPayments.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-mono font-bold text-cyan-400">{p.transaction_id}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white">{p.user?.name || p.payer_name || 'Student'}</div>
                                                <div className="text-[10px] text-slate-500">{p.user?.email || p.payer_email}</div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">{p.course?.title || 'CyberLoy Course'}</td>
                                            <td className="p-4 font-mono font-bold text-emerald-400">
                                                ${Number(p.amount).toFixed(2)} {p.currency || 'USD'}
                                            </td>
                                            <td className="p-4 capitalize text-slate-400 font-medium">{p.payment_method}</td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500 font-mono">
                                                {new Date(p.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: Create Course */}
            {activeTab === 'new_course' && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
                    <div>
                        <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
                            Course Publishing
                        </span>
                        <h3 className="text-2xl font-extrabold text-white mt-2">Publish New LMS Course</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure full course metadata, pricing, and video progression locking mode.</p>
                    </div>

                    <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Course Title</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="e.g. Cloud Security Architecture & Threat Response"
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                rows="3"
                                placeholder="Comprehensive description of the cybersecurity curriculum and target outcomes..."
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Difficulty Level</label>
                                <select
                                    value={newLevel}
                                    onChange={(e) => setNewLevel(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Cybersecurity"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={newDuration}
                                    onChange={(e) => setNewDuration(e.target.value)}
                                    placeholder="4 Weeks"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Progression Mode</label>
                                <select
                                    value={newProgressionMode}
                                    onChange={(e) => setNewProgressionMode(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                >
                                    <option value="sequential">Sequential (Enforce 100% video completion to unlock next)</option>
                                    <option value="open">Open (Students can watch any lesson in any order)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Course Price ($ USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    placeholder="49.00"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                        </div>

                        <div className="pt-3">
                            <button
                                type="submit"
                                disabled={creatingCourse}
                                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{creatingCourse ? 'Publishing Course...' : 'Publish Course'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}


            {/* Modal: Edit Course Settings */}

            {editingCourseModal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setEditingCourseModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                                Course Settings
                            </span>
                            <h3 className="text-xl font-bold text-white mt-1">Edit Course Metadata</h3>
                        </div>

                        <form onSubmit={handleSaveCourseSettings} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Course Title</label>
                                <input
                                    type="text"
                                    value={editCourseForm.title}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={editCourseForm.description}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Difficulty Level</label>
                                    <select
                                        value={editCourseForm.level}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, level: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Price ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editCourseForm.price}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, price: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Progression Mode</label>
                                    <select
                                        value={editCourseForm.progression_mode}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, progression_mode: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="sequential">Sequential (100% Video Lock)</option>
                                        <option value="open">Open (No Lock)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                                    <select
                                        value={editCourseForm.status}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, status: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingCourseModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCourse}
                                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                                >
                                    {savingCourse ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Section Title */}
            {editingSectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <button
                            onClick={() => setEditingSectionModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                                Edit Section
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1">Update Section Details</h3>
                        </div>

                        <form onSubmit={handleSaveSection} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Section Title</label>
                                <input
                                    type="text"
                                    value={editSectionForm.title}
                                    onChange={(e) => setEditSectionForm({ ...editSectionForm, title: e.target.value })}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={editSectionForm.description}
                                    onChange={(e) => setEditSectionForm({ ...editSectionForm, description: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSectionModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSection}
                                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                                >
                                    {savingSection ? 'Saving...' : 'Save Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add or Edit Lesson */}
            {(lessonModalSectionId || editingLessonModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                        <button
                            onClick={() => {
                                setLessonModalSectionId(null);
                                setEditingLessonModal(null);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                                {editingLessonModal ? 'Edit Video Lesson' : 'Add Video Lesson'}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1">
                                {editingLessonModal ? 'Update Lesson Content' : 'New Lesson Details'}
                            </h3>
                        </div>

                        <form onSubmit={editingLessonModal ? handleSaveLesson : handleAddLesson} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Lesson Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lesson 2: Network Packet Inspection & SIEM Triage"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">YouTube Video Link or ID</label>
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or youtu.be/ID"
                                    value={newLessonYoutubeUrl}
                                    onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Video Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        min="30"
                                        placeholder="600 (10 mins)"
                                        value={newLessonDuration}
                                        onChange={(e) => setNewLessonDuration(e.target.value)}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Completion Required</label>
                                    <input
                                        type="text"
                                        disabled
                                        value="100% Video Watch"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono opacity-80"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Lesson Notes & Summary</label>
                                <textarea
                                    rows="2"
                                    placeholder="Summary of topics covered in this lesson..."
                                    value={newLessonDesc}
                                    onChange={(e) => setNewLessonDesc(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLessonModalSectionId(null);
                                        setEditingLessonModal(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingLesson}
                                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                                >
                                    {addingLesson ? 'Saving...' : editingLessonModal ? 'Save Changes' : 'Add Lesson to Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Student Detailed Watch History Inspector Modal */}
            {selectedStudentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
                        <button
                            onClick={() => setSelectedStudentDetail(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="pb-4 border-b border-slate-800">
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                                Student Watch Inspector
                            </span>
                            <h3 className="text-xl font-bold text-white mt-2">
                                {selectedStudentDetail.user?.name} ({selectedStudentDetail.user?.email})
                            </h3>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                            {selectedStudentDetail.courses?.map((c) => (
                                <div key={c.course_id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-white text-sm">{c.course_title}</h4>
                                            {(c.enrollment_status === 'completed' || c.sections?.every(s => s.completed_lessons > 0 && s.completed_lessons === s.total_lessons)) && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/80 font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 animate-pulse">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>✓ 100% COMPLETED</span>
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-cyan-400 capitalize bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                            Status: {c.enrollment_status}
                                        </span>
                                    </div>


                                    {c.sections?.map((sec) => (
                                        <div key={sec.section_id} className="space-y-2">
                                            <div className="text-xs font-bold text-slate-300">
                                                {sec.title} ({sec.completed_lessons}/{sec.total_lessons} completed)
                                            </div>
                                            <div className="divide-y divide-slate-800/40 bg-slate-900/60 rounded-xl border border-slate-800/60 p-2">
                                                {sec.lessons?.map((les) => (
                                                    <div key={les.lesson_id} className="p-2.5 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {les.status === 'completed' ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Play className="w-4 h-4 text-cyan-400 shrink-0" />
                                                            )}
                                                            <span className="text-slate-200 font-medium">{les.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 font-mono text-[11px]">
                                                            <span className="text-cyan-400 font-bold">{les.progress_percentage}% Watched</span>
                                                            <span className="text-slate-500">({les.watched_seconds}s)</span>
                                                            {les.completed_at && (
                                                                <span className="text-emerald-400">✓ {les.completed_at}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


