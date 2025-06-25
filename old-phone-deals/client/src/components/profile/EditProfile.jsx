import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col, Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * Edit personal information form component
 * @param {Object} props - Component properties
 * @param {Object} props.profileData - Personal information data
 * @param {Object} props.profileErrors - Form error information
 * @param {Function} props.setProfileData - Function to update personal information data
 * @param {Function} props.setProfileErrors - Function to set form error information
 * @param {Function} props.updateProfile - Function to submit form
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.user - Current user data
 */
const EditProfile = ({ 
  profileData, 
  profileErrors, 
  setProfileData, 
  setProfileErrors,
  updateProfile, 
  loading,
  user
}) => {
  // confirm password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [localErrors, setLocalErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  
  // handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // clear corresponding field errors
    if (localErrors[name]) {
      setLocalErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };
  
  // handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError('');
    
    // clear password related errors
    if (profileErrors.password) {
      setProfileErrors(prev => {
        const updated = { ...prev };
        delete updated.password;
        return updated;
      });
    }
  };
  
  // handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // form validation
    const errors = {};
    if (!profileData.firstname.trim()) errors.firstname = 'Please enter your first name';
    if (!profileData.lastname.trim()) errors.lastname = 'Please enter your last name';
    if (!profileData.email.trim()) errors.email = 'Please enter your email';
    
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    
    // check if the user actually made any changes
    if (
      profileData.firstname === user.firstname &&
      profileData.lastname === user.lastname &&
      profileData.email === user.email
    ) {
      // no changes were made
      setLocalErrors({
        general: 'No changes were made to your profile information'
      });
      return;
    }
    
    // show password confirmation modal
    setShowPasswordModal(true);
  };
  
  // confirm password and submit update
  const confirmUpdate = () => {
    if (!password.trim()) {
      setPasswordError('Please enter your current password');
      return;
    }
    
    // set password to profileData and call update function
    const updatedProfileData = {
      ...profileData,
      password
    };
    
    // close modal
    setShowPasswordModal(false);
    
    // clear password
    setPassword('');
    
    // call update function
    updateProfile({
      preventDefault: () => {},
      target: null
    }, updatedProfileData);
  };

  // merge local errors and errors from ViewModel
  const allErrors = { ...localErrors, ...profileErrors };

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Edit personal information</Card.Title>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstname"
                    value={profileData.firstname}
                    onChange={handleChange}
                    isInvalid={!!allErrors.firstname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {allErrors.firstname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={profileData.lastname}
                    onChange={handleChange}
                    isInvalid={!!allErrors.lastname}
                  />
                  <Form.Control.Feedback type="invalid">
                    {allErrors.lastname}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleChange}
                isInvalid={!!allErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {allErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update profile'}
              </Button>
            </div>

            {/* prompt information */}
            {Object.keys(allErrors).length > 0 && (
              <Alert variant="danger" className="mt-3">
                {allErrors.general || 'Please correct the errors in the form before submitting'}
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>
      
      {/* password confirmation modal */}
      <Modal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Please confirm your identity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Please enter your current password to confirm the update</Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                isInvalid={!!passwordError || !!profileErrors.password}
                placeholder="Enter your current password"
                autoFocus
              />
              <Button
                variant="link"
                className="position-absolute end-0"
                style={{ top: '0', height: '60%', zIndex: 5 }}
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </Button>
              <Form.Control.Feedback type="invalid">
                {passwordError || profileErrors.password}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                To protect your account security, please verify your current password
              </Form.Text>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmUpdate} disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm update'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

EditProfile.propTypes = {
  profileData: PropTypes.shape({
    firstname: PropTypes.string.isRequired,
    lastname: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    password: PropTypes.string
  }).isRequired,
  profileErrors: PropTypes.object.isRequired,
  setProfileData: PropTypes.func.isRequired,
  setProfileErrors: PropTypes.func.isRequired,
  updateProfile: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  user: PropTypes.object.isRequired
};

export default EditProfile; 