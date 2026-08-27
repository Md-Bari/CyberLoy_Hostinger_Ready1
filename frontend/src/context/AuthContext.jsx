import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, getUserData, removeAuthToken, removeUserData } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUserData());
    const [token, setToken] = useState(getAuthToken());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = getAuthToken();
            if (storedToken) {
                try {
                    const currentUser = await api.getCurrentUser();
                    setUser(currentUser);
                } catch (err) {
                    console.warn("Auth check failed:", err);
                    // clear invalid session
                    removeAuthToken();
                    removeUserData();
                    setUser(null);
                    setToken(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const register = async (name, email, password, role = 'user') => {
        const res = await api.register({ name, email, password, role });
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        setToken(null);
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
