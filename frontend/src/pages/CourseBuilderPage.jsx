import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    BookOpen, Plus, Settings, Edit3, Trash2, Shield, ChevronLeft,
    CheckCircle, X, Play, ArrowLeft, Sparkles, Layers, Video
} from 'lucide-react';

export default function CourseBuilderPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Course Builder Form States
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
    const [newLessonPdfUrl, setNewLessonPdfUrl] = useState('');
    const [newLessonAssessmentType, setNewLessonAssessmentType] = useState('none');
    const [newLessonAssessmentConfig, setNewLessonAssessmentConfig] = useState('');
    const [newLessonDuration, setNewLessonDuration] = useState('600');
    const [addingLesson, setAddingLesson] = useState(false);

    // Create New Course Modal State
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newLevel, setNewLevel] = useState('Beginner');
    const [newCategory, setNewCategory] = useState('Cybersecurity');
    const [newDuration, setNewDuration] = useState('4 Weeks');
    const [newPrice, setNewPrice] = useState('49.00');
    const [newProgressionMode, setNewProgressionMode] = useState('sequential');
    const [creatingCourse, setCreatingCourse] = useState(false);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await api.getCourses();
            const list = data || [];
            setCourses(list);

            if (list.length > 0 && !selectedCourse) {
                const fullDetails = await api.getCourseDetails(list[0].id);
                setSelectedCourse(fullDetails);
            } else if (selectedCourse) {
                const refreshed = await api.getCourseDetails(selectedCourse.id);
                setSelectedCourse(refreshed);
            }
        } catch (e) {
            console.error('Failed to load courses:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCourse = async (courseId) => {
        try {
            const fullDetails = await api.getCourseDetails(courseId);
            setSelectedCourse(fullDetails);
        } catch (e) {
            alert('Failed to load course details');
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setCreatingCourse(true);
        setMessage('');

        try {
            const res = await api.createCourse({
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
            setShowNewCourseModal(false);
            setNewTitle('');
            setNewDescription('');
            setNewPrice('49.00');

            await loadCourses();
            if (res?.course?.id) {
                handleSelectCourse(res.course.id);
            }
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
                title: editCourseForm.title,
                description: editCourseForm.description,
                level: editCourseForm.level,
                category: editCourseForm.category,
                duration: editCourseForm.duration,
                price: parseFloat(editCourseForm.price) || 0,
                progression_mode: editCourseForm.progression_mode,
                status: editCourseForm.status,
            });
            setEditingCourseModal(null);
            setMessage('Course settings updated successfully!');
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to update course');
        } finally {
            setSavingCourse(false);
        }
    };

    const handleDeleteCourse = async (courseId, title) => {
        if (!window.confirm(`Are you sure you want to permanently delete course "${title}"?`)) return;
        try {
            await api.deleteCourse(courseId);
            setMessage(`Course "${title}" deleted.`);
            if (selectedCourse?.id === courseId) {
                setSelectedCourse(null);
            }
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to delete course');
        }
    };

    const handleAddSection = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;
        setAddingSection(true);
        try {
            await api.createSection(selectedCourse.id, {
                title: newSectionTitle,
                description: newSectionDesc,
            });
            setNewSectionTitle('');
            setNewSectionDesc('');
            await loadCourses();
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
            await api.updateSection(editingSectionModal.id, {
                title: editSectionForm.title,
                description: editSectionForm.description,
            });
            setEditingSectionModal(null);
            await loadCourses();
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
            const parsedAssessmentConfig = parseAssessmentConfig(newLessonAssessmentConfig);
            await api.createLesson(lessonModalSectionId, {
                title: newLessonTitle,
                description: newLessonDesc,
                youtube_url: newLessonYoutubeUrl,
                pdf_url: newLessonPdfUrl,
                assessment_type: newLessonAssessmentType,
                assessment_config: parsedAssessmentConfig,
                duration_seconds: parseInt(newLessonDuration, 10) || 600,
            });
            setNewLessonTitle('');
            setNewLessonDesc('');
            setNewLessonYoutubeUrl('');
            setNewLessonPdfUrl('');
            setNewLessonAssessmentType('none');
            setNewLessonAssessmentConfig('');
            setLessonModalSectionId(null);
            await loadCourses();
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
        setNewLessonPdfUrl(les.pdf_url || '');
        setNewLessonAssessmentType(les.assessment_type || 'none');
        setNewLessonAssessmentConfig(
            typeof les.assessment_config === 'string'
                ? les.assessment_config
                : JSON.stringify(les.assessment_config || {}, null, 2)
        );
        setNewLessonDuration(String(les.duration_seconds || 600));
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!editingLessonModal) return;
        setAddingLesson(true);
        try {
            const parsedAssessmentConfig = parseAssessmentConfig(newLessonAssessmentConfig);
            await api.updateLesson(editingLessonModal.id, {
                title: newLessonTitle,
                description: newLessonDesc,
                youtube_url: newLessonYoutubeUrl,
                pdf_url: newLessonPdfUrl,
                assessment_type: newLessonAssessmentType,
                assessment_config: parsedAssessmentConfig,
                duration_seconds: parseInt(newLessonDuration, 10) || 600,
            });
            setEditingLessonModal(null);
            setNewLessonTitle('');
            setNewLessonDesc('');
            setNewLessonYoutubeUrl('');
            setNewLessonPdfUrl('');
            setNewLessonAssessmentType('none');
            setNewLessonAssessmentConfig('');
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to update lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const parseAssessmentConfig = (value) => {
        if (!value || !value.trim()) {
            return [];
        }

        try {
            const parsed = JSON.parse(value);
            return parsed;
        } catch (e) {
            throw new Error('Assessment configuration must be valid JSON.');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await api.deleteLesson(lessonId);
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to delete lesson');
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (!window.confirm('Delete section and all its video lessons?')) return;
        try {
            await api.deleteSection(sectionId);
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to delete section');
        }
    };

    if (loading && courses.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#f4f7fb] text-slate-500">
                <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin" />
                <p className="text-xs font-semibold">Loading Curriculum Builder...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen">
            {/* Header Banner (Clean White Card) */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <Link to="/admin" className="hover:text-blue-600 transition flex items-center gap-1">
                                <Shield className="w-3.5 h-3.5 text-amber-500" />
                                <span>Admin Portal</span>
                            </Link>
                            <span className="text-slate-300">•</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                                Course Builder
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2.5">
                            <BookOpen className="w-7 h-7 text-blue-600" />
                            <span>Curriculum & Video Builder</span>
                        </h1>
                        <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
                            Organize course modules, edit YouTube video links, set lesson watch durations, and adjust pricing.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                            onClick={() => setShowNewCourseModal(true)}
                            className="px-4 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-2 transition shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-cyan-400" />
                            <span>Publish New Course</span>
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{message}</span>
                    </div>
                    <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Main Builder Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Courses Sidebar (White Card) */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-[#0f172a] text-xs uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span>Select Course to Edit</span>
                        </h3>
                        <button
                            onClick={() => setShowNewCourseModal(true)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                            <Plus className="w-3.5 h-3.5" /> New Course
                        </button>
                    </div>

                    <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                        {courses.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-xs">No courses available. Click "+ New Course" to create one.</div>
                        ) : (
                            courses.map((c) => (
                                <div
                                    key={c.id}
                                    className={`p-4 rounded-xl border transition flex flex-col gap-2.5 ${
                                        selectedCourse?.id === c.id
                                            ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                                            : 'bg-[#f8fafc] border-slate-200/80 hover:bg-slate-50'
                                    }`}
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => handleSelectCourse(c.id)}
                                    >
                                        <div className="font-bold text-xs sm:text-sm text-[#0f172a] line-clamp-1">{c.title}</div>
                                        <div className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
                                            <span>
                                                {c.level} • {c.sections?.length || 0} Sections
                                            </span>
                                            <span className="text-emerald-700 font-bold font-mono">${c.price || 49}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                        <button
                                            onClick={() => openEditCourseModal(c)}
                                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold text-xs"
                                        >
                                            <Settings className="w-3.5 h-3.5" /> Edit Settings
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(c.id, c.title)}
                                            className="text-slate-400 hover:text-red-600 p-1 transition"
                                            title="Delete Course"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Builder Content Area (White Card) */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedCourse ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                                <div>
                                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                        Curriculum & Content Editor
                                    </span>
                                    <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] mt-2 tracking-tight">
                                        {selectedCourse.title}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">{selectedCourse.description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEditCourseModal(selectedCourse)}
                                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 border border-slate-200 shadow-sm transition"
                                    >
                                        <Settings className="w-4 h-4 text-blue-600" />
                                        <span>Settings</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sections & Lessons List */}
                            <div className="space-y-4">
                                {selectedCourse.sections?.map((sec, sIdx) => (
                                    <div key={sec.id} className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                                        <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3">
                                            <div>
                                                <span className="text-xs font-bold text-[#0f172a]">
                                                    Module {sIdx + 1}: {sec.title}
                                                </span>
                                                {sec.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{sec.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => openEditSectionModal(sec)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                                                    title="Edit Section Title"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setLessonModalSectionId(sec.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                                                >
                                                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                                                    <span>Add Lesson</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSection(sec.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Delete Section"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100 p-2">
                                            {sec.lessons?.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-400">
                                                    No lessons in this module yet. Click "+ Add Lesson" above.
                                                </div>
                                            ) : (
                                                sec.lessons?.map((les, lIdx) => (
                                                    <div
                                                        key={les.id}
                                                        className="p-3 flex items-center justify-between gap-4 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200/80"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold font-mono">
                                                                {lIdx + 1}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-[#0f172a]">{les.title}</div>
                                                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                                    <span className="text-blue-600 font-mono">
                                                                        ID: {les.youtube_video_id || 'None'}
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>{Math.round((les.duration_seconds || 600) / 60)} mins</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => openEditLessonModal(les)}
                                                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 shadow-xs transition"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLesson(les.id)}
                                                                className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
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

                            {/* Add New Section Form (White Card) */}
                            <form onSubmit={handleAddSection} className="p-5 bg-[#f8fafc] border border-slate-200/80 rounded-2xl space-y-3">
                                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                    <Plus className="w-4 h-4 text-blue-600" /> Add New Curriculum Section
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Section Title (e.g. Section 3: Advanced Cloud Threat Response)"
                                        value={newSectionTitle}
                                        onChange={(e) => setNewSectionTitle(e.target.value)}
                                        required
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description (Optional)"
                                        value={newSectionDesc}
                                        onChange={(e) => setNewSectionDesc(e.target.value)}
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={addingSection}
                                    className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
                                >
                                    {addingSection ? 'Creating Section...' : 'Add Section'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs">
                            Select a course from the left sidebar to edit curriculum, YouTube video links, or course settings.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create New Course */}
            {showNewCourseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setShowNewCourseModal(false)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                Course Publishing
                            </span>
                            <h3 className="text-xl font-bold text-[#0f172a] mt-2">Publish New LMS Course</h3>
                        </div>

                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Course Title</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="e.g. Cloud Security Architecture & Threat Response"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                                <textarea
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    rows="3"
                                    placeholder="Comprehensive description of the cybersecurity curriculum..."
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty Level</label>
                                    <select
                                        value={newLevel}
                                        onChange={(e) => setNewLevel(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        placeholder="Cybersecurity"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Duration</label>
                                    <input
                                        type="text"
                                        value={newDuration}
                                        onChange={(e) => setNewDuration(e.target.value)}
                                        placeholder="4 Weeks"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Progression Mode</label>
                                    <select
                                        value={newProgressionMode}
                                        onChange={(e) => setNewProgressionMode(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="sequential">Sequential (100% Video Lock)</option>
                                        <option value="open">Open (No Lock)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Course Price ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        placeholder="49.00"
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowNewCourseModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingCourse}
                                    className="px-5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4 text-cyan-400" />
                                    <span>{creatingCourse ? 'Publishing Course...' : 'Publish Course'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Course Settings */}
            {editingCourseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setEditingCourseModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                Course Settings
                            </span>
                            <h3 className="text-xl font-bold text-[#0f172a] mt-1">Edit Course Metadata</h3>
                        </div>

                        <form onSubmit={handleSaveCourseSettings} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Course Title</label>
                                <input
                                    type="text"
                                    value={editCourseForm.title}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={editCourseForm.description}
                                    onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty Level</label>
                                    <select
                                        value={editCourseForm.level}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, level: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Price ($ USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editCourseForm.price}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, price: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Progression Mode</label>
                                    <select
                                        value={editCourseForm.progression_mode}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, progression_mode: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="sequential">Sequential (100% Video Lock)</option>
                                        <option value="open">Open (No Lock)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                                    <select
                                        value={editCourseForm.status}
                                        onChange={(e) => setEditCourseForm({ ...editCourseForm, status: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingCourseModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCourse}
                                    className="px-5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
                        <button
                            onClick={() => setEditingSectionModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                Edit Section
                            </span>
                            <h3 className="text-lg font-bold text-[#0f172a] mt-1">Update Section Details</h3>
                        </div>

                        <form onSubmit={handleSaveSection} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Section Title</label>
                                <input
                                    type="text"
                                    value={editSectionForm.title}
                                    onChange={(e) => setEditSectionForm({ ...editSectionForm, title: e.target.value })}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={editSectionForm.description}
                                    onChange={(e) => setEditSectionForm({ ...editSectionForm, description: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingSectionModal(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSection}
                                    className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4">
                        <button
                            onClick={() => {
                                setLessonModalSectionId(null);
                                setEditingLessonModal(null);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                {editingLessonModal ? 'Edit Video Lesson' : 'Add Video Lesson'}
                            </span>
                            <h3 className="text-lg font-bold text-[#0f172a] mt-1">
                                {editingLessonModal ? 'Update Lesson Content' : 'New Lesson Details'}
                            </h3>
                        </div>

                        <form onSubmit={editingLessonModal ? handleSaveLesson : handleAddLesson} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Lesson Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lesson 2: Network Packet Inspection & SIEM Triage"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">YouTube Video Link or ID</label>
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or youtu.be/ID"
                                    value={newLessonYoutubeUrl}
                                    onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">PDF Learning Material URL (optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/lesson-notes.pdf"
                                    value={newLessonPdfUrl}
                                    onChange={(e) => setNewLessonPdfUrl(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Video Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        min="30"
                                        placeholder="600 (10 mins)"
                                        value={newLessonDuration}
                                        onChange={(e) => setNewLessonDuration(e.target.value)}
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Completion Required</label>
                                    <input
                                        type="text"
                                        disabled
                                        value="100% Video Watch"
                                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Assessment Type</label>
                                    <select
                                        value={newLessonAssessmentType}
                                        onChange={(e) => setNewLessonAssessmentType(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="none">No Assessment</option>
                                        <option value="mcq">MCQ Quiz</option>
                                        <option value="written">Written Response</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Assessment Config (JSON)</label>
                                    <input
                                        type="text"
                                        placeholder='{"questions":[{"question":"...","options":[]}]}'
                                        value={newLessonAssessmentConfig}
                                        onChange={(e) => setNewLessonAssessmentConfig(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Lesson Notes & Summary</label>
                                <textarea
                                    rows="2"
                                    placeholder="Summary of topics covered in this lesson..."
                                    value={newLessonDesc}
                                    onChange={(e) => setNewLessonDesc(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLessonModalSectionId(null);
                                        setEditingLessonModal(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addingLesson}
                                    className="px-5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
                                >
                                    {addingLesson ? 'Saving...' : editingLessonModal ? 'Save Changes' : 'Add Lesson to Section'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
