import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearnCoursePage from './pages/LearnCoursePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerificationPage from './pages/CertificateVerificationPage';

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading, isAdmin } = useAuth();

    if (loading) {
        return <div className="text-center py-20 text-slate-500 font-mono text-xs">Authenticating...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/courses" replace />;
    }

    return children;
}

function LMSLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
            <Navbar />
            <main>{children}</main>
        </div>
    );
}

function AppContent() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<HomePage />} />

                {/* Public Verification Portals */}
                <Route path="/certificate/verify" element={<LMSLayout><CertificateVerificationPage /></LMSLayout>} />
                <Route path="/certificate/verify/:code" element={<LMSLayout><CertificateVerificationPage /></LMSLayout>} />

                {/* Auth and LMS Application Routes */}
                <Route path="/login" element={<LMSLayout><LoginPage /></LMSLayout>} />
                <Route path="/register" element={<LMSLayout><RegisterPage /></LMSLayout>} />
                <Route path="/courses" element={<LMSLayout><CourseListPage /></LMSLayout>} />
                <Route path="/courses/:id" element={<LMSLayout><CourseDetailPage /></LMSLayout>} />

                {/* Interactive Learning Classroom Theatre */}
                <Route
                    path="/learn/:courseId/:lessonId"
                    element={
                        <ProtectedRoute>
                            <LMSLayout><LearnCoursePage /></LMSLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Verified Certificates Management */}
                <Route
                    path="/certificates"
                    element={
                        <ProtectedRoute>
                            <LMSLayout><CertificatesPage /></LMSLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Admin Management Command Center */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <LMSLayout><AdminDashboardPage /></LMSLayout>
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}
