import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../service/ApiService';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import axios from 'axios';
import imageCompression from 'browser-image-compression';

/**
 * ViewModel for the Profile page, handles all business logic
 * @returns {Object} Profile page state and methods
 */
const useProfileViewModel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // shared state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('editProfile');
  
  // Edit Profile related state
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: ''
  });
  const [profileErrors, setProfileErrors] = useState({});
  
  // Change Password related state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // listings related state
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  
  // add new listing related state
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [listingData, setListingData] = useState({
    title: '',
    brand: '',
    image: null,
    price: 0,
    stock: 0
  });
  const [listingErrors, setListingErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  
  // comments related state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  // initialize user profile
  useEffect(() => {
    if (user) {
      setProfileData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);
  
  // ensure the editProfile tab is displayed by default when entering from the main page, but keep the current tab when refreshing
  useEffect(() => {
    // get the current URL query parameters or hash to determine the current tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const validTabs = ['editProfile', 'changePassword', 'manageListings', 'viewComments'];
    
    // get the last visited tab from sessionStorage
    const storedTab = sessionStorage.getItem('profileActiveTab');

    // document.referrer is empty or does not include the current domain, indicating that it is a new visit or a visit from another site
    const isNewVisit = !document.referrer || !document.referrer.includes(window.location.host);
    // referrer includes the current domain but is not a profile page, indicating that it is a navigation from another page within the site
    const isNavigationFromOtherPage = document.referrer.includes(window.location.host) 
                                     && !document.referrer.includes('/profile');
    
    let selectedTab = 'editProfile'; // default tab
    
    // based on different conditions, decide which tab to display
    if (tabParam && validTabs.includes(tabParam)) {
      // URL parameter has the highest priority
      selectedTab = tabParam;
      sessionStorage.setItem('profileActiveTab', tabParam);
    } else if (!isNewVisit && !isNavigationFromOtherPage && storedTab && validTabs.includes(storedTab)) {
      // if the page is refreshed or navigated from the Profile page, and the stored tab is valid, then use the stored tab
      selectedTab = storedTab;
    } else {
      // when visiting for the first time or navigating from another page, the default tab is editProfile
      selectedTab = 'editProfile';
      sessionStorage.setItem('profileActiveTab', 'editProfile');
    }
    
    // set the active tab
    setActiveTab(selectedTab);
    
    // preload related data
    if (selectedTab === 'manageListings') {
      fetchUserListings();
    } else if (selectedTab === 'viewComments') {
      fetchUserComments();
    }
  }, []); // only execute once when the component is mounted
  
  // handle tab switch
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    
    // save the current tab to sessionStorage
    sessionStorage.setItem('profileActiveTab', tabKey);
    
    // update the URL parameter, without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabKey);
    window.history.pushState({}, '', url);
    
    // load different data based on different tabs
    if (tabKey === 'manageListings' && listings.length === 0) {
      fetchUserListings();
    } else if (tabKey === 'viewComments' && comments.length === 0) {
      fetchUserComments();
    }
  };
  
  // fetch user listings
  const fetchUserListings = useCallback(async () => {
    if (!user || !user._id) return;

    try {
      setListingsLoading(true);
      const response = await apiService.get('/user/profile/listings');
      
      if (response && response.success) {
        // special case: listings in statusCode field
        if (Array.isArray(response.statusCode) && response.statusCode.length > 0) {
          setListings(response.statusCode);
          return;
        }
        
        // if not found in statusCode, try to find in data field
        if (response.data) {
          if (Array.isArray(response.data)) {
            setListings(response.data);
          } else {
            console.error('Listings data format is incorrect', response.data);
            setListings([]);
          }
        } else {
          console.error('Listings response missing valid data', response);
          setListings([]);
        }
      } else {
        console.error('Failed to fetch listings', response);
        setListings([]);
      }
    } catch (error) {
      console.error('Failed to fetch listings', error);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [user]);
  
  // fetch user comments
  const fetchUserComments = useCallback(async () => {
    if (!user || !user._id) return;
    
    try {
      setCommentsLoading(true);
      const response = await apiService.get('/user/profile/comments');

      if (response && response.success) {
        if (Array.isArray(response.statusCode) && response.statusCode.length > 0) {
          const validComments = response.statusCode.filter(item => 
            item && typeof item === 'object' && item._id && item.title
          );
          
          // print the comment information for each phone
          validComments.forEach(phone => {
            console.log(`the comment information for the phone ${phone.title}:`, phone.reviews.map(r => ({
              id: r._id,
              comment: r.comment,
              hidden: r.hidden
            })));
          });
          
          setComments(validComments);
          return;
        }
      } else {
        console.error('failed to fetch comments list', response);
        setComments([]);
      }
    } catch (error) {
      console.error('failed to fetch comments list', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [user]);
  
  // update personal profile
  const updateProfile = async (e, updatedData = null) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // use the updated data or current state
    const dataToUpdate = updatedData || profileData;
    
    // form validation
    const errors = {};
    if (!dataToUpdate.firstname.trim()) errors.firstname = 'Please enter your first name';
    if (!dataToUpdate.lastname.trim()) errors.lastname = 'Please enter your last name';
    if (!dataToUpdate.email.trim()) errors.email = 'Please enter your email';
    if (!dataToUpdate.password || !dataToUpdate.password.trim()) errors.password = 'Please enter your current password to verify your identity';
    
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.put('/user/profile/update', dataToUpdate);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Personal information has been updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        
        // clear password field
        setProfileData({
          ...dataToUpdate,
          password: ''
        });
        
        // clear errors
        setProfileErrors({});
        
        // reload page to refresh user information
        window.location.reload();
      }
    } catch (error) {
      console.error('failed to update profile', error);
      
      // handle specific errors
      if (error.response?.data?.message === 'INVALID_PASSWORD') {
        setProfileErrors({
          ...profileErrors,
          password: 'Password is incorrect'
        });
      } else if (error.response?.data?.message === 'EMAIL_ALREADY_EXISTS') {
        setProfileErrors({
          ...profileErrors,
          email: 'This email is already in use'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // change password
  const changePassword = async (e) => {

    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    try {

      // validate locally first, to avoid sending API requests
      if (!passwordData.currentPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Please enter your current password'
        }));
        return;
      }
      
      if (!passwordData.newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: 'Please enter your new password'
        }));
        return;
      }
      
      if (passwordData.newPassword === passwordData.currentPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: 'New password cannot be the same as your current password'
        }));
        return;
      }

      setLoading(true);
      
      // use a custom axios instance to send requests, to avoid the global interceptor's 401 redirect
      const axiosInstance = axios.create({
        baseURL: 'http://localhost:7777/api',
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      const response = await axiosInstance.put('/user/profile/change-password', passwordData);
      const data = response.data;

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password has been changed successfully, a confirmation email has been sent to your email',
          timer: 2000,
          showConfirmButton: false
        });
        
        // reset form
        setPasswordData({
          currentPassword: '',
          newPassword: ''
        });

        // clear any errors
        setPasswordErrors({});
      }
    } catch (error) {
      console.error('failed to change password', error);
      
      // handle error response
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || '';
      
      // handle 401 error indicating password verification failed
      if (statusCode === 401 || errorMessage === 'INVALID_CURRENT_PASSWORD' || errorMessage.includes('current password')) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
        return; // prevent the default 401 handling
      }
      
      // handle other specific errors
      if (errorMessage === 'SAME_PASSWORD' || errorMessage.includes('same as')) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: 'New password cannot be the same as your current password'
        }));
      } else if (errorMessage) {
        // other server errors
        setPasswordErrors(prev => ({
          ...prev,
          general: errorMessage
        }));
      } else {
        // general error
        setPasswordErrors(prev => ({
          ...prev,
          general: 'Failed to change password. Please try again.'
        }));
      }
    } finally {
      setLoading(false);
    }
  };
  
  // handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // validate the file type
      if (!file.type.startsWith('image/')) {
        setListingErrors(prev => ({
          ...prev,
          image: 'please upload an image file'
        }));
        return;
      }
      
      // validate the file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setListingErrors(prev => ({
          ...prev,
          image: 'the image size cannot exceed 5MB'
        }));
        return;
      }
      
      // create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // update listingData
      setListingData(prev => ({
        ...prev,
        image: file
      }));
      
      // clear errors
      setListingErrors(prev => ({
        ...prev,
        image: undefined
      }));
    }
  };
  
  // clear image preview
  const clearImagePreview = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setListingData(prev => ({
      ...prev,
      image: null
    }));
  };
  
  // reset form data
  const resetListingForm = () => {
    setListingData({
      title: '',
      brand: '',
      image: null,
      price: '',
      stock: ''
    });
    setListingErrors({});
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // when the add listing modal is opened, reset the form
  const handleOpenAddModal = () => {
    resetListingForm();
    setShowAddListingModal(true);
  };
  
  // add new listing
  const addNewListing = async (e, formData = null) => {
    e.preventDefault();
    
    // use the submitted form data or current state
    const dataToSubmit = formData || listingData;

    // ensure the data is valid
    if (!dataToSubmit || typeof dataToSubmit !== 'object') {
      console.error('Invalid form data received:', dataToSubmit);
      setListingData(prev => ({
        ...prev,
        error: 'invalid form data'
      }));
      return;
    }
    
    // form validation
    const errors = {};
    
    // check the title field
    const title = dataToSubmit.title?.trim();
    if (!title) {
      errors.title = 'please enter the product title';
    }
    
    // check the brand field
    const brand = dataToSubmit.brand?.trim();
    if (!brand) {
      errors.brand = 'please enter the brand';
    }
    
    // check the image field - allow null
    const image = dataToSubmit.image || null;
    
    // check the price field
    const price = parseFloat(dataToSubmit.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'the price must be greater than 0';
    }
    
    // check the stock field
    const stock = parseInt(dataToSubmit.stock);
    if (isNaN(stock) || stock < 0) {
      errors.stock = 'the stock cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      setListingData(prev => ({
        ...prev,
        error: Object.values(errors)[0]
      }));
      return;
    }
    
    try {
      setLoading(true);
      
      // ensure all fields have values
      if (!title) {
        throw new Error('the title cannot be empty');
      }
      if (!brand) {
        throw new Error('the brand cannot be empty');
      }
      if (!price || price <= 0) {
        throw new Error('the price must be greater than 0');
      }
      if (!stock || stock < 0) {
        throw new Error('the stock cannot be negative');
      }
      
      // Process image upload
      let imagePath = '';
      
      if (image instanceof File) {
        try {
          // Image compression
          const options = {
            maxSizeMB: 1, // Compress to under 1MB
            maxWidthOrHeight: 1920, // Maximum width or height of 1920 pixels
            useWebWorker: true,
            fileType: 'image/jpeg',
          };

          // Compress image
          const compressedFile = await imageCompression(image, options);

          // Convert file to base64 format
          const reader = new FileReader();
          const imageDataPromise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });
          
          const imageData = await imageDataPromise;
          
          // Call upload image API
          const response = await apiService.post('/user/profile/upload-image', { 
            image: imageData 
          });
          
          if (response.success && response.data) {
            imagePath = response.data;
          } else {
            throw new Error(response.message || 'Failed to upload image');
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          throw new Error('Failed to upload image: ' + (imageError.message || 'unknown error'));
        }
      }
      
      // Prepare data for submission
      const phoneData = {
        title,
        brand,
        price,
        stock,
        image: imagePath
      };

      const response = await apiService.post('/user/profile/listings', phoneData);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Listing has been added successfully',
          timer: 1500,
          showConfirmButton: false
        });
        
        // close modal and refresh list
        setShowAddListingModal(false);
        fetchUserListings();
        
        // reset form
        resetListingForm();
      } else {
        throw new Error(response.message || 'Failed to add the product');
      }
    } catch (error) {
      console.error('Failed to add the product:', error);
      setListingData(prev => ({
        ...prev,
        error: error.message || 'Failed to add the product, please try again'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // toggle phone status (enable/disable)
  const togglePhoneStatus = async (phoneId) => {
    try {
      setLoading(true);
      const response = await apiService.put(`/user/profile/listings/${phoneId}/status`);
      
      if (response.success) {
        const itemToUpdate = listings.find(item => item._id === phoneId);
        
        // update local state, change disabled field instead of status field
        const updatedListings = listings.map(item => {
          if (item._id === phoneId) {
            // if the disabled field already exists, remove it, otherwise add it
            if ('disabled' in item) {
              const { disabled, ...rest } = item;
              return rest;
            } else {
              return { ...item, disabled: true };
            }
          }
          return item;
        });

        // set the updated listings to state
        setListings(updatedListings);
        
        // get the updated item
        const updatedItem = updatedListings.find(item => item._id === phoneId);
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.message || 'Listing status has been updated',
          timer: 1500,
          showConfirmButton: false
        });
        
        return updatedItem;
      }
      
      return null;
    } catch (error) {
      console.error('Error toggling phone status:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // delete listing
  const deletePhoneListing = async (phoneId) => {
    // confirm dialog
    const result = await Swal.fire({
      title: 'Confirm delete',
      text: 'Are you sure you want to delete this listing? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        setLoading(true);
        const response = await apiService.delete(`/user/profile/listings/${phoneId}`);
        
        if (response.success) {
          // remove from list
          setListings(listings.filter(item => item._id !== phoneId));
          
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Listing has been deleted successfully',
            timer: 1500,
            showConfirmButton: false
          });
          
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error deleting phone listing:', error);
        return false;
      } finally {
        setLoading(false);
      }
    }

    return false;
  };
  
  // toggle comment visibility
  const toggleCommentVisibility = async (phoneId, reviewId) => {
    try {
      if (!phoneId || !reviewId) {
        console.error('Missing required parameters for toggleCommentVisibility');
        return;
      }

      // Get the latest comment data
      await fetchUserComments();
      
      // Get the latest comment list
      const phone = comments.find(p => p._id === phoneId);
      if (!phone) {
        console.error('Phone not found');
        return;
      }

      // Find the comment
      const review = phone.reviews.find(r => r._id === reviewId);
      if (!review) {
        console.error('Comment not found in latest data');
        console.error('Available review IDs:', phone.reviews.map(r => r._id));
        return;
      }

      // Determine the current status based on the hidden field
      const isHidden = review.hidden === "";
      const actionText = isHidden ? 'show' : 'hide';

      // Confirm dialog
      const result = await Swal.fire({
        title: `Confirm ${actionText}`,
        text: `Are you sure you want to ${actionText} this comment?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${actionText} it`,
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) {
        return;
      }

      // Set loading state after confirmation
      setLoading(true);
      
      const response = await apiService.put(
        '/user/profile/comments/visibility',
        {
          phoneId,
          reviewerId: review.reviewer._id,
          comment: review.comment,
          hide: !isHidden // If the current status is hidden, then show; if the current status is visible, then hide
        }
      );
      
      if (response.success) {
        // Get the latest data after successful operation
        await fetchUserComments();
        
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: `The comment has been ${actionText}ed successfully`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error(response.message || 'Failed to toggle comment visibility');
      }
    } catch (error) {
      console.error('Failed to toggle comment visibility:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        requestData: error.config?.data,
        comments: comments
      });
      
      // Determine appropriate error message
      let errorMessage = 'Please try again later';
      if (error.response?.status === 404) {
        errorMessage = 'The comment does not exist or has been deleted';
      } else if (error.response?.data?.message === 'REVIEW_NOT_FOUND') {
        errorMessage = 'The comment does not exist or has been deleted';
      } else if (error.response?.data?.message === 'PHONE_NOT_FOUND') {
        errorMessage = 'The phone information does not exist or has been deleted';
      } else if (error.response?.data?.message === 'UNAUTHORIZED') {
        errorMessage = 'You do not have permission to perform this operation';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };
  
  // navigate to home
  const navigateToHome = () => {
    // before leaving the page, reset the tab to editProfile, so that the next time it enters, it will display editProfile
    sessionStorage.setItem('profileActiveTab', 'editProfile');
    navigate('/');
  };
  
  // handle logout
  const handleLogout = async () => {
    try {
      // before leaving the page, reset the tab to editProfile, so that the next time it enters, it will display editProfile
      sessionStorage.setItem('profileActiveTab', 'editProfile');
      
      // show logout confirmation dialog
      const logoutSuccess = await logout();
      
      // if the user cancels the logout, do nothing
      if (!logoutSuccess) {
        return;
      }
      
      // navigate to the home page after successful logout
      navigate('/');
    } catch (error) {
      console.error('failed to signout:', error);
      Swal.fire({
        icon: 'error',
        title: 'Logout Failed',
        text: 'Please try again later'
      });
    }
  };
  
  return {
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
    setShowAddListingModal: handleOpenAddModal,
    addNewListing,
    togglePhoneStatus,
    deletePhoneListing,
    handleImageUpload,
    imagePreview,
    clearImagePreview,
    
    // View Comments
    comments,
    commentsLoading,
    toggleCommentVisibility,
    
    // Navigation
    navigateToHome,
    handleLogout
  };
};

export default useProfileViewModel; 