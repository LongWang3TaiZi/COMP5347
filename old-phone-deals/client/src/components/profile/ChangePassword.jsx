import React from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * change password form component
 * @param {Object} props - component properties
 * @param {Object} props.passwordData - password data
 * @param {Object} props.passwordErrors - form error information
 * @param {Function} props.setPasswordData - update password data function
 * @param {Function} props.setPasswordErrors - function to set form error information
 * @param {Function} props.changePassword - submit form function
 * @param {boolean} props.loading - loading state
 * @param {boolean} props.showCurrentPassword - show current password flag
 * @param {Function} props.setShowCurrentPassword - toggle current password visibility function
 * @param {boolean} props.showNewPassword - show new password flag
 * @param {Function} props.setShowNewPassword - toggle new password visibility function
 */
const ChangePassword = ({ 
  passwordData, 
  passwordErrors, 
  setPasswordData,
  setPasswordErrors,
  changePassword, 
  loading,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword
}) => {
  // handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Update the data
    const updatedData = {
      ...passwordData,
      [name]: value
    };
    setPasswordData(updatedData);
    
    // clear any previous error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Real-time validation for password matching
    if (name === 'newPassword' && updatedData.currentPassword && value === updatedData.currentPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'New password cannot be the same as your current password'
      }));
    }
  };
  
  // validate and handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // basic validation
    let hasErrors = false;
    const errors = {};
    
    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = 'Please enter your current password';
      hasErrors = true;
    }
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'Please enter a new password';
      hasErrors = true;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
      hasErrors = true;
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
      hasErrors = true;
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = 'New password cannot be the same as your current password';
      hasErrors = true;
    }
    
    // Update errors state
    setPasswordErrors(errors);
    
    // Only proceed if there are no errors
    if (!hasErrors) {
      changePassword(e);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Change password</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Current password</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleChange}
                isInvalid={!!passwordErrors.currentPassword}
              />
              <Button
                variant="link"
                className="position-absolute end-0"
                style={{ top: '0', height: '60%', zIndex: 5 }}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                type="button"
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {passwordErrors.currentPassword}
              </Form.Control.Feedback>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>New password</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                isInvalid={!!passwordErrors.newPassword}
              />
              <Button
                variant="link"
                className="position-absolute end-0"
                style={{ top: '0', height: '60%', zIndex: 5 }}
                onClick={() => setShowNewPassword(!showNewPassword)}
                type="button"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {passwordErrors.newPassword}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Password must be at least 8 characters long, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).
              </Form.Text>
            </div>
          </Form.Group>

          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Change password'}
            </Button>
          </div>

          {/* prompt information */}
          {Object.keys(passwordErrors).length > 0 && (
            <Alert variant="danger" className="mt-3">
              {passwordErrors.general ? (
                <div>
                  <strong>{passwordErrors.general}</strong>
                </div>
              ) : (
                <div>
                  Please correct the errors in the form before submitting:
                  <ul className="mb-0 mt-1">
                    {passwordErrors.currentPassword && <li>{passwordErrors.currentPassword}</li>}
                    {passwordErrors.newPassword && <li>{passwordErrors.newPassword}</li>}
                  </ul>
                </div>
              )}
            </Alert>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

ChangePassword.propTypes = {
  passwordData: PropTypes.shape({
    currentPassword: PropTypes.string.isRequired,
    newPassword: PropTypes.string.isRequired
  }).isRequired,
  passwordErrors: PropTypes.object.isRequired,
  setPasswordData: PropTypes.func.isRequired,
  setPasswordErrors: PropTypes.func.isRequired,
  changePassword: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  showCurrentPassword: PropTypes.bool.isRequired,
  setShowCurrentPassword: PropTypes.func.isRequired,
  showNewPassword: PropTypes.bool.isRequired,
  setShowNewPassword: PropTypes.func.isRequired
};

export default ChangePassword; 