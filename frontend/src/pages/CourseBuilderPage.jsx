import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    BookOpen, Plus, Settings, Edit3, Trash2, Shield, ChevronLeft,
    CheckCircle, X, Play, ArrowLeft, Sparkles, Layers, Video
} from 'lucide-react';
import { buildLiveClassLink } from '../lib/liveClass';
import CourseImageField from '../components/CourseImageField';

const LESSON_KINDS = [
    { id: 'video', label: 'Video Lesson', Icon: Video, description: 'A YouTube video students must watch fully. You can add an optional quiz after it.' },
    { id: 'mcq', label: 'MCQ Quiz', Icon: CheckCircle, description: 'Multiple-choice questions, graded automatically against a pass mark.' },
    { id: 'written', label: 'Written Assignment', Icon: Edit3, description: 'Open-ended prompts that students answer in writing and an instructor grades.' },
];

export default function CourseBuilderPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
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
        thumbnail_url: '',
        level: 'Beginner',
        category: 'Cybersecurity',
        duration: '4 Weeks',
        price: '49.00',
        progression_mode: 'sequential',
        status: 'published',
        instructor_id: '',
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
    const [newLessonAssessmentEditor, setNewLessonAssessmentEditor] = useState({
        max_attempts: 3,
        passing_score: 70,
        questions: [{ question: '', options: ['', ''], correct_answer: '', instructions: '' }],
    });
    const [newLessonDuration, setNewLessonDuration] = useState('600');
    const [lessonKind, setLessonKind] = useState(null); // null (choosing) | 'video' | 'mcq' | 'written'
    const [addingLesson, setAddingLesson] = useState(false);

    // Create New Course Modal State
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newThumbnail, setNewThumbnail] = useState('');
    const [newLevel, setNewLevel] = useState('Beginner');
    const [newCategory, setNewCategory] = useState('Cybersecurity');
    const [newDuration, setNewDuration] = useState('4 Weeks');
    const [newPrice, setNewPrice] = useState('49.00');
    const [newInstructorId, setNewInstructorId] = useState('');
    const [newProgressionMode, setNewProgressionMode] = useState('sequential');
    const [creatingCourse, setCreatingCourse] = useState(false);

    const [liveSessionForm, setLiveSessionForm] = useState({
        title: '',
        description: '',
        starts_at: '',
        duration_minutes: '60',
        status: 'scheduled',
    });
    const [savingLiveSession, setSavingLiveSession] = useState(false);

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

    const loadInstructors = async () => {
        try {
            const result = await api.getAdminUsersList();
            setInstructors((result.users || []).filter((user) => user.role === 'instructor'));
        } catch (error) {
            setMessage(error.message || 'Unable to load instructors.');
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
                thumbnail_url: newThumbnail || null,
                level: newLevel,
                category: newCategory,
                duration: newDuration,
                price: parseFloat(newPrice) || 0,
                progression_mode: newProgressionMode,
                status: 'published',
                instructor_id: newInstructorId || null,
            });

            setMessage(`Course "${newTitle}" created successfully!`);
            setShowNewCourseModal(false);
            setNewTitle('');
            setNewDescription('');
            setNewThumbnail('');
            setNewPrice('49.00');
            setNewInstructorId('');

            await loadCourses();
            if (res?.id) {
                handleSelectCourse(res.id);
            }
        } catch (e) {
            alert(e.message || 'Failed to create course');
        } finally {
            setCreatingCourse(false);
        }
    };

    const handleCreateLiveSession = async (e) => {
        e.preventDefault();
        if (!selectedCourse) return;
        setSavingLiveSession(true);
        setMessage('');

        try {
            await api.createCourseLiveSession(selectedCourse.id, {
                title: liveSessionForm.title,
                description: liveSessionForm.description,
                starts_at: liveSessionForm.starts_at || undefined,
                duration_minutes: Number(liveSessionForm.duration_minutes || 60),
                status: liveSessionForm.status,
            });

            setMessage(`Live class "${liveSessionForm.title}" scheduled successfully.`);
            setLiveSessionForm({ title: '', description: '', starts_at: '', duration_minutes: '60', status: 'scheduled' });
            const refreshed = await api.getCourseDetails(selectedCourse.id);
            setSelectedCourse(refreshed);
        } catch (e) {
            alert(e.message || 'Unable to schedule live class.');
        } finally {
            setSavingLiveSession(false);
        }
    };

    const handleDeleteLiveSession = async (sessionId) => {
        if (!window.confirm('Delete this live class session?')) return;
        try {
            await api.deleteCourseLiveSession(sessionId);
            const refreshed = await api.getCourseDetails(selectedCourse.id);
            setSelectedCourse(refreshed);
            setMessage('Live class removed.');
        } catch (e) {
            alert(e.message || 'Unable to delete live class.');
        }
    };

    const openEditCourseModal = (course) => {
        loadInstructors();
        setEditingCourseModal(course);
        setEditCourseForm({
            title: course.title,
            description: course.description || '',
            thumbnail_url: course.thumbnail_url || '',
            level: course.level || 'Beginner',
            category: course.category || 'Cybersecurity',
            duration: course.duration || '4 Weeks',
            price: String(course.price || 49.00),
            progression_mode: course.progression_mode || 'sequential',
            status: course.status || 'published',
            instructor_id: course.instructor_id ? String(course.instructor_id) : '',
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
                thumbnail_url: editCourseForm.thumbnail_url || null,
                level: editCourseForm.level,
                category: editCourseForm.category,
                duration: editCourseForm.duration,
                price: parseFloat(editCourseForm.price) || 0,
                progression_mode: editCourseForm.progression_mode,
                status: editCourseForm.status,
                instructor_id: editCourseForm.instructor_id || null,
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

    const createAssessmentEditor = (type = 'mcq') => ({
        max_attempts: 3,
        passing_score: 70,
        questions: type === 'mcq'
            ? [{ question: '', options: ['', ''], correct_answer: '', instructions: '' }]
            : [{ question: '', instructions: '' }],
    });

    const normalizeAssessmentEditor = (rawConfig, type) => {
        const safeType = type === 'written' ? 'written' : 'mcq';
        const normalizedQuestions = Array.isArray(rawConfig?.questions)
            ? rawConfig.questions
            : (Array.isArray(rawConfig) ? rawConfig : []);

        const questions = normalizedQuestions.length > 0
            ? normalizedQuestions.map((question) => {
                if (safeType === 'mcq') {
                    return {
                        question: question.question || question.text || '',
                        options: Array.isArray(question.options) && question.options.length > 0
                            ? question.options.map(String)
                            : ['', ''],
                        correct_answer: question.correct_answer || '',
                        instructions: question.instructions || '',
                    };
                }

                return {
                    question: question.question || question.text || '',
                    instructions: question.instructions || '',
                };
            })
            : [safeType === 'mcq'
                ? { question: '', options: ['', ''], correct_answer: '', instructions: '' }
                : { question: '', instructions: '' }];

        return {
            max_attempts: Number(rawConfig?.max_attempts || 3),
            passing_score: Number(rawConfig?.passing_score || 70),
            questions,
        };
    };

    const parseAssessmentConfig = () => {
        if (newLessonAssessmentType === 'none') {
            return {};
        }

        const questions = newLessonAssessmentEditor.questions
            .filter((question) => {
                if (newLessonAssessmentType === 'mcq') {
                    const hasContent = (question.question || '').trim() || question.options.some((option) => (option || '').trim());
                    return hasContent;
                }
                return (question.question || '').trim() || (question.instructions || '').trim();
            })
            .map((question) => {
                if (newLessonAssessmentType === 'mcq') {
                    const options = (question.options || []).map((option) => String(option).trim()).filter(Boolean);
                    return {
                        question: (question.question || '').trim(),
                        options,
                        correct_answer: String(question.correct_answer || '').trim(),
                        instructions: question.instructions || '',
                    };
                }

                return {
                    question: (question.question || '').trim(),
                    instructions: question.instructions || '',
                };
            });

        return {
            max_attempts: Number(newLessonAssessmentEditor.max_attempts || 3),
            passing_score: Number(newLessonAssessmentEditor.passing_score || 70),
            questions,
        };
    };

    const resetLessonForm = () => {
        setLessonKind(null);
        setNewLessonTitle('');
        setNewLessonDesc('');
        setNewLessonYoutubeUrl('');
        setNewLessonPdfUrl('');
        setNewLessonDuration('600');
        setNewLessonAssessmentType('none');
        setNewLessonAssessmentEditor({ max_attempts: 3, passing_score: 70, questions: [] });
    };

    const closeLessonModal = () => {
        setLessonModalSectionId(null);
        setEditingLessonModal(null);
        resetLessonForm();
    };

    const openAddLessonModal = (sectionId) => {
        resetLessonForm();
        setEditingLessonModal(null);
        setLessonModalSectionId(sectionId);
    };

    // Step 1 of the lesson modal: the chosen kind decides which fields are shown.
    const chooseLessonKind = (kind) => {
        setLessonKind(kind);
        if (kind === 'video') {
            setNewLessonAssessmentType('none');
            setNewLessonAssessmentEditor({ max_attempts: 3, passing_score: 70, questions: [] });
        } else {
            setNewLessonAssessmentType(kind);
            setNewLessonAssessmentEditor(createAssessmentEditor(kind));
        }
    };

    const buildLessonPayload = () => {
        const isVideo = lessonKind === 'video';
        return {
            title: newLessonTitle,
            description: newLessonDesc,
            youtube_url: isVideo ? newLessonYoutubeUrl : '',
            pdf_url: newLessonPdfUrl,
            assessment_type: isVideo ? newLessonAssessmentType : lessonKind,
            assessment_config: parseAssessmentConfig(),
            duration_seconds: isVideo ? (parseInt(newLessonDuration, 10) || 600) : 0,
        };
    };

    const validateLessonForm = () => {
        if (lessonKind === 'video' && !newLessonYoutubeUrl.trim()) {
            return 'Add the YouTube link for this video lesson.';
        }
        const type = lessonKind === 'video' ? newLessonAssessmentType : lessonKind;
        if (type === 'none') return '';
        const questions = parseAssessmentConfig().questions || [];
        if (questions.length === 0) {
            return type === 'mcq' ? 'Add at least one quiz question.' : 'Add at least one assignment prompt.';
        }
        if (type === 'mcq') {
            const broken = questions.findIndex((q) => !q.question || q.options.length < 2 || !q.options.includes(q.correct_answer));
            if (broken !== -1) {
                return `Question ${broken + 1} needs text, at least two options and a selected correct answer.`;
            }
        }
        return '';
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!lessonModalSectionId) return;
        const problem = validateLessonForm();
        if (problem) {
            alert(problem);
            return;
        }
        setAddingLesson(true);
        try {
            await api.createLesson(lessonModalSectionId, buildLessonPayload());
            closeLessonModal();
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to add lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const openEditLessonModal = (les) => {
        const kind = les.youtube_video_id || les.youtube_url
            ? 'video'
            : (['mcq', 'written'].includes(les.assessment_type) ? les.assessment_type : 'video');
        setLessonKind(kind);
        setEditingLessonModal(les);
        setNewLessonTitle(les.title);
        setNewLessonDesc(les.description || '');
        setNewLessonYoutubeUrl(les.youtube_url || (les.youtube_video_id ? `https://www.youtube.com/watch?v=${les.youtube_video_id}` : ''));
        setNewLessonPdfUrl(les.pdf_url || '');
        setNewLessonAssessmentType(les.assessment_type || 'none');
        setNewLessonAssessmentEditor(normalizeAssessmentEditor(les.assessment_config || {}, les.assessment_type || 'none'));
        setNewLessonDuration(String(les.duration_seconds || 600));
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!editingLessonModal) return;
        const problem = validateLessonForm();
        if (problem) {
            alert(problem);
            return;
        }
        setAddingLesson(true);
        try {
            await api.updateLesson(editingLessonModal.id, buildLessonPayload());
            closeLessonModal();
            await loadCourses();
        } catch (e) {
            alert(e.message || 'Failed to update lesson');
        } finally {
            setAddingLesson(false);
        }
    };

    const addAssessmentQuestion = () => {
        setNewLessonAssessmentEditor((current) => ({
            ...current,
            questions: newLessonAssessmentType === 'mcq'
                ? [...(current.questions || []), { question: '', options: ['', ''], correct_answer: '', instructions: '' }]
                : [...(current.questions || []), { question: '', instructions: '' }],
        }));
    };

    const updateAssessmentQuestion = (index, field, value) => {
        setNewLessonAssessmentEditor((current) => ({
            ...current,
            questions: (current.questions || []).map((question, questionIndex) => {
                if (questionIndex !== index) return question;
                if (newLessonAssessmentType === 'mcq') {
                    return { ...question, [field]: value };
                }
                return { ...question, [field]: value };
            }),
        }));
    };

    const updateAssessmentOption = (questionIndex, optionIndex, value) => {
        setNewLessonAssessmentEditor((current) => ({
            ...current,
            questions: (current.questions || []).map((question, idx) => {
                if (idx !== questionIndex) return question;
                const options = [...(question.options || ['', ''])];
                options[optionIndex] = value;
                return { ...question, options };
            }),
        }));
    };

    const removeAssessmentQuestion = (index) => {
        setNewLessonAssessmentEditor((current) => ({
            ...current,
            questions: (current.questions || []).filter((_, questionIndex) => questionIndex !== index),
        }));
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
                            onClick={() => { loadInstructors(); setShowNewCourseModal(true); }}
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
                            onClick={() => { loadInstructors(); setShowNewCourseModal(true); }}
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

                            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                                    <div className="flex items-center gap-2 text-[#0f172a]">
                                        <Video className="w-4 h-4 text-blue-600" />
                                        <h3 className="text-xs font-bold uppercase tracking-wider">Live Classroom Scheduler</h3>
                                    </div>
                                    <span className="text-[10px] text-slate-500">LiveKit ready</span>
                                </div>

                                <form onSubmit={handleCreateLiveSession} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={liveSessionForm.title}
                                        onChange={(e) => setLiveSessionForm({ ...liveSessionForm, title: e.target.value })}
                                        placeholder="Live session title"
                                        required
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={liveSessionForm.starts_at}
                                        onChange={(e) => setLiveSessionForm({ ...liveSessionForm, starts_at: e.target.value })}
                                        required
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <input
                                        type="number"
                                        min="15"
                                        max="300"
                                        value={liveSessionForm.duration_minutes}
                                        onChange={(e) => setLiveSessionForm({ ...liveSessionForm, duration_minutes: e.target.value })}
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <select
                                        value={liveSessionForm.status}
                                        onChange={(e) => setLiveSessionForm({ ...liveSessionForm, status: e.target.value })}
                                        className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="live">Live</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <textarea
                                        value={liveSessionForm.description}
                                        onChange={(e) => setLiveSessionForm({ ...liveSessionForm, description: e.target.value })}
                                        rows="3"
                                        placeholder="Session description or host instructions"
                                        className="md:col-span-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                    />
                                    <div className="md:col-span-2 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={savingLiveSession}
                                            className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm"
                                        >
                                            {savingLiveSession ? 'Scheduling...' : 'Create Live Class'}
                                        </button>
                                    </div>
                                </form>

                                {selectedCourse?.live_sessions?.length > 0 && (
                                    <div className="space-y-3 pt-2 border-t border-slate-200/80">
                                        <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Scheduled Sessions</h4>
                                        {selectedCourse.live_sessions.map((session) => (
                                            <div key={session.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <div>
                                                    <div className="text-xs font-bold text-[#0f172a]">{session.title}</div>
                                                    <div className="text-[11px] text-slate-500 mt-1">
                                                        {session.starts_at ? new Date(session.starts_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Schedule not set'}
                                                        {' • '}
                                                        {session.status}
                                                    </div>
                                                    {session.description && <div className="text-[11px] text-slate-500 mt-1">{session.description}</div>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {session.join_url ? (
                                                        <a
                                                            href={buildLiveClassLink(session.join_url)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold"
                                                        >
                                                            Join
                                                        </a>
                                                    ) : null}
                                                    {session.share_url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => navigator.clipboard?.writeText(buildLiveClassLink(session.share_url))}
                                                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                                                        >
                                                            Copy link
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteLiveSession(session.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                        title="Delete session"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                                    onClick={() => openAddLessonModal(sec.id)}
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

                            <CourseImageField value={newThumbnail} onChange={setNewThumbnail} />

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
                            <div>
                                <label htmlFor="new-course-instructor" className="text-xs font-semibold text-slate-700 block mb-1">Assigned instructor</label>
                                <select id="new-course-instructor" value={newInstructorId} onChange={(e) => setNewInstructorId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
                                    <option value="">No instructor assigned</option>
                                    {instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name} ({instructor.email})</option>)}
                                </select>
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

                            <CourseImageField
                                value={editCourseForm.thumbnail_url}
                                onChange={(url) => setEditCourseForm((current) => ({ ...current, thumbnail_url: url }))}
                            />

                            <div>
                                <label htmlFor="edit-course-instructor" className="text-xs font-semibold text-slate-700 block mb-1">Assigned instructor</label>
                                <select id="edit-course-instructor" value={editCourseForm.instructor_id} onChange={(e) => setEditCourseForm({ ...editCourseForm, instructor_id: e.target.value })} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800">
                                    <option value="">No instructor assigned</option>
                                    {instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name} ({instructor.email})</option>)}
                                </select>
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
                    <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain">
                        <button
                            type="button"
                            onClick={closeLessonModal}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                {lessonKind
                                    ? `${editingLessonModal ? 'Edit' : 'Add'} ${LESSON_KINDS.find((k) => k.id === lessonKind)?.label}`
                                    : 'Add Lesson'}
                            </span>
                            <h3 className="text-lg font-bold text-[#0f172a] mt-1">
                                {!lessonKind
                                    ? 'What do you want to add?'
                                    : editingLessonModal ? 'Update Lesson Content' : 'New Lesson Details'}
                            </h3>
                        </div>

                        {!lessonKind && (
                            <div className="space-y-2.5">
                                {LESSON_KINDS.map(({ id, label, description, Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => chooseLessonKind(id)}
                                        className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-blue-400 hover:bg-blue-50/50 transition shadow-sm"
                                    >
                                        <span className="mt-0.5 rounded-lg bg-blue-50 border border-blue-200 p-2 text-blue-700">
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <span>
                                            <span className="block text-sm font-bold text-[#0f172a]">{label}</span>
                                            <span className="block text-xs text-slate-500 mt-0.5">{description}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {lessonKind && (
                        <form onSubmit={editingLessonModal ? handleSaveLesson : handleAddLesson} className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Lesson Title</label>
                                <input
                                    type="text"
                                    placeholder={lessonKind === 'mcq'
                                        ? 'e.g. Quiz 1: Network Security Basics'
                                        : lessonKind === 'written'
                                            ? 'e.g. Assignment 1: Incident Response Plan'
                                            : 'e.g. Lesson 2: Network Packet Inspection & SIEM Triage'}
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            {lessonKind === 'video' && (
                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">YouTube Video Link or ID</label>
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/watch?v=VIDEO_ID or youtu.be/ID"
                                    value={newLessonYoutubeUrl}
                                    onChange={(e) => setNewLessonYoutubeUrl(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>
                            )}

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

                            {lessonKind === 'video' && (
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
                            )}

                            <div className={`grid gap-3 ${lessonKind === 'video' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {lessonKind === 'video' && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Quiz after the video (optional)</label>
                                    <select
                                        value={newLessonAssessmentType}
                                        onChange={(e) => {
                                            const nextType = e.target.value;
                                            setNewLessonAssessmentType(nextType);
                                            setNewLessonAssessmentEditor((current) => {
                                                if (nextType === 'none') {
                                                    return { max_attempts: 3, passing_score: 70, questions: [] };
                                                }
                                                if (current.questions?.length) return current;
                                                return createAssessmentEditor(nextType);
                                            });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                    >
                                        <option value="none">No Assessment</option>
                                        <option value="mcq">MCQ Quiz</option>
                                        <option value="written">Written Response</option>
                                    </select>
                                </div>
                                )}

                                {newLessonAssessmentType !== 'none' && (
                                <div className={`grid gap-2 ${newLessonAssessmentType === 'mcq' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 block mb-1">Attempts allowed</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={newLessonAssessmentEditor.max_attempts || 3}
                                            onChange={(e) => setNewLessonAssessmentEditor((current) => ({ ...current, max_attempts: Number(e.target.value) || 1 }))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                        />
                                    </div>
                                    {newLessonAssessmentType === 'mcq' && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-700 block mb-1">Pass %</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={newLessonAssessmentEditor.passing_score || 70}
                                            onChange={(e) => setNewLessonAssessmentEditor((current) => ({ ...current, passing_score: Number(e.target.value) || 0 }))}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                                        />
                                    </div>
                                    )}
                                </div>
                                )}
                            </div>
                            {newLessonAssessmentType === 'written' && (
                                <p className="text-[11px] text-slate-500 -mt-1">Written answers are graded by the instructor in Instructor Reviews.</p>
                            )}

                            {newLessonAssessmentType !== 'none' && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                                            {newLessonAssessmentType === 'mcq' ? 'Question Builder' : 'Written Prompt'}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={addAssessmentQuestion}
                                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                                        >
                                            <Plus className="w-3 h-3" /> Add question
                                        </button>
                                    </div>

                                    {(newLessonAssessmentEditor.questions || []).map((question, questionIndex) => (
                                        <div key={questionIndex} className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Question {questionIndex + 1}</span>
                                                {newLessonAssessmentEditor.questions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAssessmentQuestion(questionIndex)}
                                                        className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-600 block mb-1">Question text</label>
                                                <textarea
                                                    rows="2"
                                                    value={question.question || ''}
                                                    onChange={(e) => updateAssessmentQuestion(questionIndex, 'question', e.target.value)}
                                                    placeholder={newLessonAssessmentType === 'mcq' ? 'Example: Which control best reduces exposure to credential stuffing?' : 'Example: Describe how you would design an AI risk review process.'}
                                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                                />
                                            </div>

                                            {newLessonAssessmentType === 'mcq' ? (
                                                <div className="space-y-2">
                                                    {(question.options || ['', '']).map((option, optionIndex) => (
                                                        <div key={optionIndex} className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`correct-answer-${questionIndex}`}
                                                                checked={question.correct_answer === option}
                                                                onChange={() => updateAssessmentQuestion(questionIndex, 'correct_answer', option)}
                                                                className="accent-blue-600"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={option}
                                                                onChange={(e) => updateAssessmentOption(questionIndex, optionIndex, e.target.value)}
                                                                placeholder={`Option ${optionIndex + 1}`}
                                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAssessmentQuestion(questionIndex, 'options', [...(question.options || []), ''])}
                                                        className="text-[10px] font-semibold text-blue-700 hover:text-blue-800"
                                                    >
                                                        + Add option
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">Instruction text shown under the question</label>
                                                    <textarea
                                                        rows="2"
                                                        value={question.instructions || ''}
                                                        onChange={(e) => updateAssessmentQuestion(questionIndex, 'instructions', e.target.value)}
                                                        placeholder="Optional guidance for the student, such as: respond in 150-300 words and explain trade-offs."
                                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">
                                    {lessonKind === 'video' ? 'Lesson Notes & Summary' : 'Instructions for students'}
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder={lessonKind === 'video'
                                        ? 'Summary of topics covered in this lesson...'
                                        : 'e.g. Answer every question. You have 3 attempts; 70% is needed to pass.'}
                                    value={newLessonDesc}
                                    onChange={(e) => setNewLessonDesc(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                                {!editingLessonModal && (
                                    <button
                                        type="button"
                                        onClick={() => setLessonKind(null)}
                                        className="mr-auto px-3 py-2 rounded-xl text-blue-700 text-xs font-semibold hover:bg-blue-50 flex items-center gap-1"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Change type
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={closeLessonModal}
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
