import React from 'react';
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuthViewModel from '../../viewModels/AuthViewModel';
import { ROUTE_PATHS } from '../../config/routePaths';

const AuthPage = () => {
    const location = useLocation();
    const isAdminLogin = location.pathname.includes('/admin');
    
    const {
        // Shared state
        isLogin,
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
        
        // Validation state
        validated,
        formErrors,
        
        // Real-time validation
        handleFieldBlur,
        touchedFields
    } = useAuthViewModel();

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <div className="p-4 border rounded shadow-sm">
                        <h2 className="text-center mb-4">
                            {isAdminLogin 
                                ? 'Welcome to Old Phone Deals Management' 
                                : 'Welcome to Old Phone Deals'}
                        </h2>
                        <h3 className="text-center mb-4">
                            {isLogin ? 'Login' : 'Sign Up'}
                        </h3>
                        
                        {/* Login Form */}
                        {isLogin && (
                            <Form 
                                noValidate 
                                validated={validated} 
                                onSubmit={handleLoginSubmit}
                            >
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Please enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => handleFieldBlur('email')}
                                        required
                                        isInvalid={!!formErrors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.email || 'Please enter a valid email address'}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Please enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onBlur={() => handleFieldBlur('password')}
                                            required
                                            minLength={8}
                                            isInvalid={!!formErrors.password}
                                        />
                                        <Button
                                            variant="link"
                                            className="position-absolute end-0 translate-middle-y"
                                            onClick={() => setShowPassword(!showPassword)}
                                            type="button"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.password || 'Password must be at least 8 characters long'}
                                        </Form.Control.Feedback>
                                    </div>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>

                                {/* Only show signup option for non-admin logins */}
                                {!isAdminLogin && (
                                    <div className="text-center mb-3">
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={toggleForm}
                                            className="px-4 py-2"
                                            type="button"
                                        >
                                            Don't have an account? Sign up
                                        </Button>
                                    </div>
                                )}

                                <div className="text-center">
                                    <Link to="/" className="me-3">
                                        Back to Website
                                    </Link>
                                </div>
                                {!isAdminLogin && (
                                    <div className="text-center mt-2">
                                        <Link to={ROUTE_PATHS.REQUEST_PASSWORD_RESET} className="me-3">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                )}
                            </Form>
                        )}

                        {/* Register Form - only shown for non-admin logins */}
                        {!isLogin && !isAdminLogin && (
                            <Form 
                                noValidate 
                                validated={validated} 
                                onSubmit={handleRegisterSubmit}
                            >
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>First Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Please enter your first name"
                                                value={firstname}
                                                onChange={(e) => setFirstname(e.target.value)}
                                                onBlur={() => handleFieldBlur('firstname')}
                                                required
                                                isInvalid={touchedFields.firstname && !!formErrors.firstname}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {formErrors.firstname || 'First name cannot be empty'}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Last Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Please enter your last name"
                                                value={lastname}
                                                onChange={(e) => setLastname(e.target.value)}
                                                onBlur={() => handleFieldBlur('lastname')}
                                                required
                                                isInvalid={touchedFields.lastname && !!formErrors.lastname}
                                            />
                                            <Form.Control.Feedback type="invalid">
                                                {formErrors.lastname || 'Last name cannot be empty'}
                                            </Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Please enter your email"
                                        value={registerEmail}
                                        onChange={(e) => setRegisterEmail(e.target.value)}
                                        onBlur={() => handleFieldBlur('email')}
                                        required
                                        isInvalid={touchedFields.email && !!formErrors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.email || 'Please provide a valid email format'}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        We'll send a verification email to this address
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            placeholder="Please enter your password"
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            onBlur={() => handleFieldBlur('password')}
                                            required
                                            minLength={8}
                                            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}"
                                            isInvalid={touchedFields.password && !!formErrors.password}
                                        />
                                        <Button
                                            variant="link"
                                            className="position-absolute end-0 top-50 translate-middle-y"
                                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                            type="button"
                                        >
                                            {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.password || 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character'}
                                        </Form.Control.Feedback>
                                    </div>
                                    <Form.Text className="text-muted">
                                        Password must contain at least 8 characters, including uppercase, lowercase, numbers, and special characters
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            placeholder="Please confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onBlur={() => handleFieldBlur('confirmPassword')}
                                            required
                                            isInvalid={touchedFields.confirmPassword && !!formErrors.confirmPassword}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.confirmPassword || 'The two passwords that you entered do not match!'}
                                        </Form.Control.Feedback>
                                    </div>
                                </Form.Group>

    

                                {/* Show general error if any */}
                                {formErrors.general && (
                                    <Alert variant="danger" className="mb-3">
                                        {formErrors.general}
                                    </Alert>
                                )}

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing up...' : 'Sign Up'}
                                </Button>

                                <div className="text-center mb-3">
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={toggleForm}
                                        className="px-4 py-2"
                                        type="button"
                                    >
                                        Already have an account? Login
                                    </Button>
                                </div>
                                <div className="text-center">
                                    <Link to="/" className="me-3">
                                        Back to Website
                                    </Link>
                                </div>
                            </Form>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default AuthPage;