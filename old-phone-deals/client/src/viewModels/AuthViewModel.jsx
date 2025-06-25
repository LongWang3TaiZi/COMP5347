import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SwalService from '../service/SwalService';
import { useAuth } from '../context/AuthContext';
import apiService from '../service/ApiService';

const useAuthViewModel = () => {
    // Shared state variables
    const [isLogin, setIsLogin] = useState(true);

    // Login state variables
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Register state variables
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    
    // Form validation state
    const [validated, setValidated] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    
    // Track field touched state for real-time validation
    const [touchedFields, setTouchedFields] = useState({
        firstname: false,
        lastname: false,
        email: false,
        password: false,
        confirmPassword: false
    });
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminLogin = location.pathname.includes('/admin');

    // Set initial form state based on location
    useEffect(() => {
        // Check if there's a URL query param to determine if we should show login or signup
        const searchParams = new URLSearchParams(location.search);
        const showSignup = searchParams.get('signup') === 'true';
        
        if (showSignup && !isAdminLogin) {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [location, isAdminLogin]);

    // Toggle between login/register forms
    const toggleForm = () => {
        setIsLogin(!isLogin);
        // Reset validation state
        setValidated(false);
        setFormErrors({});
        setTouchedFields({
            firstname: false,
            lastname: false,
            email: false,
            password: false,
            confirmPassword: false
        });
    };
    
    // Mark field as touched
    const handleFieldBlur = (field) => {
        setTouchedFields({
            ...touchedFields,
            [field]: true
        });
    };
    
    // Validate firstname
    const validateFirstname = () => {
        if (!touchedFields.firstname) return;
        
        if (!firstname.trim()) {
            setFormErrors(prev => ({...prev, firstname: 'First name cannot be empty'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.firstname;
                return newErrors;
            });
        }
    };
    
    // Validate lastname
    const validateLastname = () => {
        if (!touchedFields.lastname) return;
        
        if (!lastname.trim()) {
            setFormErrors(prev => ({...prev, lastname: 'Last name cannot be empty'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.lastname;
                return newErrors;
            });
        }
    };
    
    // Validate email
    const validateEmail = () => {
        if (!touchedFields.email) return;
        
        if (!registerEmail) {
            setFormErrors(prev => ({...prev, email: 'Email is required'}));
        } else if (!/\S+@\S+\.\S+/.test(registerEmail)) {
            setFormErrors(prev => ({...prev, email: 'Please provide a valid email format'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.email;
                return newErrors;
            });
        }
    };
    
    // Validate login email
    const validateLoginEmail = () => {
        if (!email) {
            setFormErrors(prev => ({...prev, email: 'Email is required'}));
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setFormErrors(prev => ({...prev, email: 'Please enter a valid email address'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.email;
                return newErrors;
            });
        }
    };
    
    // Validate login password
    const validateLoginPassword = () => {
        if (!password) {
            setFormErrors(prev => ({...prev, password: 'Password is required'}));
        } else if (password.length < 8) {
            setFormErrors(prev => ({...prev, password: 'Password must be at least 8 characters long'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.password;
                return newErrors;
            });
        }
    };
    
    // Validate password
    const validatePassword = () => {
        if (!touchedFields.password) return;
        
        if (!registerPassword) {
            setFormErrors(prev => ({...prev, password: 'Password is required'}));
        } else if (registerPassword.length < 8) {
            setFormErrors(prev => ({...prev, password: 'Password must be at least 8 characters'}));
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(registerPassword)) {
            setFormErrors(prev => ({...prev, password: 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.password;
                return newErrors;
            });
        }
        
        // If confirmPassword is touched, validate it too since it depends on password
        if (touchedFields.confirmPassword) {
            validateConfirmPassword();
        }
    };
    
    // Validate confirm password
    const validateConfirmPassword = () => {
        if (!touchedFields.confirmPassword) return;
        
        if (!confirmPassword) {
            setFormErrors(prev => ({...prev, confirmPassword: 'Please confirm your password'}));
        } else if (confirmPassword !== registerPassword) {
            setFormErrors(prev => ({...prev, confirmPassword: 'The two passwords that you entered do not match!'}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.confirmPassword;
                return newErrors;
            });
        }
    };
    
    // Run validation when field values change
    useEffect(() => {
        if (!isLogin) {
            validateFirstname();
        }
    }, [firstname, touchedFields.firstname, isLogin]);
    
    useEffect(() => {
        if (!isLogin) {
            validateLastname();
        }
    }, [lastname, touchedFields.lastname, isLogin]);
    
    useEffect(() => {
        if (!isLogin) {
            validateEmail();
        }
    }, [registerEmail, touchedFields.email, isLogin]);
    
    useEffect(() => {
        if (!isLogin) {
            validatePassword();
        }
    }, [registerPassword, touchedFields.password, isLogin]);
    
    useEffect(() => {
        if (!isLogin) {
            validateConfirmPassword();
        }
    }, [confirmPassword, registerPassword, touchedFields.confirmPassword, isLogin]);

    // Handle login form submission
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        
        // Validate login fields
        validateLoginEmail();
        validateLoginPassword();
        
        const form = e.currentTarget;
        if (form.checkValidity() === false || Object.keys(formErrors).length > 0) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        try {
            setLoading(true);
            const user = await login(email, password, isAdminLogin);
            
            // Redirect based on login path and user role
            if (isAdminLogin) {
                // Check if user has admin privileges
                if (user && (user.role === 'admin' || user.role === 'superAdmin')) {
                    await SwalService.success('Admin login successful!');
                    navigate('/admin/home', { replace: true });
                } else {
                    await SwalService.error('You do not have admin privileges');
                    navigate('/auth', { replace: true });
                }
            } else {
                // Regular user login
                await SwalService.success('Login successful!');
                
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    navigate(redirectUrl, { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            }
        } catch (error) {
            if (error.response?.data?.message) {
                // Handle specific error messages
                const errorMessage = error.response.data.message;
                if (errorMessage.includes('email')) {
                    setFormErrors(prev => ({...prev, email: errorMessage}));
                } else if (errorMessage.includes('password')) {
                    setFormErrors(prev => ({...prev, password: errorMessage}));
                } else {
                    SwalService.error(errorMessage);
                }
            } else {
                SwalService.error(error.message || 'Login failed, please try again later');
            }
            setValidated(true);
        } finally {
            setLoading(false);
        }
    };

    // Handle register form submission
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        
        // Mark all fields as touched to show validation messages
        setTouchedFields({
            firstname: true,
            lastname: true,
            email: true,
            password: true,
            confirmPassword: true
        });
        
        // Run all validations
        validateFirstname();
        validateLastname();
        validateEmail();
        validatePassword();
        validateConfirmPassword();
        
        // Check if there are any validation errors
        if (Object.keys(formErrors).length > 0) {
            setValidated(true);
            return;
        }
        
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await apiService.post('/user/register', {
                firstname,
                lastname,
                email: registerEmail,
                password: registerPassword
            });
            
            if (response.success) {
                // Clear form
                setFirstname('');
                setLastname('');
                setRegisterEmail('');
                setRegisterPassword('');
                setConfirmPassword('');
                setValidated(false);
                setFormErrors({});
                setTouchedFields({
                    firstname: false,
                    lastname: false,
                    email: false,
                    password: false,
                    confirmPassword: false
                });
                
                await SwalService.success('Registration successful! Please check your email to verify your account.');
                
                // Switch to login form
                setIsLogin(true);
            }
        } catch (error) {
            // Handle specific error messages from backend
            if (error.response?.data) {
                const errorData = error.response.data;
                
                // Check for specific error types from backend
                if (errorData.message.includes('already registered')) {
                    setFormErrors(prev => ({...prev, email: 'This email address is already registered'}));
                } else if (errorData.message.includes('email')) {
                    setFormErrors(prev => ({...prev, email: errorData.message}));
                } else if (errorData.message.includes('password')) {
                    setFormErrors(prev => ({...prev, password: errorData.message}));
                } else if (errorData.message.includes('firstname')) {
                    setFormErrors(prev => ({...prev, firstname: errorData.message}));
                } else if (errorData.message.includes('lastname')) {
                    setFormErrors(prev => ({...prev, lastname: errorData.message}));
                } else {
                    // Generic error message for other types
                    SwalService.error(errorData.message || 'Registration failed, please try again later');
                }
            } else {
                SwalService.error('Registration failed, please try again later');
            }
            setValidated(true);
        } finally {
            setLoading(false);
        }
    };

    return {
        // Shared state
        isLogin,
        setIsLogin,
        toggleForm,
        loading,
        
        // Login state and methods
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        handleLoginSubmit,
        
        // Register state and methods
        firstname,
        setFirstname,
        lastname,
        setLastname,
        registerEmail,
        setRegisterEmail,
        registerPassword,
        setRegisterPassword,
        confirmPassword,
        setConfirmPassword,
        showRegisterPassword,
        setShowRegisterPassword,
        handleRegisterSubmit,
        
        // Form validation
        validated,
        formErrors,
        
        // Real-time validation
        handleFieldBlur,
        touchedFields,
        
        // Other
        isAdminLogin
    };
};

export default useAuthViewModel;