import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
    Award, CheckCircle, Download, Printer, Shield, Calendar, X,
    ExternalLink, ShieldCheck, Search, ChevronLeft, ChevronRight,
    Move, Sliders, Plus, Edit3, Image as ImageIcon, Sparkles, UserCheck, RefreshCw,
    Layers, PenTool, CheckCircle2, FileText, Lock, Settings2, Upload, Trash2, RotateCcw,
    Copy, Eye, EyeOff, Stamp, Tag, SlidersHorizontal, Maximize2, Wand2, Sun, Moon
} from 'lucide-react';

// Helper: Automatic Client-Side Background & Checkerboard Eliminator
const removeBackgroundFromDataUrl = (dataUrl, threshold = 205) => {
    return new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Luminance / brightness
                const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
                const isGreyOrWhite = Math.abs(r - g) < 25 && Math.abs(g - b) < 25 && Math.abs(r - b) < 25;

                // Detect white or checkered grey pixels (typically brightness > 180 for checkerboard)
                if (brightness >= threshold || (isGreyOrWhite && brightness >= 180)) {
                    if (brightness >= 240) {
                        data[i + 3] = 0; // 100% Transparent
                    } else {
                        // Smooth falloff to keep anti-aliased pen ink razor-sharp
                        const factor = Math.max(0, (240 - brightness) / 60);
                        data[i + 3] = Math.floor(data[i + 3] * factor);
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

export default function CertificatesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Tabs: 'registry' | 'designer'
    const [activeTab, setActiveTab] = useState(isAdmin ? 'designer' : 'registry');

    // Certificates registry
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [certsPerPage, setCertsPerPage] = useState(4);

    // Designer & Studio State
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [customStudentName, setCustomStudentName] = useState('Alex Johnson');
    const [customCourseTitle, setCustomCourseTitle] = useState('Cybersecurity Fundamentals & Threat Analysis Masterclass');
    const [customCertCode, setCustomCertCode] = useState(`CERT-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
    const [customVerCode, setCustomVerCode] = useState(`VER-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    const [customIssueDate, setCustomIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [customHonors, setCustomHonors] = useState('With Highest Distinction & Practical Merit');

    // Template Style: 'gold' | 'cyber' | 'iso' | 'minimal' | 'custom_bg'
    const [templateStyle, setTemplateStyle] = useState('gold');
    const [customBgImage, setCustomBgImage] = useState('');

    // Draggable Signatures with Background Removal & Blend Modes
    const [sig1, setSig1] = useState({
        name: 'Dr. Marcus Vance',
        title: 'Chief Information Security Officer (CISO)',
        sigText: 'M. Vance',
        sigUrl: '', // Base64 or URL of uploaded signature image
        rawSigUrl: '', // Backup of original uploaded image
        width: 140, // px width
        blendMode: 'multiply', // 'multiply' | 'normal' | 'screen' | 'darken'
        invert: false,
        x: 20, // percentage of canvas width
        y: 80, // percentage of canvas height
        show: true,
    });

    const [sig2, setSig2] = useState({
        name: 'Sarah Jenkins, CISSP',
        title: 'Lead Academy & Compliance Director',
        sigText: 'S. Jenkins',
        sigUrl: '', // Base64 or URL of uploaded signature image
        rawSigUrl: '',
        width: 140,
        blendMode: 'multiply',
        invert: false,
        x: 80,
        y: 80,
        show: true,
    });

    // Default Accreditation Seal
    const [logoSeal, setLogoSeal] = useState({
        type: 'gold_seal', // 'gold_seal' | 'cyber_badge' | 'iso_crest' | 'custom'
        customUrl: '',
        label: 'OFFICIAL VERIFIED ACCREDITATION',
        size: 70, // px
        blendMode: 'multiply',
        x: 50,
        y: 80,
        show: true,
    });

    // Custom Uploaded Items / Logos / Badges / Watermarks (Unlimited dynamic elements)
    const [customItems, setCustomItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);

    // Active drag tracking
    const [draggingElement, setDraggingElement] = useState(null); // 'sig1' | 'sig2' | 'logo' | 'custom_item_id'
    const canvasRef = useRef(null);

    // Hidden file input refs
    const sig1FileRef = useRef(null);
    const sig2FileRef = useRef(null);
    const logoFileRef = useRef(null);
    const bgFileRef = useRef(null);
    const customItemFileRef = useRef(null);

    // Issuing State
    const [issuing, setIssuing] = useState(false);
    const [issueSuccess, setIssueSuccess] = useState('');
    const [issueError, setIssueError] = useState('');

    useEffect(() => {
        fetchCertificates();
        if (isAdmin) {
            loadAdminDependencies();
        }
    }, [isAdmin]);

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            const data = await api.getMyCertificates();
            setCertificates(data || []);
        } catch (e) {
            console.error('Failed to load certificates:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminDependencies = async () => {
        try {
            const [usersRes, coursesRes] = await Promise.all([
                api.getAdminUsersList().catch(() => ({ users: [] })),
                api.getCourses().catch(() => []),
            ]);

            const userList = usersRes.users || [];
            setStudents(userList);
            setCourses(coursesRes || []);

            if (userList.length > 0 && !selectedStudentId) {
                setSelectedStudentId(userList[0].id);
                setCustomStudentName(userList[0].name);
            }
            if (coursesRes.length > 0 && !selectedCourseId) {
                setSelectedCourseId(coursesRes[0].id);
                setCustomCourseTitle(coursesRes[0].title);
            }
        } catch (e) {
            console.error('Failed to load admin dependencies:', e);
        }
    };

    const handleStudentChange = (userId) => {
        setSelectedStudentId(userId);
        const s = students.find((item) => String(item.id) === String(userId));
        if (s) setCustomStudentName(s.name);
    };

    const handleCourseChange = (courseId) => {
        setSelectedCourseId(courseId);
        const c = courses.find((item) => String(item.id) === String(courseId));
        if (c) setCustomCourseTitle(c.title);
    };

    const generateNewCodes = () => {
        setCustomCertCode(`CERT-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
        setCustomVerCode(`VER-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    };

    // Generic File Upload Handler with Auto Transparency Cleaning
    const handleFileUpload = (e, callback) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, SVG, WebP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (uploadEvent) => {
            const rawDataUrl = uploadEvent.target.result;
            // Automatically clean white/checkerboard backgrounds on upload
            const transparentUrl = await removeBackgroundFromDataUrl(rawDataUrl);
            callback(transparentUrl, file.name, rawDataUrl);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset input
    };

    // Manual Trigger: Auto Remove Background & Checkerboard from Signature
    const handleCleanSignatureBg = async (sigNum) => {
        if (sigNum === 1 && sig1.sigUrl) {
            const cleaned = await removeBackgroundFromDataUrl(sig1.rawSigUrl || sig1.sigUrl, 195);
            setSig1((p) => ({ ...p, sigUrl: cleaned, blendMode: 'multiply' }));
        } else if (sigNum === 2 && sig2.sigUrl) {
            const cleaned = await removeBackgroundFromDataUrl(sig2.rawSigUrl || sig2.sigUrl, 195);
            setSig2((p) => ({ ...p, sigUrl: cleaned, blendMode: 'multiply' }));
        }
    };

    // Add New Custom Item / Uploaded Logo
    const handleAddCustomImageItem = (dataUrl, fileName, rawUrl) => {
        const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'image',
            title: fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Uploaded Item',
            url: dataUrl,
            rawUrl: rawUrl || dataUrl,
            width: 100,
            blendMode: 'multiply',
            opacity: 100,
            rotation: 0,
            x: 50,
            y: 50,
            show: true,
        };
        setCustomItems((prev) => [...prev, newItem]);
        setSelectedItemId(newItem.id);
    };

    // Add Preset Badge
    const handleAddPresetBadge = (badgeType) => {
        const presets = {
            shield: {
                title: 'Security Shield Badge',
                type: 'preset_shield',
                width: 70,
                x: 50,
                y: 25,
            },
            verified: {
                title: 'Verified Stamp',
                type: 'preset_verified',
                width: 80,
                x: 85,
                y: 20,
            },
            iso: {
                title: 'ISO 27001 Auditor Crest',
                type: 'preset_iso',
                width: 75,
                x: 15,
                y: 20,
            },
        };

        const config = presets[badgeType];
        if (!config) return;

        const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: config.type,
            title: config.title,
            url: '',
            width: config.width,
            blendMode: 'normal',
            opacity: 100,
            rotation: 0,
            x: config.x,
            y: config.y,
            show: true,
        };
        setCustomItems((prev) => [...prev, newItem]);
        setSelectedItemId(newItem.id);
    };

    // Clean Custom Item Background
    const handleCleanItemBg = async (itemId) => {
        const target = customItems.find((i) => i.id === itemId);
        if (!target || !target.url) return;
        const cleaned = await removeBackgroundFromDataUrl(target.rawUrl || target.url, 195);
        updateCustomItem(itemId, { url: cleaned, blendMode: 'multiply' });
    };

    // Update specific custom item property
    const updateCustomItem = (id, updates) => {
        setCustomItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
    };

    // Remove custom item
    const removeCustomItem = (id) => {
        setCustomItems((prev) => prev.filter((item) => item.id !== id));
        if (selectedItemId === id) setSelectedItemId(null);
    };

    // Duplicate custom item
    const duplicateCustomItem = (item) => {
        const copy = {
            ...item,
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            title: `${item.title} (Copy)`,
            x: Math.min(item.x + 5, 90),
            y: Math.min(item.y + 5, 90),
        };
        setCustomItems((prev) => [...prev, copy]);
        setSelectedItemId(copy.id);
    };

    // Canvas Mouse / Touch Events for Universal Dragging
    const handleMouseDown = (elKey, e) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingElement(elKey);
        if (elKey.startsWith('item_')) {
            setSelectedItemId(elKey);
        }
    };

    const handleMouseMove = (e) => {
        if (!draggingElement || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

        if (!clientX || !clientY) return;

        let posX = ((clientX - rect.left) / rect.width) * 100;
        let posY = ((clientY - rect.top) / rect.height) * 100;

        // Clamp between 4% and 96%
        posX = Math.max(4, Math.min(96, Math.round(posX)));
        posY = Math.max(6, Math.min(96, Math.round(posY)));

        if (draggingElement === 'sig1') {
            setSig1((prev) => ({ ...prev, x: posX, y: posY }));
        } else if (draggingElement === 'sig2') {
            setSig2((prev) => ({ ...prev, x: posX, y: posY }));
        } else if (draggingElement === 'logo') {
            setLogoSeal((prev) => ({ ...prev, x: posX, y: posY }));
        } else if (draggingElement.startsWith('item_')) {
            updateCustomItem(draggingElement, { x: posX, y: posY });
        }
    };

    const handleMouseUp = () => {
        setDraggingElement(null);
    };

    const handleIssueCertificate = async (e) => {
        e.preventDefault();
        if (!selectedStudentId || !selectedCourseId) {
            alert('Please select both a student and a course.');
            return;
        }

        setIssuing(true);
        setIssueSuccess('');
        setIssueError('');

        try {
            await api.issueCertificate({
                user_id: selectedStudentId,
                course_id: selectedCourseId,
                certificate_code: customCertCode,
                verification_code: customVerCode,
                issued_at: customIssueDate,
            });

            setIssueSuccess(`Official Certificate (${customCertCode}) issued successfully to ${customStudentName}!`);
            generateNewCodes();
            await fetchCertificates();
        } catch (err) {
            setIssueError(err.message || 'Failed to issue certificate');
        } finally {
            setIssuing(false);
        }
    };

    const handlePrintCanvas = () => {
        window.print();
    };

    // Filtered certificates for registry list
    const filteredCertificates = useMemo(() => {
        return certificates.filter((cert) => {
            const q = searchTerm.toLowerCase();
            return (
                cert.course?.title?.toLowerCase().includes(q) ||
                cert.certificate_code?.toLowerCase().includes(q) ||
                cert.verification_code?.toLowerCase().includes(q) ||
                cert.user?.name?.toLowerCase().includes(q)
            );
        });
    }, [certificates, searchTerm]);

    const totalPages = Math.ceil(filteredCertificates.length / certsPerPage) || 1;
    const paginatedCertificates = useMemo(() => {
        const start = (currentPage - 1) * certsPerPage;
        return filteredCertificates.slice(start, start + certsPerPage);
    }, [filteredCertificates, currentPage, certsPerPage]);

    // Compute effective blend mode depending on template style
    const getEffectiveBlendMode = (mode) => {
        if (!mode || mode === 'multiply') {
            return templateStyle === 'cyber' ? 'screen' : 'multiply';
        }
        return mode;
    };

    return (
        <div
            className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {/* Header Banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Verified Digital Credentials & Studio</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                        Certificates Center & Custom Designer
                    </h1>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-xl leading-relaxed">
                        Upload custom signatures & logos with <strong>automatic background removal</strong>. Seamlessly blend dark ink directly onto the certificate paper without grey boxes or checkerboard borders.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {isAdmin && (
                        <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-xl border border-slate-200 shadow-xs">
                            <button
                                onClick={() => setActiveTab('designer')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                    activeTab === 'designer'
                                        ? 'bg-[#0f172a] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <PenTool className="w-3.5 h-3.5 text-cyan-400" /> Custom Designer & Studio
                            </button>
                            <button
                                onClick={() => setActiveTab('registry')}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                                    activeTab === 'registry'
                                        ? 'bg-[#0f172a] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5 text-amber-500" /> Issued Registry ({certificates.length})
                            </button>
                        </div>
                    )}

                    <Link
                        to="/certificate/verify"
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 shadow-sm"
                    >
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Public Verification Tool</span>
                    </Link>
                </div>
            </div>

            {/* Notification Messages */}
            {issueSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in print:hidden">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{issueSuccess}</span>
                    </div>
                    <button onClick={() => setIssueSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold p-1">
                        ✕
                    </button>
                </div>
            )}

            {issueError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in print:hidden">
                    <span>{issueError}</span>
                    <button onClick={() => setIssueError('')} className="text-red-600 hover:text-red-900 font-bold p-1">✕</button>
                </div>
            )}

            {/* TAB 1: INTERACTIVE CERTIFICATE DESIGNER & STUDIO */}
            {activeTab === 'designer' && isAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Customization Controls & Issue Form (Col 4) */}
                    <div className="lg:col-span-4 space-y-6 print:hidden">
                        {/* 1. Template Chooser & Background Upload */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" /> 1. Select Template & Background
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { id: 'gold', label: 'Gold Executive', desc: 'Luxury parchment & gold foil' },
                                    { id: 'cyber', label: 'CyberLoy Tech', desc: 'Deep navy / neon cyan shield' },
                                    { id: 'iso', label: 'ISO 27001 Auditor', desc: 'Emerald accreditation seal' },
                                    { id: 'minimal', label: 'Minimal Slate', desc: 'Clean corporate monochrome' },
                                    { id: 'custom_bg', label: 'Custom Upload', desc: 'Your own certificate artwork' },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTemplateStyle(t.id)}
                                        className={`p-3 rounded-xl border text-left transition ${
                                            templateStyle === t.id
                                                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 text-blue-950 shadow-xs'
                                                : 'border-slate-200 bg-[#f8fafc] hover:bg-slate-50 text-slate-700'
                                        } ${t.id === 'custom_bg' ? 'col-span-2' : ''}`}
                                    >
                                        <div className="font-bold text-xs flex items-center justify-between">
                                            <span>{t.label}</span>
                                            {t.id === 'custom_bg' && <Upload className="w-3.5 h-3.5 text-blue-600" />}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.desc}</div>
                                    </button>
                                ))}
                            </div>

                            {templateStyle === 'custom_bg' && (
                                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                                    <div className="font-semibold text-blue-950 flex items-center justify-between">
                                        <span>Upload Certificate Artwork / Border:</span>
                                        {customBgImage && (
                                            <button
                                                type="button"
                                                onClick={() => setCustomBgImage('')}
                                                className="text-red-500 hover:underline text-[11px] flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={bgFileRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, (dataUrl) => setCustomBgImage(dataUrl))}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => bgFileRef.current?.click()}
                                        className="w-full py-2 px-3 border border-dashed border-blue-400 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-semibold flex items-center justify-center gap-2 transition"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>{customBgImage ? 'Replace Certificate Artwork' : 'Upload Image (PNG/JPG)'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2. Upload Custom Logos & Arbitrary Items Manager */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" /> 2. Upload Logos & Items ({customItems.length})
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="file"
                                        ref={customItemFileRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, (dataUrl, fileName, rawUrl) => handleAddCustomImageItem(dataUrl, fileName, rawUrl))}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => customItemFileRef.current?.click()}
                                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>+ Upload Logo / Item</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                💡 Upload any logo, company stamp, watermark or badge. Every item is <strong>automatically blended</strong> and can be dragged anywhere!
                            </p>

                            {/* Quick Add Preset Items */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Add:</span>
                                <button
                                    type="button"
                                    onClick={() => handleAddPresetBadge('shield')}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 transition"
                                >
                                    <ShieldCheck className="w-3 h-3 text-cyan-600" /> + Shield Badge
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddPresetBadge('verified')}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 transition"
                                >
                                    <Stamp className="w-3 h-3 text-amber-600" /> + Verified Stamp
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddPresetBadge('iso')}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1 transition"
                                >
                                    <Award className="w-3 h-3 text-emerald-600" /> + ISO Crest
                                </button>
                            </div>

                            {/* List of Custom Uploaded Items */}
                            {customItems.length === 0 ? (
                                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                    No extra custom items added yet. Click "+ Upload Logo / Item" above to add logos, stamps, or watermarks.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                    {customItems.map((item) => {
                                        const isSelected = selectedItemId === item.id;
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedItemId(item.id)}
                                                className={`p-3 rounded-xl border transition cursor-pointer ${
                                                    isSelected
                                                        ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500'
                                                        : 'border-slate-200 bg-[#f8fafc] hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 truncate">
                                                        {item.type === 'image' && item.url ? (
                                                            <img src={item.url} alt={item.title} className="w-6 h-6 object-contain rounded shrink-0 bg-white border border-slate-200" />
                                                        ) : (
                                                            <Award className="w-5 h-5 text-amber-600 shrink-0" />
                                                        )}
                                                        <input
                                                            type="text"
                                                            value={item.title}
                                                            onChange={(e) => updateCustomItem(item.id, { title: e.target.value })}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none truncate w-32"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateCustomItem(item.id, { show: !item.show })}
                                                            title={item.show ? 'Hide on canvas' : 'Show on canvas'}
                                                            className={`p-1 rounded-md text-xs ${item.show ? 'text-blue-600 hover:bg-blue-100' : 'text-slate-400 hover:bg-slate-200'}`}
                                                        >
                                                            {item.show ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => duplicateCustomItem(item)}
                                                            title="Duplicate item"
                                                            className="p-1 rounded-md text-slate-600 hover:bg-slate-200 text-xs"
                                                        >
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCustomItem(item.id)}
                                                            title="Delete item"
                                                            className="p-1 rounded-md text-red-500 hover:bg-red-50 text-xs"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Image-specific Transparency & BG Removal Actions */}
                                                {item.type === 'image' && (
                                                    <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 border border-slate-200/80 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCleanItemBg(item.id)}
                                                            title="Auto-clean white & checkerboard pixels from this item"
                                                            className="flex-1 py-1 px-2 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 flex items-center justify-center gap-1 transition"
                                                        >
                                                            <Wand2 className="w-3 h-3 text-amber-600" />
                                                            <span>🪄 Auto Remove BG</span>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => updateCustomItem(item.id, { invert: !item.invert })}
                                                            title="Invert colors (black <-> white)"
                                                            className={`p-1 text-[10px] font-bold rounded border flex items-center gap-1 transition ${
                                                                item.invert ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            {item.invert ? <Moon className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                                                        </button>

                                                        <select
                                                            value={item.blendMode || 'multiply'}
                                                            onChange={(e) => updateCustomItem(item.id, { blendMode: e.target.value })}
                                                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 font-semibold"
                                                        >
                                                            <option value="multiply">Multiply (Ink)</option>
                                                            <option value="normal">Normal</option>
                                                            <option value="screen">Screen (Dark)</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {/* Size & Opacity Controls for this Item */}
                                                <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-500 pt-1" onClick={(e) => e.stopPropagation()}>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span>Size:</span>
                                                            <span className="font-mono">{item.width}px</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="30"
                                                            max="260"
                                                            value={item.width}
                                                            onChange={(e) => updateCustomItem(item.id, { width: Number(e.target.value) })}
                                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span>Opacity:</span>
                                                            <span className="font-mono">{item.opacity}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="10"
                                                            max="100"
                                                            value={item.opacity}
                                                            onChange={(e) => updateCustomItem(item.id, { opacity: Number(e.target.value) })}
                                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                                    <span>Position: X: {item.x}% | Y: {item.y}%</span>
                                                    <span className="text-blue-600 text-[10px]">Drag on canvas to move</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 3. Signatures & Official Seals Manager (With Background Remover) */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                    <PenTool className="w-4 h-4 text-blue-600" /> 3. Signatures & Core Seals
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSig1((p) => ({ ...p, x: 20, y: 80, width: 140, blendMode: 'multiply', invert: false }));
                                        setSig2((p) => ({ ...p, x: 80, y: 80, width: 140, blendMode: 'multiply', invert: false }));
                                        setLogoSeal((p) => ({ ...p, x: 50, y: 80, size: 70 }));
                                    }}
                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset Positions
                                </button>
                            </div>

                            {/* Signer 1 Settings + Image Upload */}
                            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <PenTool className="w-3.5 h-3.5 text-blue-600" /> Left Signer (Primary)
                                    </span>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sig1.show}
                                            onChange={(e) => setSig1({ ...sig1, show: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600"
                                        />
                                        <span>Show</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={sig1.name}
                                        onChange={(e) => setSig1({ ...sig1, name: e.target.value })}
                                        placeholder="Signer Name"
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-medium"
                                    />
                                    <input
                                        type="text"
                                        value={sig1.title}
                                        onChange={(e) => setSig1({ ...sig1, title: e.target.value })}
                                        placeholder="Signer Title"
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                                    />
                                </div>

                                {/* Signature 1 Upload Control & Background Remover */}
                                <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-slate-700">Signature Image:</span>
                                        {sig1.sigUrl ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCleanSignatureBg(1)}
                                                    title="Auto-clean white & checkerboard pixels"
                                                    className="text-amber-600 hover:text-amber-700 font-bold text-[10px] flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                                                >
                                                    <Wand2 className="w-3 h-3" /> Auto Remove BG
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSig1({ ...sig1, sigUrl: '', rawSigUrl: '' })}
                                                    className="text-red-500 hover:underline flex items-center gap-1 text-[10px]"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Clear
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-[10px]">Using script font</span>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={sig1FileRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, (dataUrl, fileName, rawUrl) => setSig1({ ...sig1, sigUrl: dataUrl, rawSigUrl: rawUrl, blendMode: 'multiply' }))}
                                        className="hidden"
                                    />

                                    {sig1.sigUrl ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                                <div className="h-10 px-2 flex items-center justify-center bg-white/80 rounded border border-slate-200 overflow-hidden">
                                                    <img
                                                        src={sig1.sigUrl}
                                                        alt="Signature 1"
                                                        style={{
                                                            mixBlendMode: sig1.blendMode === 'multiply' ? 'multiply' : 'normal',
                                                            filter: sig1.invert ? 'invert(1)' : 'none',
                                                        }}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSig1((p) => ({ ...p, invert: !p.invert }))}
                                                        title="Invert signature ink color (black <-> white)"
                                                        className={`p-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition ${
                                                            sig1.invert ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                                                        }`}
                                                    >
                                                        {sig1.invert ? <Moon className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                                                        <span>Invert</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => sig1FileRef.current?.click()}
                                                        className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                                    >
                                                        Replace
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Blend Mode Selector */}
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span className="font-medium">Paper Blend:</span>
                                                <select
                                                    value={sig1.blendMode}
                                                    onChange={(e) => setSig1({ ...sig1, blendMode: e.target.value })}
                                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 font-semibold"
                                                >
                                                    <option value="multiply">Multiply (Seamless Ink Blend)</option>
                                                    <option value="normal">Normal (Opaque)</option>
                                                    <option value="screen">Screen (For Dark Theme)</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => sig1FileRef.current?.click()}
                                                className="flex-1 py-1.5 px-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                            >
                                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Upload Signature Image</span>
                                            </button>
                                            <input
                                                type="text"
                                                value={sig1.sigText}
                                                onChange={(e) => setSig1({ ...sig1, sigText: e.target.value })}
                                                placeholder="Or type script..."
                                                className="w-28 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-serif italic"
                                            />
                                        </div>
                                    )}

                                    {/* Width scale slider */}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                                        <span>Size:</span>
                                        <input
                                            type="range"
                                            min="60"
                                            max="220"
                                            value={sig1.width}
                                            onChange={(e) => setSig1({ ...sig1, width: Number(e.target.value) })}
                                            className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="w-8 text-right font-mono">{sig1.width}px</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>X: {sig1.x}% | Y: {sig1.y}%</span>
                                    <button
                                        type="button"
                                        onClick={() => setSig1((p) => ({ ...p, x: 20, y: 80 }))}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Reset Position
                                    </button>
                                </div>
                            </div>

                            {/* Signer 2 Settings + Image Upload */}
                            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <PenTool className="w-3.5 h-3.5 text-blue-600" /> Right Signer (Secondary)
                                    </span>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sig2.show}
                                            onChange={(e) => setSig2({ ...sig2, show: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600"
                                        />
                                        <span>Show</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={sig2.name}
                                        onChange={(e) => setSig2({ ...sig2, name: e.target.value })}
                                        placeholder="Signer Name"
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-medium"
                                    />
                                    <input
                                        type="text"
                                        value={sig2.title}
                                        onChange={(e) => setSig2({ ...sig2, title: e.target.value })}
                                        placeholder="Signer Title"
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                                    />
                                </div>

                                {/* Signature 2 Upload Control & Background Remover */}
                                <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-semibold text-slate-700">Signature Image:</span>
                                        {sig2.sigUrl ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCleanSignatureBg(2)}
                                                    title="Auto-clean white & checkerboard pixels"
                                                    className="text-amber-600 hover:text-amber-700 font-bold text-[10px] flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                                                >
                                                    <Wand2 className="w-3 h-3" /> Auto Remove BG
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSig2({ ...sig2, sigUrl: '', rawSigUrl: '' })}
                                                    className="text-red-500 hover:underline flex items-center gap-1 text-[10px]"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Clear
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-[10px]">Using script font</span>
                                        )}
                                    </div>

                                    <input
                                        type="file"
                                        ref={sig2FileRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, (dataUrl, fileName, rawUrl) => setSig2({ ...sig2, sigUrl: dataUrl, rawSigUrl: rawUrl, blendMode: 'multiply' }))}
                                        className="hidden"
                                    />

                                    {sig2.sigUrl ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                                <div className="h-10 px-2 flex items-center justify-center bg-white/80 rounded border border-slate-200 overflow-hidden">
                                                    <img
                                                        src={sig2.sigUrl}
                                                        alt="Signature 2"
                                                        style={{
                                                            mixBlendMode: sig2.blendMode === 'multiply' ? 'multiply' : 'normal',
                                                            filter: sig2.invert ? 'invert(1)' : 'none',
                                                        }}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSig2((p) => ({ ...p, invert: !p.invert }))}
                                                        title="Invert signature ink color (black <-> white)"
                                                        className={`p-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition ${
                                                            sig2.invert ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                                                        }`}
                                                    >
                                                        {sig2.invert ? <Moon className="w-3 h-3 text-cyan-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                                                        <span>Invert</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => sig2FileRef.current?.click()}
                                                        className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                                                    >
                                                        Replace
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Blend Mode Selector */}
                                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                <span className="font-medium">Paper Blend:</span>
                                                <select
                                                    value={sig2.blendMode}
                                                    onChange={(e) => setSig2({ ...sig2, blendMode: e.target.value })}
                                                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 font-semibold"
                                                >
                                                    <option value="multiply">Multiply (Seamless Ink Blend)</option>
                                                    <option value="normal">Normal (Opaque)</option>
                                                    <option value="screen">Screen (For Dark Theme)</option>
                                                </select>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => sig2FileRef.current?.click()}
                                                className="flex-1 py-1.5 px-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                            >
                                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Upload Signature Image</span>
                                            </button>
                                            <input
                                                type="text"
                                                value={sig2.sigText}
                                                onChange={(e) => setSig2({ ...sig2, sigText: e.target.value })}
                                                placeholder="Or type script..."
                                                className="w-28 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-serif italic"
                                            />
                                        </div>
                                    )}

                                    {/* Width scale slider */}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                                        <span>Size:</span>
                                        <input
                                            type="range"
                                            min="60"
                                            max="220"
                                            value={sig2.width}
                                            onChange={(e) => setSig2({ ...sig2, width: Number(e.target.value) })}
                                            className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="w-8 text-right font-mono">{sig2.width}px</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>X: {sig2.x}% | Y: {sig2.y}%</span>
                                    <button
                                        type="button"
                                        onClick={() => setSig2((p) => ({ ...p, x: 80, y: 80 }))}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Reset Position
                                    </button>
                                </div>
                            </div>

                            {/* Seal & Logo Settings + Upload */}
                            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5 text-amber-600" /> Accreditation Seal / Crest
                                    </span>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={logoSeal.show}
                                            onChange={(e) => setLogoSeal({ ...logoSeal, show: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600"
                                        />
                                        <span>Show</span>
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={logoSeal.type}
                                        onChange={(e) => setLogoSeal({ ...logoSeal, type: e.target.value })}
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-medium"
                                    >
                                        <option value="gold_seal">Gold Roman Seal</option>
                                        <option value="cyber_badge">CyberShield Badge</option>
                                        <option value="iso_crest">ISO 27001 Crest</option>
                                        <option value="custom">Custom Uploaded Logo</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={logoSeal.label}
                                        onChange={(e) => setLogoSeal({ ...logoSeal, label: e.target.value })}
                                        placeholder="Seal Subtitle"
                                        className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                                    />
                                </div>

                                {/* Custom Logo Upload */}
                                {logoSeal.type === 'custom' && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-2">
                                        <input
                                            type="file"
                                            ref={logoFileRef}
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, (dataUrl) => setLogoSeal({ ...logoSeal, customUrl: dataUrl }))}
                                            className="hidden"
                                        />
                                        {logoSeal.customUrl ? (
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center">
                                                    <img
                                                        src={logoSeal.customUrl}
                                                        alt="Logo"
                                                        style={{ mixBlendMode: getEffectiveBlendMode(logoSeal.blendMode) }}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => logoFileRef.current?.click()}
                                                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                                >
                                                    Change Logo
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => logoFileRef.current?.click()}
                                                className="w-full py-1.5 px-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                                            >
                                                <Upload className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Upload Company / Institution Logo</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Logo size slider */}
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                                    <span>Seal Size:</span>
                                    <input
                                        type="range"
                                        min="40"
                                        max="140"
                                        value={logoSeal.size}
                                        onChange={(e) => setLogoSeal({ ...logoSeal, size: Number(e.target.value) })}
                                        className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="w-8 text-right font-mono">{logoSeal.size}px</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                    <span>X: {logoSeal.x}% | Y: {logoSeal.y}%</span>
                                    <button
                                        type="button"
                                        onClick={() => setLogoSeal((p) => ({ ...p, x: 50, y: 80 }))}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Reset Position
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Issue for Individual Student Form */}
                        <form onSubmit={handleIssueCertificate} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-blue-600" /> 4. Issue for Individual Student
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Registered Student</label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => handleStudentChange(e.target.value)}
                                    required
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 shadow-xs font-medium"
                                >
                                    <option value="">-- Choose Student --</option>
                                    {students.map((st) => (
                                        <option key={st.id} value={st.id}>
                                            {st.name} ({st.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Course Program</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => handleCourseChange(e.target.value)}
                                    required
                                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 shadow-xs font-medium"
                                >
                                    <option value="">-- Choose Course --</option>
                                    {courses.map((co) => (
                                        <option key={co.id} value={co.id}>
                                            {co.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Certificate ID</label>
                                    <input
                                        type="text"
                                        value={customCertCode}
                                        onChange={(e) => setCustomCertCode(e.target.value)}
                                        required
                                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:border-blue-500 shadow-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Code</label>
                                    <input
                                        type="text"
                                        value={customVerCode}
                                        onChange={(e) => setCustomVerCode(e.target.value)}
                                        required
                                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:border-blue-500 shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                                    <input
                                        type="date"
                                        value={customIssueDate}
                                        onChange={(e) => setCustomIssueDate(e.target.value)}
                                        required
                                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 shadow-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Honors</label>
                                    <input
                                        type="text"
                                        value={customHonors}
                                        onChange={(e) => setCustomHonors(e.target.value)}
                                        placeholder="e.g. With Distinction"
                                        className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-blue-500 shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={generateNewCodes}
                                    title="Regenerate Security Codes"
                                    className="p-2.5 rounded-xl bg-[#f8fafc] border border-slate-200 hover:bg-slate-100 text-slate-600 shadow-xs transition"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={issuing}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Award className="w-4 h-4 text-cyan-400" />
                                    <span>{issuing ? 'Issuing Certificate...' : 'Generate & Issue Certificate'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live Interactive Certificate Preview Canvas (Col 8) */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
                            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Live Studio Preview • Clean ink blending & drag-and-drop positioning</span>
                            </div>

                            <button
                                onClick={handlePrintCanvas}
                                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                                <Printer className="w-4 h-4 text-blue-600" />
                                <span>Print Certificate / PDF</span>
                            </button>
                        </div>

                        {/* Visual Certificate Canvas */}
                        <div
                            ref={canvasRef}
                            className={`relative w-full aspect-[1.414/1] rounded-3xl p-8 sm:p-12 transition-all shadow-xl overflow-hidden select-none ${
                                templateStyle === 'gold'
                                    ? 'bg-gradient-to-br from-[#fdfbf7] via-[#fffdfa] to-[#f8f4eb] border-8 border-[#d4af37] text-slate-900 shadow-amber-900/10'
                                    : templateStyle === 'cyber'
                                    ? 'bg-gradient-to-br from-[#060c18] via-[#091527] to-[#040812] border-8 border-cyan-500/80 text-white shadow-cyan-950/50'
                                    : templateStyle === 'iso'
                                    ? 'bg-gradient-to-br from-[#f2f9f5] via-[#ffffff] to-[#e8f5ee] border-8 border-emerald-600 text-slate-900 shadow-emerald-900/10'
                                    : templateStyle === 'custom_bg'
                                    ? 'bg-white border-8 border-slate-800 text-slate-900 shadow-slate-900/10'
                                    : 'bg-white border-8 border-slate-800 text-slate-900 shadow-slate-900/10'
                            }`}
                            style={
                                templateStyle === 'custom_bg' && customBgImage
                                    ? {
                                          backgroundImage: `url(${customBgImage})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                      }
                                    : {}
                            }
                        >
                            {/* Decorative Certificate Inner Border (when not custom bg) */}
                            {templateStyle !== 'custom_bg' && (
                                <div
                                    className={`absolute inset-3.5 border-2 pointer-events-none rounded-2xl ${
                                        templateStyle === 'gold'
                                            ? 'border-amber-400/60'
                                            : templateStyle === 'cyber'
                                            ? 'border-cyan-400/40'
                                            : templateStyle === 'iso'
                                            ? 'border-emerald-500/50'
                                            : 'border-slate-300'
                                    }`}
                                />
                            )}

                            {/* Watermark Crest Background */}
                            {templateStyle !== 'custom_bg' && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                                    <ShieldCheck className="w-96 h-96" />
                                </div>
                            )}

                            {/* Certificate Header Top */}
                            <div className="relative z-10 text-center space-y-2 pt-2">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <ShieldCheck className={`w-8 h-8 ${templateStyle === 'gold' ? 'text-amber-600' : templateStyle === 'cyber' ? 'text-cyan-400' : templateStyle === 'iso' ? 'text-emerald-600' : 'text-slate-800'}`} />
                                    <span className={`text-xs uppercase tracking-[0.25em] font-extrabold ${templateStyle === 'cyber' ? 'text-cyan-400' : 'text-slate-700'}`}>
                                        CyberLoy Enterprise Academy
                                    </span>
                                </div>

                                <h2 className={`text-2xl sm:text-4xl font-black tracking-wide uppercase ${templateStyle === 'gold' ? 'text-amber-800 font-serif' : templateStyle === 'cyber' ? 'text-white' : templateStyle === 'iso' ? 'text-emerald-900 font-serif' : 'text-slate-900'}`}>
                                    Certificate of Completion
                                </h2>

                                <p className={`text-xs uppercase tracking-widest font-semibold ${templateStyle === 'cyber' ? 'text-slate-400' : 'text-slate-500'}`}>
                                    This is officially presented to acknowledge that
                                </p>
                            </div>

                            {/* Recipient Name */}
                            <div className="relative z-10 text-center my-6 sm:my-8">
                                <div className={`text-2xl sm:text-4xl font-extrabold tracking-tight underline decoration-2 underline-offset-8 ${templateStyle === 'gold' ? 'text-amber-900 decoration-amber-500' : templateStyle === 'cyber' ? 'text-cyan-300 decoration-cyan-400' : templateStyle === 'iso' ? 'text-emerald-800 decoration-emerald-500' : 'text-slate-900 decoration-slate-400'}`}>
                                    {customStudentName || 'Alex Johnson'}
                                </div>
                                <p className={`text-xs mt-3 max-w-lg mx-auto ${templateStyle === 'cyber' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    has successfully demonstrated academic excellence and practical competence in completing the verified professional curriculum for:
                                </p>
                                <div className={`text-base sm:text-xl font-bold mt-2 ${templateStyle === 'gold' ? 'text-amber-800' : templateStyle === 'cyber' ? 'text-white' : templateStyle === 'iso' ? 'text-emerald-900' : 'text-slate-900'}`}>
                                    {customCourseTitle}
                                </div>
                                {customHonors && (
                                    <div className={`text-xs italic mt-1 ${templateStyle === 'gold' ? 'text-amber-700' : templateStyle === 'cyber' ? 'text-cyan-400' : 'text-emerald-700'}`}>
                                        ★ {customHonors} ★
                                    </div>
                                )}
                            </div>

                            {/* DYNAMIC CUSTOM UPLOADED ITEMS (Arbitrary logos, stamps, badges, watermarks) */}
                            {customItems.map((item) => {
                                if (!item.show) return null;
                                const isDragging = draggingElement === item.id;
                                const isSelected = selectedItemId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        onMouseDown={(e) => handleMouseDown(item.id, e)}
                                        onTouchStart={(e) => handleMouseDown(item.id, e)}
                                        style={{
                                            position: 'absolute',
                                            left: `${item.x}%`,
                                            top: `${item.y}%`,
                                            transform: 'translate(-50%, -50%)',
                                            opacity: (item.opacity ?? 100) / 100,
                                            width: `${item.width}px`,
                                        }}
                                        className={`cursor-move p-1.5 rounded-xl border border-dashed transition-all group ${
                                            isDragging || isSelected
                                                ? 'border-blue-500 bg-blue-50/70 scale-105 z-40 shadow-xl ring-2 ring-blue-400'
                                                : 'border-transparent hover:border-slate-400/60 z-30'
                                        }`}
                                    >
                                        <div className="pointer-events-none flex flex-col items-center justify-center text-center">
                                            {item.type === 'image' && item.url ? (
                                                <img
                                                    src={item.url}
                                                    alt={item.title}
                                                    style={{
                                                        width: `${item.width}px`,
                                                        mixBlendMode: getEffectiveBlendMode(item.blendMode),
                                                        filter: item.invert ? 'invert(1)' : 'none',
                                                    }}
                                                    className="h-auto max-w-full object-contain filter drop-shadow-sm"
                                                />
                                            ) : item.type === 'preset_shield' ? (
                                                <div
                                                    style={{ width: `${item.width}px`, height: `${item.width}px` }}
                                                    className="rounded-2xl bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md"
                                                >
                                                    <ShieldCheck className="w-2/3 h-2/3" />
                                                </div>
                                            ) : item.type === 'preset_verified' ? (
                                                <div
                                                    style={{ width: `${item.width}px`, height: `${item.width}px` }}
                                                    className="rounded-full bg-amber-500/10 border-2 border-dashed border-amber-600 flex items-center justify-center text-amber-700 shadow-sm"
                                                >
                                                    <Stamp className="w-2/3 h-2/3" />
                                                </div>
                                            ) : (
                                                <div
                                                    style={{ width: `${item.width}px`, height: `${item.width}px` }}
                                                    className="rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-sm"
                                                >
                                                    <Award className="w-2/3 h-2/3" />
                                                </div>
                                            )}

                                            {item.title && (
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-700 mt-1 truncate max-w-full">
                                                    {item.title}
                                                </span>
                                            )}
                                        </div>

                                        {/* Floating Position Indicator when dragging */}
                                        {(isDragging || isSelected) && (
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none z-50">
                                                X:{item.x}% Y:{item.y}%
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Draggable Component 1: Primary Signature (Left) */}
                            {sig1.show && (
                                <div
                                    onMouseDown={(e) => handleMouseDown('sig1', e)}
                                    onTouchStart={(e) => handleMouseDown('sig1', e)}
                                    style={{
                                        position: 'absolute',
                                        left: `${sig1.x}%`,
                                        top: `${sig1.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className={`cursor-move group p-2 rounded-xl border border-dashed transition-all ${
                                        draggingElement === 'sig1'
                                            ? 'border-blue-500 bg-blue-50/80 scale-105 z-30 shadow-lg'
                                            : 'border-transparent hover:border-slate-400/60 z-20'
                                    }`}
                                >
                                    <div className="text-center pointer-events-none flex flex-col items-center" style={{ width: `${sig1.width}px` }}>
                                        {sig1.sigUrl ? (
                                            <img
                                                src={sig1.sigUrl}
                                                alt="Uploaded Signature"
                                                style={{
                                                    mixBlendMode: getEffectiveBlendMode(sig1.blendMode),
                                                    filter: sig1.invert ? 'invert(1)' : 'none',
                                                }}
                                                className="h-14 w-auto max-w-full object-contain mb-1 filter drop-shadow-xs"
                                            />
                                        ) : (
                                            <div className={`font-serif text-lg italic ${templateStyle === 'cyber' ? 'text-cyan-300' : 'text-slate-800'}`}>
                                                {sig1.sigText || 'M. Vance'}
                                            </div>
                                        )}
                                        <div className={`w-full border-t my-1 ${templateStyle === 'cyber' ? 'border-cyan-500/60' : 'border-slate-800'}`} />
                                        <div className={`text-xs font-bold ${templateStyle === 'cyber' ? 'text-white' : 'text-slate-900'}`}>
                                            {sig1.name}
                                        </div>
                                        <div className={`text-[9px] uppercase font-semibold ${templateStyle === 'cyber' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {sig1.title}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Draggable Component 2: Logo / Seal (Center) */}
                            {logoSeal.show && (
                                <div
                                    onMouseDown={(e) => handleMouseDown('logo', e)}
                                    onTouchStart={(e) => handleMouseDown('logo', e)}
                                    style={{
                                        position: 'absolute',
                                        left: `${logoSeal.x}%`,
                                        top: `${logoSeal.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className={`cursor-move group p-2 rounded-xl border border-dashed transition-all ${
                                        draggingElement === 'logo'
                                            ? 'border-blue-500 bg-blue-50/80 scale-105 z-30 shadow-lg'
                                            : 'border-transparent hover:border-slate-400/60 z-20'
                                    }`}
                                >
                                    <div className="text-center pointer-events-none flex flex-col items-center" style={{ width: `${Math.max(logoSeal.size, 110)}px` }}>
                                        {logoSeal.type === 'custom' && logoSeal.customUrl ? (
                                            <img
                                                src={logoSeal.customUrl}
                                                alt="Custom Logo"
                                                style={{
                                                    width: `${logoSeal.size}px`,
                                                    height: `${logoSeal.size}px`,
                                                    mixBlendMode: getEffectiveBlendMode(logoSeal.blendMode),
                                                }}
                                                className="object-contain mx-auto mb-1 filter drop-shadow-sm"
                                            />
                                        ) : logoSeal.type === 'cyber_badge' ? (
                                            <div
                                                style={{ width: `${logoSeal.size}px`, height: `${logoSeal.size}px` }}
                                                className="rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md mb-1"
                                            >
                                                <ShieldCheck className="w-2/3 h-2/3" />
                                            </div>
                                        ) : logoSeal.type === 'iso_crest' ? (
                                            <div
                                                style={{ width: `${logoSeal.size}px`, height: `${logoSeal.size}px` }}
                                                className="rounded-full bg-emerald-50 border-2 border-emerald-600 flex items-center justify-center text-emerald-700 shadow-md mb-1"
                                            >
                                                <Award className="w-2/3 h-2/3" />
                                            </div>
                                        ) : (
                                            <div
                                                style={{ width: `${logoSeal.size}px`, height: `${logoSeal.size}px` }}
                                                className="rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center text-amber-700 shadow-md mb-1"
                                            >
                                                <Award className="w-2/3 h-2/3" />
                                            </div>
                                        )}
                                        <div className={`text-[8px] uppercase tracking-widest font-extrabold ${templateStyle === 'cyber' ? 'text-cyan-400' : 'text-slate-700'}`}>
                                            {logoSeal.label}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Draggable Component 3: Secondary Signature (Right) */}
                            {sig2.show && (
                                <div
                                    onMouseDown={(e) => handleMouseDown('sig2', e)}
                                    onTouchStart={(e) => handleMouseDown('sig2', e)}
                                    style={{
                                        position: 'absolute',
                                        left: `${sig2.x}%`,
                                        top: `${sig2.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                    className={`cursor-move group p-2 rounded-xl border border-dashed transition-all ${
                                        draggingElement === 'sig2'
                                            ? 'border-blue-500 bg-blue-50/80 scale-105 z-30 shadow-lg'
                                            : 'border-transparent hover:border-slate-400/60 z-20'
                                    }`}
                                >
                                    <div className="text-center pointer-events-none flex flex-col items-center" style={{ width: `${sig2.width}px` }}>
                                        {sig2.sigUrl ? (
                                            <img
                                                src={sig2.sigUrl}
                                                alt="Uploaded Signature"
                                                style={{
                                                    mixBlendMode: getEffectiveBlendMode(sig2.blendMode),
                                                    filter: sig2.invert ? 'invert(1)' : 'none',
                                                }}
                                                className="h-14 w-auto max-w-full object-contain mb-1 filter drop-shadow-xs"
                                            />
                                        ) : (
                                            <div className={`font-serif text-lg italic ${templateStyle === 'cyber' ? 'text-cyan-300' : 'text-slate-800'}`}>
                                                {sig2.sigText || 'S. Jenkins'}
                                            </div>
                                        )}
                                        <div className={`w-full border-t my-1 ${templateStyle === 'cyber' ? 'border-cyan-500/60' : 'border-slate-800'}`} />
                                        <div className={`text-xs font-bold ${templateStyle === 'cyber' ? 'text-white' : 'text-slate-900'}`}>
                                            {sig2.name}
                                        </div>
                                        <div className={`text-[9px] uppercase font-semibold ${templateStyle === 'cyber' ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {sig2.title}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Certificate Footer Metadata */}
                            <div className="absolute bottom-6 left-10 right-10 flex items-center justify-between text-[9px] font-mono opacity-80">
                                <div>
                                    <span className="block font-bold">Certificate ID: {customCertCode}</span>
                                    <span>Verification Code: {customVerCode}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold">Issued: {customIssueDate}</span>
                                    <span>100% Verified Cryptographic Seal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: REGISTRY / ISSUED CERTIFICATES LIST */}
            {(activeTab === 'registry' || !isAdmin) && (
                <div className="space-y-6">
                    {/* Search & Page Size Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm print:hidden">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by recipient, course, or certificate ID..."
                                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('designer')}
                                    className="px-3.5 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                                >
                                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Issue New Certificate</span>
                                </button>
                            )}

                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <span>Show:</span>
                                <select
                                    value={certsPerPage}
                                    onChange={(e) => {
                                        setCertsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-[#f8fafc] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                                >
                                    <option value={2}>2</option>
                                    <option value={4}>4</option>
                                    <option value={8}>8</option>
                                    <option value={16}>16</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-400 text-xs">
                            Loading verified credentials registry...
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3 shadow-sm">
                            <Award className="w-12 h-12 text-slate-300 mx-auto" />
                            <h3 className="text-lg font-bold text-[#0f172a]">No Certificates Issued Yet</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Complete 100% of the video lessons and coursework in your enrolled courses, or use the Certificate Designer studio to generate custom credentials.
                            </p>
                        </div>
                    ) : filteredCertificates.length === 0 ? (
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-sm">
                            No certificates match "{searchTerm}".
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {paginatedCertificates.map((cert) => (
                                    <div
                                        key={cert.id}
                                        className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-400 transition shadow-sm group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                                                    {cert.certificate_code}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(cert.issued_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-[#0f172a] group-hover:text-blue-600 transition">
                                                {cert.course?.title}
                                            </h3>

                                            <div className="mt-2 text-xs text-slate-600">
                                                Recipient: <strong className="text-[#0f172a]">{cert.user?.name || user?.name}</strong>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                <span>Issued by: <strong className="text-[#0f172a]">{cert.issuer?.name || 'CyberLoy Academy'}</strong></span>
                                                <button
                                                    onClick={() => setSelectedCert(cert)}
                                                    className="px-3.5 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold transition text-xs flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <Award className="w-3.5 h-3.5 text-amber-400" /> View Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Bar */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 print:hidden">
                                <span>
                                    Showing <span className="text-[#0f172a] font-bold">{(currentPage - 1) * certsPerPage + 1}</span> to{' '}
                                    <span className="text-[#0f172a] font-bold">{Math.min(currentPage * certsPerPage, filteredCertificates.length)}</span> of{' '}
                                    <span className="text-blue-600 font-bold">{filteredCertificates.length}</span> certificates
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
            )}

            {/* Official Certificate View Modal */}
            {selectedCert && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
                    <div className="relative w-full max-w-3xl bg-white border-2 border-amber-300 rounded-3xl p-8 shadow-2xl overflow-hidden print:border print:shadow-none my-8">
                        <button
                            onClick={() => setSelectedCert(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition print:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center py-6 border-b-2 border-amber-200 pb-6 mb-6">
                            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-400 rounded-full text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Award className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-semibold tracking-widest text-amber-700 uppercase">CyberLoy LMS Verified Credential</span>
                            <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1 tracking-tight">CERTIFICATE OF COMPLETION</h2>
                        </div>

                        <div className="text-center space-y-4 my-6">
                            <p className="text-xs text-slate-400 uppercase tracking-widest">This is to certify that</p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] underline decoration-blue-500 underline-offset-8">
                                {selectedCert.user?.name || user?.name}
                            </h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                has successfully completed all required video lessons, assessments, and curriculum coursework for
                            </p>
                            <h4 className="text-xl font-bold text-amber-700">{selectedCert.course?.title}</h4>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                            <div>
                                <div className="text-[#0f172a] font-bold">{selectedCert.certificate_code}</div>
                                <div className="text-[11px] text-slate-400">Certificate ID</div>
                            </div>

                            <div>
                                <div className="text-blue-600 font-bold">{selectedCert.verification_code || 'VER-CYBERLOY'}</div>
                                <div className="text-[11px] text-slate-400">Verification Code</div>
                            </div>

                            <div className="sm:text-right">
                                <div className="text-[#0f172a] font-bold">{new Date(selectedCert.issued_at).toLocaleDateString()}</div>
                                <div className="text-[11px] text-slate-400">Issue Date</div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 print:hidden">
                            <Link
                                to={`/certificate/verify/${selectedCert.certificate_code}`}
                                target="_blank"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1.5 font-semibold"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Verify on Public Portal</span>
                            </Link>

                            <button
                                onClick={handlePrintCanvas}
                                className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print / Save as PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
