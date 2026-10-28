export const getApiBaseUrl = () => {
    if (import.meta.env?.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined') {
        const origin = window.location.origin.replace(/\/+$/, '');
        // In dev, Vite proxies /api, so same-origin also works from LAN devices.
        if (import.meta.env?.DEV || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return `${origin}/api`;
        }
    }

    return 'http://127.0.0.1:8010/api';
};

export const getFullApiUrl = (endpoint) => {
    const base = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${cleanEndpoint}`;
};

// Uploaded media is stored as an API-relative path (/api/media/...) so it keeps
// working whether the API is same-origin (dev proxy) or on VITE_API_URL.
export const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    if (url.startsWith('/api/')) return `${getApiBaseUrl()}${url.slice(4)}`;
    return url;
};

export const getAuthToken = () => localStorage.getItem('lms_token');
export const setAuthToken = (token) => localStorage.setItem('lms_token', token);
export const removeAuthToken = () => localStorage.removeItem('lms_token');
export const getUserData = () => {
    const userStr = localStorage.getItem('lms_user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};
export const setUserData = (user) => localStorage.setItem('lms_user', JSON.stringify(user));
export const removeUserData = () => localStorage.removeItem('lms_user');

async function request(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Keep API calls same-origin by default. In development Vite proxies /api
    // to Laravel, so this also works from another device on the same network.
    // Do not fall back to fixed localhost ports: from another PC, localhost
    // means that PC, not the computer hosting the LMS.
    const candidateBases = [getApiBaseUrl()];
    const uniqueBases = Array.from(new Set(candidateBases.filter(Boolean)));

    let lastError = null;

    for (const base of uniqueBases) {
        try {
            const url = `${base.replace(/\/+$/, '')}${cleanEndpoint}`;
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            lastError = err;
            // If server returned an HTTP status (like 401 or 422), do not retry network addresses
            if (err.status) {
                throw err;
            }
            // If network/port failed (TypeError: Failed to fetch), try next candidate URL
            console.warn(`[LMS API] Attempt on ${base}${cleanEndpoint} failed:`, err.message);
        }
    }

    console.error(`[LMS API] All endpoints failed for (${endpoint}):`, lastError);
    throw lastError || new Error('Failed to connect to LMS backend server.');
}

export const api = {
    // Auth
    login: async (credentials) => {
        const res = await request('/login', { method: 'POST', body: JSON.stringify(credentials) });
        if (res.token) setAuthToken(res.token);
        if (res.user) setUserData(res.user);
        return res;
    },
    register: async (userData) => {
        const res = await request('/register', { method: 'POST', body: JSON.stringify(userData) });
        if (res.token) {
            setAuthToken(res.token);
        }
        if (res.token && res.user) {
            setUserData(res.user);
        }
        return res;
    },
    requestPasswordReset: (email) => request('/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    resetPassword: (payload) => request('/password/reset', {
        method: 'POST',
        body: JSON.stringify(payload),
    }),
    resendVerification: (email) => request('/email/verification-notification', {
        method: 'POST',
        body: JSON.stringify({ email }),
    }),
    createUser: async (userData) => {
        return request('/admin/users', { method: 'POST', body: JSON.stringify(userData) });
    },
    logout: async () => {
        try {
            await request('/logout', { method: 'POST' });
        } catch (e) {
            // silent ignore on logout failure
        }
        removeAuthToken();
        removeUserData();
    },
    getCurrentUser: async () => {
        const user = await request('/user');
        if (user) setUserData(user);
        return user;
    },
    refreshToken: async () => {
        const res = await request('/refresh', { method: 'POST' });
        if (res.token) setAuthToken(res.token);
        if (res.user) setUserData(res.user);
        return res;
    },

    // Courses & Payment
    getCourses: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/courses${query ? '?' + query : ''}`);
    },
    getCourseDetails: (id) => request(`/courses/${id}`),
    enrollCourse: (courseId) => request(`/courses/${courseId}/enroll`, { method: 'POST' }),
    payCourse: (courseId, paymentData = {}) => request(`/courses/${courseId}/pay`, { method: 'POST', body: JSON.stringify(paymentData) }),
    confirmCheckout: (sessionId) => request(`/payments/checkout/${encodeURIComponent(sessionId)}`),
    getCourseDiscussions: (courseId) => request(`/courses/${courseId}/discussions`),
    getCourseLiveSessions: (courseId) => request(`/courses/${courseId}/live-sessions`),
    createCourseLiveSession: (courseId, data) => request(`/courses/${courseId}/live-sessions`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateCourseLiveSession: (sessionId, data) => request(`/live-sessions/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteCourseLiveSession: (sessionId) => request(`/live-sessions/${sessionId}`, { method: 'DELETE' }),
    joinCourseLiveSession: (sessionId) => request(`/live-sessions/${sessionId}/join`, { method: 'POST' }),
    postCourseDiscussion: (courseId, body, parentId = null) => request(`/courses/${courseId}/discussions`, {
        method: 'POST',
        body: JSON.stringify({ body, parent_id: parentId }),
    }),
    getAssessmentSubmissions: () => request('/instructor/assessment-submissions'),
    gradeAssessment: (submissionId, grade) => request(`/instructor/assessment-submissions/${submissionId}`, {
        method: 'PUT',
        body: JSON.stringify(grade),
    }),

    // Classroom & Video Playback Tracking
    getLesson: (courseId, lessonId) => request(`/learn/${courseId}/${lessonId}`),
    submitAssessment: (courseId, lessonId, answers) => request(`/learn/${courseId}/${lessonId}/assessment-submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
    recordVideoProgress: (progressData) => request('/video-progress', { method: 'POST', body: JSON.stringify(progressData) }),

    // Certificates
    getMyCertificates: () => request('/certificates/my-certificates'),
    getCertificateDetails: (code) => request(`/certificates/${code}`),
    verifyCertificate: (code) => request(`/certificates/verify/${code}`),
    issueCertificate: (certData) => request('/admin/issue-certificate', { method: 'POST', body: JSON.stringify(certData) }),

    // Notifications
    getNotifications: () => request('/notifications'),
    markNotificationAsRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

    // Admin Dashboard & Course Builder
    getAdminStats: () => request('/admin/dashboard'),
    getAdminPayments: () => request('/admin/payments'),
    getUserActivities: () => request('/admin/user-activities'),
    getStudentProgressDetail: (userId) => request(`/admin/students/${userId}/progress`),
    createCourse: (courseData) => request('/admin/courses', { method: 'POST', body: JSON.stringify(courseData) }),
    updateCourse: (courseId, courseData) => request(`/admin/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(courseData) }),
    deleteCourse: (courseId) => request(`/admin/courses/${courseId}`, { method: 'DELETE' }),
    addSection: (courseId, sectionData) => request(`/admin/courses/${courseId}/sections`, { method: 'POST', body: JSON.stringify(sectionData) }),
    updateSection: (sectionId, sectionData) => request(`/admin/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(sectionData) }),
    deleteSection: (sectionId) => request(`/admin/sections/${sectionId}`, { method: 'DELETE' }),
    addLesson: (sectionId, lessonData) => request(`/admin/sections/${sectionId}/lessons`, { method: 'POST', body: JSON.stringify(lessonData) }),
    updateLesson: (lessonId, lessonData) => request(`/admin/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(lessonData) }),
    deleteLesson: (lessonId) => request(`/admin/lessons/${lessonId}`, { method: 'DELETE' }),
    // Names used by the Course Builder.
    createSection: (courseId, sectionData) => api.addSection(courseId, sectionData),
    createLesson: (sectionId, lessonData) => api.addLesson(sectionId, lessonData),
    // Project Plans & Tasks (ISO 27001 / Task Builder)
    getStudentProjectPlans: () => request('/project-plans'),
    getStudentProjectPlanDetails: (id) => request(`/project-plans/${id}`),
    updateTaskProgress: (planId, taskId, data) => request(`/project-plans/${planId}/tasks/${taskId}/progress`, { method: 'POST', body: JSON.stringify(data) }),

    // Admin Project Plans & Task Builder
    getAdminUsersList: () => request('/admin/users'),
    getAdminProjectPlans: () => request('/admin/project-plans'),

    getAdminProjectPlanDetails: (id) => request(`/admin/project-plans/${id}`),
    createProjectPlan: (data) => request('/admin/project-plans', { method: 'POST', body: JSON.stringify(data) }),
    updateProjectPlan: (id, data) => request(`/admin/project-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProjectPlan: (id) => request(`/admin/project-plans/${id}`, { method: 'DELETE' }),
    addProjectTask: (planId, data) => request(`/admin/project-plans/${planId}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateProjectTask: (taskId, data) => request(`/admin/project-tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProjectTask: (taskId) => request(`/admin/project-tasks/${taskId}`, { method: 'DELETE' }),
    assignUsersToProjectPlan: (planId, userIds) => request(`/admin/project-plans/${planId}/assign`, { method: 'POST', body: JSON.stringify({ user_ids: userIds }) }),
    adminUpdateUserTaskProgress: (planId, userId, data) => request(`/admin/project-plans/${planId}/users/${userId}/progress`, { method: 'POST', body: JSON.stringify(data) }),

    // New Features
    studentDashboard: () => request('/dashboard/student'),
    getAnnouncements: (courseId = null) => request(courseId ? `/announcements?course_id=${courseId}` : '/announcements'),
    createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    getLessonNotes: (lessonId) => request(`/lessons/${lessonId}/notes`),
    createLessonNote: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
    deleteLessonNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
    getCourseReviews: (courseId) => request(`/courses/${courseId}/reviews`),
    submitCourseReview: (courseId, data) => request(`/courses/${courseId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    uploadCourseImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = getAuthToken();
        return fetch(getFullApiUrl('/upload/course-image'), {
            method: 'POST',
            headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: formData,
        }).then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const firstError = data.errors && Object.values(data.errors)[0]?.[0];
                throw new Error(firstError || data.message || 'Image upload failed');
            }
            return data;
        });
    },
    uploadAssignment: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = getAuthToken();
        return fetch(getFullApiUrl('/upload/assignment'), {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        }).then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            return data;
        });
    },
    getGradebook: () => request('/instructor/gradebook'),
    getAdminGradebook: () => request('/admin/gradebook'),
    // Emergency Support Incident Response
    submitEmergencySupport: (data) => request('/emergency-support', { method: 'POST', body: JSON.stringify(data) }),
    getEmergencySupportTickets: () => request('/admin/emergency-support'),
    updateEmergencySupportStatus: (id, status) => request(`/admin/emergency-support/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

