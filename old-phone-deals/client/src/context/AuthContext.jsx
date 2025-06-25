import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import ApiService from '../service/ApiService';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
/*
!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!Mention!!!!!!!!!!!!
not tested with backend yet
!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!
*/
// --- Type Definitions ---
/**
 * @typedef {object} User - User information object (can be adjusted based on actual backend return)
 * @property {string} _id - User ID
 * @property {string} firstname - First name
 * @property {string} email - Email
 */

/**
 * @typedef {object} AuthContextType - Type definition for AuthContext
 * @property {boolean} isAuthenticated - Whether the user is authenticated
 * @property {User | null} user - The current logged-in user information, null if not logged in
 * @property {boolean} isLoading - Whether the authentication status is being loaded (e.g., during app initial load)
 * @property {(email, password) => Promise<void>} login - Method to handle login
 * @property {() => Promise<void>} logout - Method to handle logout
 */

const AuthContext = createContext(null);//initialize the context with null

/**
 * AuthProvider component, responsible for managing authentication state and providing Context
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
    //initialize the state variables
    /*
    For testing(front-end) please change the state variables to true and "test"
    */
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Handles user login
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {boolean} isAdminLogin - Whether this is an admin login attempt
     * @returns {Promise<Object>} - Returns the user data
     */
    const login = useCallback(async (email, password, isAdminLogin = false) => {
        setIsLoading(true);
        try {
            // select the correct login endpoint based on login type
            const loginEndpoint = isAdminLogin ? '/admin/login' : '/user/login';
            
            const response = await ApiService.post(loginEndpoint, { email, password });
            if (response.success && response.data && response.data.user) {
                const loggedInUserData = response.data.user;
                setUser(loggedInUserData);
                setIsAuthenticated(true);
                return loggedInUserData; // return user data for use in LoginViewModel
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Determine if the user is an admin
     * @returns {boolean} true if the user has admin or superAdmin role
     */
    const isAdmin = useCallback(() => {
        return user && (user.role === 'admin' || user.role === 'superAdmin');
    }, [user]);

    /**
     * Handles user logout with confirmation dialog
     * @returns {Promise<boolean>} True if logged out, false if cancelled
     */
    const logout = useCallback(async () => {
        // show confirmation dialog
        const confirmResult = await Swal.fire({
            title: 'Confirm Logout',
            text: 'Are you sure you want to log out?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirm Logout',
            cancelButtonText: 'Cancel'
        });

        // if the user cancels, stop the logout process
        if (!confirmResult.isConfirmed) {
            return false;
        }

        setIsLoading(true);
        try {
            // use a unified logout endpoint
            await ApiService.post('/user/logout');
            setUser(null);
            setIsAuthenticated(false);
            
            // show logout success message
            Swal.fire({
                icon: 'success',
                title: 'Logout Success',
                text: 'You have successfully logged out',
                timer: 1500,
                showConfirmButton: false
            });

            // redirect to main page
            window.location.href = '/';
            
            return true;
        } catch (error) {
            // even if the server-side logout fails, we should clean up the client state
            setUser(null);
            setIsAuthenticated(false);
            return true;
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback

    // check authentication status when component mounts
    useEffect(() => {
        const checkUserSession = async () => {
            try {
                setIsLoading(true);
                
                // determine the current path
                const currentPath = window.location.pathname;
                
                // skip session check for login and registration pages
                if (currentPath === '/login' || currentPath === '/admin/login' || 
                    currentPath === '/signup' || currentPath === '/register' ||
                    currentPath === '/verify-email') {
                    setIsLoading(false);
                    return;
                }
                
                // determine the correct session check endpoint based on current path
                const isAdminPath = currentPath.includes('/admin');
                const sessionCheckPath = isAdminPath ? '/admin/check-session' : '/user/check-session';

                const response = await ApiService.get(sessionCheckPath);

                // based on the response, set the user and isAuthenticated state
                if (response.success && response.data.isAuthenticated) {
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    
                    // redirect to login page if on admin route and not authenticated
                    if (isAdminPath && currentPath !== '/admin/login') {
                        window.location.href = '/admin/login';
                    }
                }
            } catch (error) {
                // clean up auth state
                setUser(null);
                setIsAuthenticated(false);
                
                // handle 401 errors from API by redirecting
                if (error.response?.status === 401) {
                    const currentPath = window.location.pathname;
                    const isAdminPath = currentPath.includes('/admin');
                    
                    // skip redirect for login and registration pages
                    if (currentPath === '/login' || currentPath === '/admin/login' || 
                        currentPath === '/signup' || currentPath === '/register' ||
                        currentPath === '/verify-email') {
                        return;
                    }
                    
                    // only redirect if not already on login page
                    if (isAdminPath && currentPath !== '/admin/login') {
                        window.location.href = '/admin/login';
                    } else if (!isAdminPath && currentPath !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        checkUserSession();
        
        // re-check session when path changes to ensure we use the right session
        const handlePathChange = () => {
            checkUserSession();
        };
        
        // add event listener for path changes
        window.addEventListener('popstate', handlePathChange);
        
        // clean up listener
        return () => {
            window.removeEventListener('popstate', handlePathChange);
        };
    }, []);

    const value = React.useMemo(() => ({
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        isAdmin,
    }), [isAuthenticated, user, isLoading, login, logout, isAdmin]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom Hook to use the auth context
 * @returns {AuthContextType}
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) { //security check
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};