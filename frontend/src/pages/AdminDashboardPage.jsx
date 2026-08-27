import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
    Shield, Users, BookOpen, Award, CheckCircle, AlertCircle, DollarSign,
    CreditCard, Plus, Lock, Check, Trash2, Eye, Play, Sparkles, X, ChevronRight,
    Search, Filter, RefreshCw, Edit3, Settings, Save
} from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [courses, setCourses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students'); // 'students' | 'builder' | 'payments' | 'new_course'
    const [issuing, setIssuing] = useState(null);
    const [message, setMessage] = useState('');
    const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

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

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [statsData, activitiesData, coursesData, paymentsData] = await Promise.all([
                api.getAdminStats(),
                api.getUserActivities(),
                api.getCourses(),
                api.getAdminPayments().catch(() => []),
            ]);
            setStats(statsData);
            setActivities(activitiesData || []);
            setCourses(coursesData || []);
            setPayments(paymentsData || []);

            // If a course is currently open in builder, refresh its state
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
            setMessage(`Success! Issued certificate (${res.certificate?.certificate_code}) with verification code (${res.certificate?.verification_code}) to ${userName}.`);
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

            setMessage(`Course "${newTitle}" created successfully!`);
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
            setMessage(`Course "${courseTitle}" deleted successfully.`);
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

    if (loading && !stats) {
        return <div className="text-center py-20 text-slate-500 font-mono text-sm">Loading Admin Control Portal...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Admin Header Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-400 text-xs font-mono mb-3">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Administrator Management System</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">LMS Command Center</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage course video curriculum, edit course contents, monitor student watch intervals, and issue verified certificates.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <button
                        onClick={() => setActiveTab('new_course')}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-950"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Course</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('builder')}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition border border-slate-700"
                    >
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>Course Builder</span>
                    </button>
                </div>
            </div>

            {message && (
                <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-sm flex items-center gap-3 shadow-lg animate-in fade-in">
                    <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            {/* KPI Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>TOTAL REVENUE</span>
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
                        ${Number(stats?.total_revenue || 0).toFixed(2)}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>STUDENTS</span>
                        <Users className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-2">{stats?.total_students || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>COURSES</span>
                        <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-2">{stats?.total_courses || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>ENROLLMENTS</span>
                        <CheckCircle className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-2">{stats?.total_enrollments || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>COMPLETED</span>
                        <Award className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono mt-2">{stats?.completed_enrollments || 0}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>CERTIFICATES</span>
                        <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono mt-2">
                        {stats?.certificates_issued || 0}
                    </div>
                    {stats?.pending_certificates > 0 && (
                        <div className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded mt-1">
                            {stats.pending_certificates} Pending Issuance
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`pb-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'students'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Student Monitoring & Watch History</span>
                </button>

                <button
                    onClick={() => setActiveTab('builder')}
                    className={`pb-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'builder'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    <span>Course & Video Curriculum Builder</span>
                </button>

                <button
                    onClick={() => setActiveTab('payments')}
                    className={`pb-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'payments'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Transactions ({payments.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('new_course')}
                    className={`pb-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                        activeTab === 'new_course'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                </button>
            </div>

            {/* TAB 1: Student Monitoring & Watch History */}
            {activeTab === 'students' && (
                <div className="space-y-6">
                    {activities.length === 0 ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 font-mono">
                            No registered students found.
                        </div>
                    ) : (
                        activities.map((student) => (
                            <div key={student.user_id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <span>{student.user_name}</span>
                                            <span className="text-xs font-mono text-slate-500 font-normal">({student.user_email})</span>
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleViewStudentDetail(student.user_id)}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs flex items-center gap-1.5 transition border border-slate-700"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Inspect Video Watch History</span>
                                        </button>
                                        <span className="text-xs font-mono text-slate-500">
                                            Joined: {student.joined_at}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-4">
                                    {student.courses?.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic">No course enrollments yet.</p>
                                    ) : (
                                        student.courses.map((course) => (
                                            <div
                                                key={course.course_id}
                                                className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <h4 className="font-semibold text-sm text-slate-200">{course.course_title}</h4>
                                                        {course.payment_status === 'paid' ? (
                                                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                                                Paid (${course.payment_amount || '49.00'})
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                                                                Unpaid
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="w-48 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                                            <div
                                                                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full"
                                                                style={{ width: `${course.progress_percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-mono text-cyan-400 font-bold">
                                                            {course.progress_percentage}% ({course.completed_lessons}/{course.total_lessons} lessons completed)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-3">
                                                    {course.has_certificate ? (
                                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold font-mono">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Certificate Issued ({course.certificate_code})
                                                        </span>
                                                    ) : (
                                                        <button
                                                            disabled={issuing === `${student.user_id}-${course.course_id}`}
                                                            onClick={() => handleIssueCertificate(student.user_id, course.course_id, student.user_name, course.course_title)}
                                                            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md ${
                                                                course.is_ready_for_certificate
                                                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 animate-pulse'
                                                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                                            }`}
                                                        >
                                                            <Award className="w-4 h-4 text-amber-500" />
                                                            <span>{issuing === `${student.user_id}-${course.course_id}` ? 'Issuing...' : 'Issue Verified Certificate'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB 2: Course & Video Curriculum Builder */}
            {activeTab === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Courses List */}
                    <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <h3 className="font-bold text-white text-sm">Select Course to Edit</h3>
                            <button
                                onClick={() => setActiveTab('new_course')}
                                className="text-xs text-cyan-400 font-mono hover:underline flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> New Course
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {courses.map((c) => (
                                <div
                                    key={c.id}
                                    className={`p-4 rounded-2xl border transition flex flex-col gap-2 ${
                                        selectedCourseForBuilder?.id === c.id
                                            ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                                            : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
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
                                        <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-between">
                                            <span>{c.level} • {c.sections?.length || 0} Sections</span>
                                            <span className="text-emerald-400 font-bold">${c.price || 49}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                                        <button
                                            onClick={() => openEditCourseModal(c)}
                                            className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                                        >
                                            <Edit3 className="w-3 h-3" /> Edit Course Settings
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(c.id, c.title)}
                                            className="text-red-400 hover:text-red-300"
                                            title="Delete Course"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Builder Section Details */}
                    <div className="lg:col-span-8 space-y-6">
                        {selectedCourseForBuilder ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                                    <div>
                                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
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
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs flex items-center gap-1.5 border border-slate-700 transition"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                            <span>Settings</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Sections & Lessons List */}
                                <div className="space-y-6">
                                    {selectedCourseForBuilder.sections?.map((sec, sIdx) => (
                                        <div key={sec.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-cyan-400 font-mono">
                                                        Section {sIdx + 1}: {sec.title}
                                                    </span>
                                                    {sec.description && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{sec.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEditSectionModal(sec)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 transition"
                                                        title="Edit Section Title"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setLessonModalSectionId(sec.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition border border-cyan-500/30"
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
                                                    <div className="p-4 text-center text-xs text-slate-500 font-mono">
                                                        No lessons in this section. Click "+ Add Lesson" to add.
                                                    </div>
                                                ) : (
                                                    sec.lessons?.map((les, lIdx) => (
                                                        <div key={les.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40 rounded-xl transition">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xs font-bold font-mono">
                                                                    {lIdx + 1}
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-semibold text-white">{les.title}</div>
                                                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                                                                        <span className="text-cyan-400">YouTube ID: {les.youtube_video_id || 'None'}</span>
                                                                        <span>•</span>
                                                                        <span>{Math.round((les.duration_seconds || 600) / 60)} mins</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => openEditLessonModal(les)}
                                                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono flex items-center gap-1 border border-slate-700 transition"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
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
                                <form onSubmit={handleAddSection} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                        <Plus className="w-4 h-4 text-cyan-400" /> Add New Section / Module
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Section Title (e.g. Section 3: Advanced Cloud Threat Defense)"
                                            value={newSectionTitle}
                                            onChange={(e) => setNewSectionTitle(e.target.value)}
                                            required
                                            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description (Optional)"
                                            value={newSectionDesc}
                                            onChange={(e) => setNewSectionDesc(e.target.value)}
                                            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={addingSection}
                                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                                    >
                                        {addingSection ? 'Creating...' : 'Add Section'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 font-mono">
                                Select a course from the left menu to edit course contents, modify YouTube video links, or add sections.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: Payment Transactions */}
            {activeTab === 'payments' && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Course Payment Transactions</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Real-time audit log of all student course unlocks and payments</p>
                        </div>
                        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800">
                            {payments.length} Transactions
                        </span>
                    </div>

                    {payments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 font-mono text-sm">
                            No payment transactions recorded yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
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
                                    {payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                                            <td className="p-4 font-mono font-bold text-cyan-400">{p.transaction_id}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-white">{p.user?.name || p.payer_name || 'Student'}</div>
                                                <div className="text-[10px] text-slate-500">{p.user?.email || p.payer_email}</div>
                                            </td>
                                            <td className="p-4 font-medium text-slate-200">{p.course?.title || 'CyberLoy Course'}</td>
                                            <td className="p-4 font-mono font-bold text-emerald-400">${Number(p.amount).toFixed(2)} {p.currency}</td>
                                            <td className="p-4 capitalize font-mono text-slate-400">{p.payment_method}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
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
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto space-y-6">
                    <div>
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                            Course Creator
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
                                className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-950 flex items-center gap-2"
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
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
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
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
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
                            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
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
                            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                                Student Watch Inspector
                            </span>
                            <h3 className="text-xl font-bold text-white mt-2">
                                {selectedStudentDetail.user.name} ({selectedStudentDetail.user.email})
                            </h3>
                        </div>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                            {selectedStudentDetail.courses?.map((c) => (
                                <div key={c.course_id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                        <h4 className="font-bold text-white text-sm">{c.course_title}</h4>
                                        <span className="text-xs font-mono text-cyan-400 capitalize">
                                            Status: {c.enrollment_status}
                                        </span>
                                    </div>

                                    {c.sections?.map((sec) => (
                                        <div key={sec.section_id} className="space-y-2">
                                            <div className="text-xs font-bold text-slate-300 font-mono">
                                                {sec.title} ({sec.completed_lessons}/{sec.total_lessons} completed)
                                            </div>
                                            <div className="divide-y divide-slate-800/40 bg-slate-900/60 rounded-xl border border-slate-800/60 p-2">
                                                {sec.lessons?.map((les) => (
                                                    <div key={les.lesson_id} className="p-2.5 flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-2">
                                                            {les.status === 'completed' ? (
                                                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                            ) : (
                                                                <Play className="w-4 h-4 text-cyan-400" />
                                                            )}
                                                            <span className="text-slate-200">{les.title}</span>
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
