import {BrowserRouter, Routes, Route, Link, Navigate} from 'react-router-dom';
import React, { useEffect } from 'react';
import './styles/global.css';
import AdminHome from './pages/admin/Home';
import 'bootstrap/dist/css/bootstrap.min.css';
import VerifyEmailPage from './pages/auth/VerifyEmailPage'; 
import MainPage from './pages/user/MainPage';
import AuthPage from './pages/auth/AuthPage';
import HomePage from './pages/user/HomePage';
import RequestPasswordResetPage from './pages/auth/RequestPasswordResetPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import { useAuth } from './context/AuthContext';
import { ROUTE_PATHS } from './config/routePaths';
import PhoneDetailPage from './pages/user/PhoneDetailPage';
import ProfilePage from './pages/user/ProfilePage';
import CartPage from './pages/user/CartPage';
import WishlistPage from './pages/user/WishlistPage';

// admin route protection component
const AdminProtectedRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    
    // Handle loading state to prevent flash of redirect
    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    // if not authenticated, redirect to admin login
    if (!isAuthenticated) {
        window.location.href = '/admin/login';
        return null;
    }
    
    // if authenticated but not admin, redirect to admin login
    if (!isAdmin()) {
        window.location.href = '/admin/login';
        return null;
    }

    // if admin and authenticated, show the protected component
    return children;
};

// user protected route component
const UserProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // handle loading state
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // if not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // if authenticated, show the protected component
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/auth" element={<AuthPage />} />
                    
                    {/* Legacy routes that redirect to /auth */}
                    <Route path="/login" element={<Navigate to="/auth" replace />} />
                    <Route path="/register" element={<Navigate to="/auth?signup=true" replace />} />
                    
                    {/* Email Verification Routes */}
                    <Route path={ROUTE_PATHS.VERIFY_EMAIL} element={<VerifyEmailPage />} />
                    {/* Password Reset Routes */}
                    <Route path={ROUTE_PATHS.REQUEST_PASSWORD_RESET} element={<RequestPasswordResetPage />} />
                    <Route path={ROUTE_PATHS.RESET_PASSWORD} element={<ResetPasswordPage />} />
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AuthPage />} />
                    <Route path="/admin/home" element={
                        <AdminProtectedRoute>
                            <AdminHome />
                        </AdminProtectedRoute>
                    } />
                    
                    {/* Profile Route */}
                    <Route path="/profile" element={
                        <UserProtectedRoute>
                            <ProfilePage />
                        </UserProtectedRoute>
                    } />
                    
                    {/* Cart Route - standalone without TopBar */}
                    <Route path="/cart" element={
                        <UserProtectedRoute>
                            <CartPage />
                        </UserProtectedRoute>
                    } />
                    
                    {/* Wishlist Route - standalone without TopBar */}
                    <Route path="/wishlist" element={
                        <UserProtectedRoute>
                            <WishlistPage />
                        </UserProtectedRoute>
                    } />

                    {/* Main Routes */}
                    <Route path="/" element={<MainPage />}>
                        <Route index element={<HomePage />} />
                        <Route path="phone/:id" element={<PhoneDetailPage />} />
                    </Route>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
