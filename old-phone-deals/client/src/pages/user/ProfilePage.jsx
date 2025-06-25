import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Tabs, Tab, Alert, Button, Navbar } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import EditProfile from '../../components/profile/EditProfile';
import ChangePassword from '../../components/profile/ChangePassword';
import ManageListings from '../../components/profile/ManageListings';
import ViewComments from '../../components/profile/ViewComments';
import useProfileViewModel from '../../viewModels/ProfileViewModel';
import { BoxArrowRight, HouseDoor } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/user/ProfilePage.css';

// error boundary component, prevent child component errors from crashing the entire page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="danger">
          <h4>Component loading error</h4>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()}>Refresh page</Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

// safe render component, provide defensive checks
const SafeComponent = ({ Component, fallback, ...props }) => {
  try {
    return <Component {...props} />;
  } catch (error) {
    console.error('component rendering error:', error);
    return fallback || <Alert variant="danger">Component loading failed</Alert>;
  }
};

const ProfilePage = () => {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  
  try {
    const viewModel = useProfileViewModel();
    const navigate = useNavigate();
    
    // destructure view model properties
    const {
      user,
      loading,
      activeTab,
      handleTabChange,
      
      // Edit Profile
      profileData,
      profileErrors,
      setProfileData,
      setProfileErrors,
      updateProfile,
      
      // Change Password
      passwordData,
      passwordErrors,
      setPasswordData,
      setPasswordErrors,
      changePassword,
      showCurrentPassword,
      setShowCurrentPassword,
      showNewPassword,
      setShowNewPassword,
      
      // Manage Listings
      listings,
      listingsLoading,
      listingData,
      listingErrors,
      setListingData,
      setListingErrors,
      showAddListingModal,
      setShowAddListingModal,
      addNewListing,
      togglePhoneStatus,
      deletePhoneListing,
      fetchUserListings,
      
      // View Comments
      comments,
      commentsLoading,
      toggleCommentVisibility,
      
      // Navigation
      navigateToHome,
      handleLogout
    } = viewModel;

    // loading state
    if (authLoading) {
      return (
        <Container className="py-5">
          <h2>Loading...</h2>
          <Alert variant="info">
            <p>Checking your login status, please wait...</p>
          </Alert>
        </Container>
      );
    }

    // unauthenticated user
    if (!isAuthenticated || !user) {
      return (
        <Container className="py-5">
          <h2>Please log in to view your profile</h2>
          <Alert variant="warning">
            <p>You may need to log in again, or the session has expired.</p>
            <div className="mt-3">
              <Button variant="primary" onClick={() => window.location.href = "/auth"}>
                Back to login page
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    // defensive checks ensure user object contains required properties
    const safeUser = {
      _id: user?._id || '',
      firstname: user?.firstname || 'user',
      lastname: user?.lastname || '',
      email: user?.email || '',
      ...user
    };

    return (
      <Container className="profile-page py-4">
        {/* navigation buttons */}
        <Navbar className="mb-4 d-flex justify-content-between">
          <Button 
            variant="outline-primary" 
            onClick={navigateToHome}
          >
            <HouseDoor className="me-2" />
            Back to home
          </Button>
          <Button 
            variant="outline-danger" 
            onClick={handleLogout}
            disabled={loading}
          >
            <BoxArrowRight className="me-2" />
            Signout
          </Button>
        </Navbar>
        
        <Row>
          <Col>
            <h2 className="mb-4">Personal information</h2>
            <Alert variant="info" className="mb-3">
              <p>Welcome, {safeUser.firstname} {safeUser.lastname}!</p>
              <p>Email: {safeUser.email}</p>
            </Alert>
            
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="mb-4 profile-tabs"
              defaultActiveKey="editProfile"
            >
              <Tab eventKey="editProfile" title="Edit profile">
                <ErrorBoundary>
                  <EditProfile 
                    profileData={profileData}
                    profileErrors={profileErrors}
                    setProfileData={setProfileData}
                    setProfileErrors={setProfileErrors}
                    updateProfile={updateProfile}
                    loading={loading}
                    user={safeUser}
                  />
                </ErrorBoundary>
              </Tab>
              
              <Tab eventKey="changePassword" title="Change password">
                <ErrorBoundary>
                  <ChangePassword 
                    passwordData={passwordData}
                    passwordErrors={passwordErrors}
                    setPasswordData={setPasswordData}
                    setPasswordErrors={setPasswordErrors}
                    changePassword={changePassword}
                    loading={loading}
                    showCurrentPassword={showCurrentPassword}
                    setShowCurrentPassword={setShowCurrentPassword}
                    showNewPassword={showNewPassword}
                    setShowNewPassword={setShowNewPassword}
                  />
                </ErrorBoundary>
              </Tab>
              
              <Tab eventKey="manageListings" title="Manage listings">
                <ErrorBoundary>
                  <ManageListings 
                    listings={listings}
                    listingsLoading={listingsLoading}
                    listingData={listingData}
                    listingErrors={listingErrors}
                    setListingData={setListingData}
                    showAddListingModal={showAddListingModal}
                    setShowAddListingModal={setShowAddListingModal}
                    addNewListing={addNewListing}
                    togglePhoneStatus={togglePhoneStatus}
                    deletePhoneListing={deletePhoneListing}
                    fetchUserListings={fetchUserListings}
                    loading={loading}
                  />
                </ErrorBoundary>
              </Tab>
              
              <Tab eventKey="viewComments" title="View comments">
                <ErrorBoundary>
                  <ViewComments 
                    comments={comments}
                    commentsLoading={commentsLoading}
                    toggleCommentVisibility={toggleCommentVisibility}
                    loading={loading}
                  />
                </ErrorBoundary>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    );
  } catch (error) {
    console.error('ProfilePage component rendering error:', error);
    return (
      <Container className="py-5">
        <h2>Sorry, an error occurred</h2>
        <Alert variant="danger">
          <p>Failed to load the personal information page. Please refresh the page or return to the home page.</p>
          <p>Error details: {error.message}</p>
          <div className="mt-3">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
            <Button variant="secondary" className="ms-2" onClick={() => window.location.href = "/"}>
              Back to home
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
};

export default ProfilePage; 