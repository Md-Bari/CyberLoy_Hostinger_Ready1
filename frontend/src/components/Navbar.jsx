import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Bell, Award, BookOpen, LogOut, CheckSquare } from 'lucide-react';

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;


    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data || []);
        } catch (e) {
            // silent fail
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-wider text-cyan-400 hover:text-cyan-300 transition">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                    <span>CyberLoy <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono">LMS</span></span>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-6">
                    <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-cyan-400 transition font-medium">
                        <BookOpen className="w-4 h-4" />
                        <span>Courses</span>
                    </Link>

                    {user && (
                        <>
                            <Link to="/my-tasks" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-cyan-400 transition font-medium">
                                <CheckSquare className="w-4 h-4 text-cyan-400" />
                                <span>My Tasks</span>
                            </Link>

                            <Link to="/certificates" className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-cyan-400 transition font-medium">
                                <Award className="w-4 h-4" />
                                <span>My Certificates</span>
                            </Link>
                        </>
                    )}

                    {user ? (
                        <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                                        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                                            <div className="flex items-center gap-2">
                                                <Bell className="w-4 h-4 text-cyan-400" />
                                                <span className="font-semibold text-sm">Notifications</span>
                                            </div>
                                            {unreadCount > 0 && (
                                                <span className="text-xs text-cyan-400 font-mono">{unreadCount} unread</span>
                                            )}
                                        </div>

                                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-xs text-slate-500">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                        className={`p-3 transition cursor-pointer hover:bg-slate-800/60 ${!n.is_read ? 'bg-cyan-950/20 border-l-2 border-cyan-400' : 'opacity-75'}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 font-medium text-xs text-cyan-300">
                                                                <Award className="w-3.5 h-3.5 text-amber-400" />
                                                                {n.title}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500">
                                                                {new Date(n.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300 mt-1">{n.message}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile / Badge */}
                            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-full py-1 px-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden sm:flex flex-col text-left justify-center">
                                    <span className="text-xs font-bold text-slate-100 leading-tight truncate max-w-[140px]">{user.name}</span>
                                    <span className="text-[10px] text-cyan-400 capitalize font-medium leading-none mt-0.5">{user.role}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Logout"
                                    className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition ml-0.5"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
                            <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-cyan-400 transition">
                                Login
                            </Link>
                            <Link to="/register" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition font-medium">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>

        </header>
    );
}
