export const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('trycloudflare.com')) {
        return 'https://transit-cumulative-patient-particular.trycloudflare.com/api';
    }
    return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

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

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const error = new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        throw err;
    }
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
        if (res.token) setAuthToken(res.token);
        if (res.user) setUserData(res.user);
        return res;
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

    // Classroom & Video Playback Tracking
    getLesson: (courseId, lessonId) => request(`/learn/${courseId}/${lessonId}`),
    recordVideoProgress: (progressData) => request('/video-progress', { method: 'POST', body: JSON.stringify(progressData) }),

    // Certificates
    getMyCertificates: () => request('/certificates/my-certificates'),
    getCertificateDetails: (code) => request(`/certificates/${code}`),
    verifyCertificate: (code) => request(`/certificates/verify/${code}`),

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
};

