import { Route, Routes, BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import PortalSidebar from './components/PortalSidebar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearnCoursePage from './pages/LearnCoursePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StudentDirectoryPage from './pages/StudentDirectoryPage';
import CourseBuilderPage from './pages/CourseBuilderPage';
import CertificatesPage from './pages/CertificatesPage';
import CertificateVerificationPage from './pages/CertificateVerificationPage';
import AdminTaskBuilderPage from './pages/AdminTaskBuilderPage';
import StudentTasksPage from './pages/StudentTasksPage';


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
    const { user } = useAuth();
    const location = useLocation();

    // Show sidebar persistently on all portal pages when user is logged in
    const hideSidebarPaths = ['/login', '/register', '/'];
    const showSidebar = user && !hideSidebarPaths.includes(location.pathname);

    return (
        <div className="min-h-screen bg-[#07172d] text-slate-100 font-sans flex flex-col">
            <Navbar />
            <div className="flex flex-1 relative">
                {showSidebar && <PortalSidebar />}
                <main className="flex-1 overflow-x-hidden min-w-0 bg-[#f4f7fb] text-slate-800">{children}</main>
            </div>
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

                {/* Student Assigned Project Tasks (ISO 27001) */}
                <Route
                    path="/my-tasks"
                    element={
                        <ProtectedRoute>
                            <LMSLayout><StudentTasksPage /></LMSLayout>
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

                {/* Student Directory */}
                <Route
                    path="/admin/students"
                    element={
                        <ProtectedRoute adminOnly>
                            <LMSLayout><StudentDirectoryPage /></LMSLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Course & Curriculum Builder */}
                <Route
                    path="/admin/builder"
                    element={
                        <ProtectedRoute adminOnly>
                            <LMSLayout><CourseBuilderPage /></LMSLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Admin Project Task Builder (ISO 27001) */}
                <Route
                    path="/admin/task-builder"
                    element={
                        <ProtectedRoute adminOnly>
                            <LMSLayout><AdminTaskBuilderPage /></LMSLayout>
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
