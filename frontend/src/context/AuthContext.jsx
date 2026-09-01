import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, getAuthToken, getUserData, removeAuthToken, removeUserData, setAuthToken } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUserData());
    const [token, setToken] = useState(getAuthToken());
    const [loading, setLoading] = useState(true);

    // Proactive JWT refresh timer — refresh 5 minutes before the 60 min TTL
    const refreshTimerRef = useRef(null);

    const scheduleRefresh = (expiresInSeconds = 3600) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        const refreshInMs = Math.max((expiresInSeconds - 300) * 1000, 30000); // 5 min before expiry, min 30s
        refreshTimerRef.current = setTimeout(async () => {
            try {
                const res = await api.refreshToken();
                setToken(res.token);
                setUser(res.user);
                scheduleRefresh(res.expires_in);
            } catch {
                // Refresh failed — session expired, force logout
                handleLogout();
            }
        }, refreshInMs);
    };

    const handleLogout = () => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        removeAuthToken();
        removeUserData();
        setUser(null);
        setToken(null);
    };

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getAuthToken();
            if (storedToken) {
                try {
                    const currentUser = await api.getCurrentUser();
                    setUser(currentUser);
                    // Schedule proactive refresh (default TTL 60 min)
                    scheduleRefresh(3600);
                } catch (err) {
                    // Token invalid or expired — try refresh once
                    try {
                        const res = await api.refreshToken();
                        setToken(res.token);
                        setUser(res.user);
                        scheduleRefresh(res.expires_in);
                    } catch {
                        handleLogout();
                    }
                }
            }
            setLoading(false);
        };
        initAuth();

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        setUser(res.user);
        setToken(res.token);
        scheduleRefresh(res.expires_in);
        return res;
    };

    const register = async (name, email, password, role = 'user') => {
        const res = await api.register({ name, email, password, role });
        setUser(res.user);
        setToken(res.token);
        scheduleRefresh(res.expires_in);
        return res;
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch {
            // silent
        }
        handleLogout();
    };

    const value = {
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
