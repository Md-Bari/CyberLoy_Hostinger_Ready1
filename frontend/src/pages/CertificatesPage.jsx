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
import { CertificateSheet, ScaledSheet, useCertificatePrint } from '../components/certificates/CertificateSheet';
import { CERTIFICATE_TEMPLATES, DEFAULT_POSITIONS, getTemplate } from '../components/certificates/certificateTemplates';

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
    const [certificateText, setCertificateText] = useState({
        academy: 'CyberLoy Enterprise Academy',
        title: 'Certificate of Completion',
        presentation: 'This is officially presented to acknowledge that',
        achievement: 'has successfully demonstrated academic excellence and practical competence in completing the verified professional curriculum for:',
        verificationSeal: '100% Verified Cryptographic Seal',
    });
    const [certificateColors, setCertificateColors] = useState(() => ({ ...getTemplate('gold').colors }));
    const [certificateAppearance, setCertificateAppearance] = useState(() => ({ ...getTemplate('gold').appearance }));
    const [headerLogo, setHeaderLogo] = useState({
        show: true,
        type: 'shield',
        size: 40,
        x: DEFAULT_POSITIONS.headerLogo.x,
        y: DEFAULT_POSITIONS.headerLogo.y,
    });
    const [watermarkLogo, setWatermarkLogo] = useState({
        show: true,
        type: 'shield',
        customUrl: '',
        size: 380,
        x: DEFAULT_POSITIONS.watermarkLogo.x,
        y: DEFAULT_POSITIONS.watermarkLogo.y,
    });

    // Template Style: 'gold' | 'cyber' | 'iso' | 'minimal' | 'custom_bg'
    const [templateStyle, setTemplateStyle] = useState('gold');
    const [customBgImage, setCustomBgImage] = useState('');

    // A4 Paper Orientation: 'landscape' (297x210mm) | 'portrait' (210x297mm)
    const [orientation, setOrientation] = useState('landscape');
    const [modalOrientation, setModalOrientation] = useState('landscape');
    const [modalTemplateStyle, setModalTemplateStyle] = useState('gold');

    // Draggable Signatures with Background Removal & Blend Modes
    const [sig1, setSig1] = useState({
        name: 'Dr. Marcus Vance',
        title: 'Chief Information Security Officer (CISO)',
        sigText: 'M. Vance',
        sigUrl: '', // Base64 or URL of uploaded signature image
        rawSigUrl: '', // Backup of original uploaded image
        width: 170, // px width
        blendMode: 'multiply', // 'multiply' | 'normal' | 'screen' | 'darken'
        invert: false,
        x: DEFAULT_POSITIONS.sig1.x, // percentage of canvas width
        y: DEFAULT_POSITIONS.sig1.y, // percentage of canvas height
        show: true,
    });

    const [sig2, setSig2] = useState({
        name: 'Sarah Jenkins, CISSP',
        title: 'Lead Academy & Compliance Director',
        sigText: 'S. Jenkins',
        sigUrl: '', // Base64 or URL of uploaded signature image
        rawSigUrl: '',
        width: 170,
        blendMode: 'multiply',
        invert: false,
        x: DEFAULT_POSITIONS.sig2.x,
        y: DEFAULT_POSITIONS.sig2.y,
        show: true,
    });

    // Default Accreditation Seal
    const [logoSeal, setLogoSeal] = useState({
        type: 'template', // 'template' | 'gold_seal' | 'cyber_badge' | 'iso_crest' | 'custom'
        customUrl: '',
        label: 'OFFICIAL VERIFIED ACCREDITATION',
        size: 84, // px
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
    const watermarkFileRef = useRef(null);

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

    // Add a draggable text element. It uses the same move, visibility,
    // duplicate and delete controls as uploaded graphics and badges.
    const handleAddTextItem = () => {
        const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'text',
            title: 'Text element',
            text: 'New certificate text',
            color: '#0f172a',
            fontSize: 18,
            fontWeight: '700',
            width: 260,
            opacity: 100,
            rotation: 0,
            x: 50,
            y: 50,
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
        } else if (draggingElement === 'header-logo') {
            setHeaderLogo((prev) => ({ ...prev, x: posX, y: posY }));
        } else if (draggingElement === 'watermark-logo') {
            setWatermarkLogo((prev) => ({ ...prev, x: posX, y: posY }));
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

    const { print: printCertificate, portal: printPortal } = useCertificatePrint();

    // Choosing a template also loads its colour palette and element layout;
    // the admin can still fine-tune both afterwards.
    const applyTemplate = (id) => {
        const t = getTemplate(id);
        const pos = { ...DEFAULT_POSITIONS, ...(t.positions || {}) };
        setTemplateStyle(t.id);
        setCertificateColors({ ...t.colors });
        setCertificateAppearance({ ...t.appearance });
        setHeaderLogo((p) => ({ ...p, ...pos.headerLogo }));
        setWatermarkLogo((p) => ({ ...p, ...pos.watermarkLogo }));
        setLogoSeal((p) => ({ ...p, ...pos.logoSeal, type: p.type === 'custom' ? 'custom' : 'template' }));
        setSig1((p) => ({ ...p, ...pos.sig1 }));
        setSig2((p) => ({ ...p, ...pos.sig2 }));
    };

    // Keep the pinned preview (toolbar + sheet + hint) inside the viewport.
    const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 900));
    useEffect(() => {
        const onResize = () => setViewportHeight(window.innerHeight);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const previewMaxHeight = Math.max(280, viewportHeight - 290);

    const templatePosition = (key) => ({ ...DEFAULT_POSITIONS, ...(getTemplate(templateStyle).positions || {}) })[key];

    const designerSheetProps = {
        templateId: templateStyle,
        orientation,
        content: {
            academy: certificateText.academy,
            title: certificateText.title,
            presentation: certificateText.presentation,
            recipient: customStudentName,
            achievement: certificateText.achievement,
            course: customCourseTitle,
            honors: customHonors,
            certCode: customCertCode,
            verCode: customVerCode,
            issueDate: customIssueDate,
            verificationSeal: certificateText.verificationSeal,
        },
        colors: certificateColors,
        appearance: certificateAppearance,
        headerLogo,
        watermarkLogo,
        sig1,
        sig2,
        logoSeal,
        customItems,
        customBgImage,
    };

    const handleSheetTextChange = (field, value) => {
        if (field === 'recipient') setCustomStudentName(value);
        else if (field === 'course') setCustomCourseTitle(value);
        else if (field === 'honors') setCustomHonors(value);
        else setCertificateText((current) => ({ ...current, [field]: value }));
    };

    // An issued certificate uses the chosen template's own palette and the
    // academy's default signatories, independent of unsaved designer edits.
    const buildIssuedSheetProps = (cert) => {
        const t = getTemplate(modalTemplateStyle);
        const pos = { ...DEFAULT_POSITIONS, ...(t.positions || {}) };
        return {
            templateId: t.id,
            orientation: modalOrientation,
            content: {
                academy: 'CyberLoy Enterprise Academy',
                title: 'Certificate of Completion',
                presentation: 'This is proudly presented to',
                recipient: cert.user?.name || user?.name || 'Recipient',
                achievement: 'for successfully completing all lessons and assessments of the verified professional programme',
                course: cert.course?.title || 'CyberLoy Course',
                honors: '',
                certCode: cert.certificate_code,
                verCode: cert.verification_code || '—',
                issueDate: cert.issued_at ? new Date(cert.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '',
                verificationSeal: 'Verify at /certificate/verify',
            },
            headerLogo: { show: true, type: 'shield', size: 40, ...pos.headerLogo },
            watermarkLogo: { show: true, type: 'shield', size: 380, ...pos.watermarkLogo },
            sig1: { name: 'Dr. Marcus Vance', title: 'Chief Information Security Officer', sigText: 'M. Vance', width: 170, show: true, ...pos.sig1 },
            sig2: { name: 'Sarah Jenkins, CISSP', title: 'Academy & Compliance Director', sigText: 'S. Jenkins', width: 170, show: true, ...pos.sig2 },
            logoSeal: { type: 'template', label: 'Official Verified Accreditation', size: 84, show: true, ...pos.logoSeal },
        };
    };

    const handlePrintCanvas = () => printCertificate(designerSheetProps);

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

    const activePrintOrientation = selectedCert ? modalOrientation : orientation;

    return (
        <div
            className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-[#f4f7fb] text-slate-800 min-h-screen"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
        >
            {printPortal}
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
                    <div className="lg:col-span-4 space-y-6 pb-6">
                        {/* 1. Template Chooser & Background Upload */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-600" /> 1. Select Template & Background
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {CERTIFICATE_TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => applyTemplate(t.id)}
                                        aria-pressed={templateStyle === t.id}
                                        className={`group rounded-xl border p-1.5 text-left transition ${
                                            templateStyle === t.id
                                                ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/50'
                                                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="overflow-hidden rounded-lg border border-slate-100 pointer-events-none">
                                            <ScaledSheet orientation="landscape">
                                                <CertificateSheet
                                                    templateId={t.id}
                                                    content={{
                                                        academy: 'CyberLoy Academy',
                                                        title: 'Certificate of Completion',
                                                        presentation: 'Presented to',
                                                        recipient: 'Alex Johnson',
                                                        achievement: '',
                                                        course: 'Cybersecurity Fundamentals',
                                                        certCode: 'CERT-0000',
                                                        verCode: 'VER-0000',
                                                        issueDate: '2026',
                                                    }}
                                                    headerLogo={{ show: true, type: 'shield', size: 40, ...DEFAULT_POSITIONS.headerLogo, ...(t.positions?.headerLogo || {}) }}
                                                    sig1={{ show: true, name: 'M. Vance', title: 'CISO', sigText: 'M. Vance', width: 170, ...DEFAULT_POSITIONS.sig1, ...(t.positions?.sig1 || {}) }}
                                                    sig2={{ show: true, name: 'S. Jenkins', title: 'Director', sigText: 'S. Jenkins', width: 170, ...DEFAULT_POSITIONS.sig2, ...(t.positions?.sig2 || {}) }}
                                                    logoSeal={{ show: true, type: 'template', size: 84, ...DEFAULT_POSITIONS.logoSeal, ...(t.positions?.logoSeal || {}) }}
                                                />
                                            </ScaledSheet>
                                        </div>
                                        <div className="px-1 pb-0.5 pt-1.5">
                                            <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-800">
                                                <span className="truncate">{t.label}</span>
                                                {t.isNew && <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-700">New</span>}
                                                {t.id === 'custom_bg' && <Upload className="w-3.5 h-3.5 shrink-0 text-blue-600" />}
                                            </div>
                                            <div className="text-[10px] leading-tight text-slate-500">{t.desc}</div>
                                        </div>
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

                        {/* 2. Core text and colour controls */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                                    <Edit3 className="w-4 h-4 text-violet-600" /> 2. Edit Certificate Text & Colours
                                </h3>
                                <span className="text-[10px] text-slate-400">Changes update live</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Edit every main certificate label here. Use the colour pickers to match your brand.</p>
                            {[
                                ['academy', 'Academy / organisation'],
                                ['title', 'Certificate title'],
                                ['presentation', 'Presentation line'],
                                ['achievement', 'Achievement statement'],
                                ['verificationSeal', 'Footer verification line'],
                            ].map(([key, label]) => (
                                <div key={key} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                    <label className="block min-w-0">
                                        <span className="block text-[10px] font-semibold text-slate-600 mb-1">{label}</span>
                                        <input
                                            type="text"
                                            value={certificateText[key]}
                                            onChange={(e) => setCertificateText((current) => ({ ...current, [key]: e.target.value }))}
                                            className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-600">
                                        Colour
                                        <input
                                            type="color"
                                            value={certificateColors[key === 'verificationSeal' ? 'footer' : key]}
                                            onChange={(e) => setCertificateColors((current) => ({ ...current, [key === 'verificationSeal' ? 'footer' : key]: e.target.value }))}
                                            className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                                        />
                                    </label>
                                </div>
                            ))}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ['recipient', 'Recipient name'],
                                    ['course', 'Course name'],
                                    ['honors', 'Honours line'],
                                ].map(([key, label]) => (
                                    <label key={key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-2.5 py-2 text-[10px] font-semibold text-slate-600">
                                        <span>{label}</span>
                                        <input
                                            type="color"
                                            value={certificateColors[key]}
                                            onChange={(e) => setCertificateColors((current) => ({ ...current, [key]: e.target.value }))}
                                            className="h-6 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                                        />
                                    </label>
                                ))}
                            </div>
                            <div className="border-t border-slate-100 pt-3 space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Canvas, icon, seal & signature colours</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        ['outerBorder', 'Certificate border'],
                                        ['watermark', 'Watermark'],
                                        ['headerIcon', 'Header shield'],
                                        ['signature', 'Signature text'],
                                        ['signatureLine', 'Signature line'],
                                        ['sealLabel', 'Seal label'],
                                    ].map(([key, label]) => (
                                        <label key={key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-[#f8fafc] px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                                            <span>{label}</span>
                                            <input
                                                type="color"
                                                value={certificateAppearance[key]}
                                                onChange={(e) => setCertificateAppearance((current) => ({ ...current, [key]: e.target.value }))}
                                                className="h-6 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                                            />
                                        </label>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                                    Watermark opacity
                                    <input
                                        type="range"
                                        min="0"
                                        max="30"
                                        value={certificateAppearance.watermarkOpacity}
                                        onChange={(e) => setCertificateAppearance((current) => ({ ...current, watermarkOpacity: Number(e.target.value) }))}
                                        className="flex-1 h-1 cursor-pointer appearance-none rounded bg-slate-200"
                                    />
                                    <span className="w-7 font-mono">{certificateAppearance.watermarkOpacity}%</span>
                                </label>
                                <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-700">Header logo / shield</span>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                                            <input type="checkbox" checked={headerLogo.show} onChange={(e) => setHeaderLogo((current) => ({ ...current, show: e.target.checked }))} className="rounded border-slate-300 text-violet-600" />
                                            Show
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={headerLogo.type} onChange={(e) => setHeaderLogo((current) => ({ ...current, type: e.target.value }))} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">
                                            <option value="shield">Shield check</option>
                                            <option value="award">Award badge</option>
                                        </select>
                                        <button type="button" onClick={() => setHeaderLogo((current) => ({ ...current, ...templatePosition('headerLogo'), size: 40 }))} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50">Reset position</button>
                                    </div>
                                    <label className="flex items-center gap-2 text-[10px] text-slate-600">
                                        Logo size
                                        <input type="range" min="16" max="100" value={headerLogo.size} onChange={(e) => setHeaderLogo((current) => ({ ...current, size: Number(e.target.value) }))} className="flex-1 h-1 cursor-pointer appearance-none rounded bg-slate-200" />
                                        <span className="w-8 font-mono">{headerLogo.size}px</span>
                                    </label>
                                    <p className="text-[10px] text-slate-400">Drag the logo directly on the certificate to move it.</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-2.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-700">Background watermark logo</span>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer">
                                            <input type="checkbox" checked={watermarkLogo.show} onChange={(e) => setWatermarkLogo((current) => ({ ...current, show: e.target.checked }))} className="rounded border-slate-300 text-violet-600" />
                                            Show
                                        </label>
                                    </div>
                                    <input type="file" ref={watermarkFileRef} accept="image/*" onChange={(e) => handleFileUpload(e, (dataUrl) => setWatermarkLogo((current) => ({ ...current, type: 'custom', customUrl: dataUrl })))} className="hidden" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={watermarkLogo.type} onChange={(e) => setWatermarkLogo((current) => ({ ...current, type: e.target.value }))} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">
                                            <option value="shield">Shield check</option>
                                            <option value="award">Award badge</option>
                                            <option value="custom">Custom image</option>
                                        </select>
                                        <button type="button" onClick={() => watermarkFileRef.current?.click()} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50">Upload / replace</button>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setWatermarkLogo((current) => ({ ...current, ...templatePosition('watermarkLogo'), size: 380 }))} className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-50">Reset position</button>
                                        {watermarkLogo.customUrl && <button type="button" onClick={() => setWatermarkLogo((current) => ({ ...current, customUrl: '', type: 'shield' }))} className="rounded border border-red-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50">Remove image</button>}
                                    </div>
                                    <label className="flex items-center gap-2 text-[10px] text-slate-600">
                                        Watermark size
                                        <input type="range" min="80" max="700" value={watermarkLogo.size} onChange={(e) => setWatermarkLogo((current) => ({ ...current, size: Number(e.target.value) }))} className="flex-1 h-1 cursor-pointer appearance-none rounded bg-slate-200" />
                                        <span className="w-9 font-mono">{watermarkLogo.size}px</span>
                                    </label>
                                    <p className="text-[10px] text-slate-400">Drag it on the certificate; use the Watermark colour and opacity controls above.</p>
                                </div>
                            </div>
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
                                <button
                                    type="button"
                                    onClick={handleAddTextItem}
                                    className="px-2 py-0.5 rounded-md bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 text-[10px] font-semibold flex items-center gap-1 transition"
                                >
                                    <Edit3 className="w-3 h-3" /> + Text Element
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

                                                {item.type === 'text' && (
                                                    <div className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-violet-200 bg-violet-50/50 p-2" onClick={(e) => e.stopPropagation()}>
                                                        <label className="min-w-0">
                                                            <span className="mb-1 block text-[10px] font-semibold text-violet-800">Text content</span>
                                                            <input
                                                                type="text"
                                                                value={item.text || ''}
                                                                onChange={(e) => updateCustomItem(item.id, { text: e.target.value })}
                                                                className="w-full rounded border border-violet-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-violet-500"
                                                            />
                                                        </label>
                                                        <label className="flex flex-col gap-1 text-[10px] font-semibold text-violet-800">
                                                            Colour
                                                            <input
                                                                type="color"
                                                                value={item.color || '#0f172a'}
                                                                onChange={(e) => updateCustomItem(item.id, { color: e.target.value })}
                                                                className="h-7 w-9 cursor-pointer rounded border border-violet-200 bg-white p-0.5"
                                                            />
                                                        </label>
                                                        <label className="col-span-2 flex items-center gap-2 text-[10px] text-slate-600">
                                                            <span>Text size</span>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="48"
                                                                value={item.fontSize || 18}
                                                                onChange={(e) => updateCustomItem(item.id, { fontSize: Number(e.target.value) })}
                                                                className="flex-1 h-1 cursor-pointer appearance-none rounded-lg bg-violet-200"
                                                            />
                                                            <span className="w-8 font-mono">{item.fontSize || 18}px</span>
                                                        </label>
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
                                        setSig1((p) => ({ ...p, ...templatePosition('sig1'), width: 170, blendMode: 'multiply', invert: false }));
                                        setSig2((p) => ({ ...p, ...templatePosition('sig2'), width: 170, blendMode: 'multiply', invert: false }));
                                        setLogoSeal((p) => ({ ...p, ...templatePosition('logoSeal'), size: 84 }));
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
                                        onClick={() => setSig1((p) => ({ ...p, ...templatePosition('sig1') }))}
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
                                        onClick={() => setSig2((p) => ({ ...p, ...templatePosition('sig2') }))}
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
                                        <option value="template">Match template</option>
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
                                        onClick={() => setLogoSeal((p) => ({ ...p, ...templatePosition('logoSeal') }))}
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
                    <div className="lg:col-span-8 space-y-4 lg:sticky lg:top-20 lg:self-start">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold tracking-tight shadow-xs">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                    <span>A4 Paper: 210 × 297 mm (8.27 × 11.69 in)</span>
                                </span>

                                {/* Orientation Switcher */}
                                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setOrientation('landscape')}
                                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                                            orientation === 'landscape'
                                                ? 'bg-white text-blue-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>Landscape (297×210 mm)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrientation('portrait')}
                                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition flex items-center gap-1.5 ${
                                            orientation === 'portrait'
                                                ? 'bg-white text-blue-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <span>Portrait (210×297 mm)</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handlePrintCanvas}
                                className="px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                                <Printer className="w-4 h-4 text-cyan-400" />
                                <span>Print Certificate / PDF</span>
                            </button>
                        </div>

                        {/* Visual Certificate Canvas: fixed A4 sheet scaled to fit */}
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-100/80 p-3 sm:p-5 shadow-inner">
                            <ScaledSheet orientation={orientation} maxHeight={previewMaxHeight}>
                                <div className="shadow-2xl shadow-slate-900/20">
                                    <CertificateSheet
                                        ref={canvasRef}
                                        {...designerSheetProps}
                                        interactive
                                        draggingElement={draggingElement}
                                        selectedItemId={selectedItemId}
                                        onDragStart={handleMouseDown}
                                        onTextChange={handleSheetTextChange}
                                    />
                                </div>
                            </ScaledSheet>
                            <p className="mt-3 text-center text-[11px] text-slate-500">
                                Click any text to edit it · drag logos, seals and signatures to reposition · prints at exactly A4 {orientation === 'portrait' ? '210 × 297' : '297 × 210'} mm
                            </p>
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
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
                    <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-2xl my-4 sm:my-8">
                        {/* Modal Header & Actions (hidden in print) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 print:hidden">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                                    <Award className="w-4 h-4 text-amber-600" />
                                    <span>Official Verified Certificate</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
                                    A4: 210 × 297 mm (8.27 × 11.69 in)
                                </span>

                                {/* Orientation Switcher */}
                                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setModalOrientation('landscape')}
                                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                            modalOrientation === 'landscape'
                                                ? 'bg-white text-blue-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Landscape (297×210 mm)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalOrientation('portrait')}
                                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                                            modalOrientation === 'portrait'
                                                ? 'bg-white text-blue-900 shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        Portrait (210×297 mm)
                                    </button>
                                </div>

                                {/* Design selector */}
                                <label className="inline-flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    Design
                                    <select
                                        value={modalTemplateStyle}
                                        onChange={(e) => setModalTemplateStyle(e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                                    >
                                        {CERTIFICATE_TEMPLATES.filter((t) => t.id !== 'custom_bg').map((t) => (
                                            <option key={t.id} value={t.id}>{t.label}{t.isNew ? ' (new)' : ''}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    to={`/certificate/verify/${selectedCert.certificate_code}`}
                                    target="_blank"
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Verify Online</span>
                                </Link>

                                <button
                                    onClick={() => printCertificate(buildIssuedSheetProps(selectedCert))}
                                    className="px-4 py-1.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                                >
                                    <Printer className="w-4 h-4 text-cyan-400" />
                                    <span>Print Certificate / PDF</span>
                                </button>

                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Certificate Preview: same fixed A4 sheet that gets printed */}
                        <div className="rounded-2xl bg-slate-100/80 p-3 sm:p-5">
                            <ScaledSheet orientation={modalOrientation} maxHeight={typeof window !== 'undefined' ? Math.max(320, window.innerHeight - 240) : undefined}>
                                <div className="shadow-2xl shadow-slate-900/20">
                                    <CertificateSheet {...buildIssuedSheetProps(selectedCert)} />
                                </div>
                            </ScaledSheet>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
