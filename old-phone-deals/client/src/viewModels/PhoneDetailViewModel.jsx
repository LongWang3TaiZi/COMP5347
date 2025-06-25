import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../service/ApiService';
import SwalService from '../service/SwalService';

/**
 * view model for phone detail page that handles data fetching and business logic
 * @param {string} phoneId - the id of the phone to fetch
 * @returns {Object} state and methods for the phone detail page
 */
const usePhoneDetailViewModel = (phoneId) => {
    // state management
    const [phone, setPhone] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleReviews, setVisibleReviews] = useState(3);
    const [expandedComments, setExpandedComments] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [cartQuantity, setCartQuantity] = useState(0);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const navigate = useNavigate();
    const { user } = useAuth();

    // fetch phone data when phoneId changes
    useEffect(() => {
        if (phoneId) {
            fetchPhoneDetail(phoneId);
        }
    }, [phoneId]);

    // fetch cart quantity when user or phoneId changes
    useEffect(() => {
        if (user && phoneId) {
            fetchCartQuantity();
        }
    }, [user, phoneId]);

    /**
     * Fetch cart quantity for the current phone
     */
    const fetchCartQuantity = async () => {
        try {
            const response = await apiService.get(`/user/${user._id}/cart`);
            const cart = response.data.cart;
            const cartItem = cart.items.find(item => item.phone._id === phoneId);
            setCartQuantity(cartItem ? cartItem.quantity : 0);
        } catch (err) {
            console.error('Error fetching cart quantity:', err);
            setCartQuantity(0);
        }
    };

    /**
     * fetch phone detail data from API
     * @param {string} id - phone id
     */
    const fetchPhoneDetail = async (id) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:7777/api/phone/${id}`);
            setPhone(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching phone detail:', err);
            setError('Failed to load phone details. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * handle showing more reviews
     */
    const handleShowMoreReviews = () => {
        if (phone && phone.reviews) {
            setVisibleReviews(prev => Math.min(prev + 3, phone.reviews.length));
        }
    };

    /**
     * toggle expansion of a comment
     * @param {string} reviewId - the id of the review to toggle
     */
    const toggleCommentExpansion = (reviewId) => {
        setExpandedComments(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }));
    };

    /**
     * handle toggling review visibility using API
     * @param {string} phoneId - id of the phone
     * @param {string} reviewId - id of the review to toggle
     */
    const toggleReviewVisibility = async (phoneId, reviewId) => {
        try {
            if (!user) {
                SwalService.error('Authentication required to perform this action');
                return;
            }

            // Find the current review
            const review = phone.reviews.find(r => r._id === reviewId);
            if (!review) {
                SwalService.error('Review not found in the current context');
                return;
            }
            
            // Check if the user has permission to modify the review visibility
            const isReviewer = user._id === review.reviewer?._id;
            const isSeller = user._id === phone.seller?._id;
            
            if (!isReviewer && !isSeller) {
                SwalService.error('Insufficient permissions to modify this review');
                return;
            }
            
            // Determine if the review is currently hidden
            const isHidden = 'hidden' in review;
            
            // Confirm dialog
            const result = await SwalService.confirm({
                title: isHidden ? 'Make Review Visible' : 'Hide Review',
                text: isHidden ? 'Are you sure you want to make this review visible to all users?' : 'Are you sure you want to hide this review from general view?',
                confirmButtonText: isHidden ? 'Make Visible' : 'Hide Review',
                cancelButtonText: 'Cancel'
            });
            
            if (!result.isConfirmed) {
                return;
            }
            
            // Set loading state after confirmation
            setLoading(true);
            
            // Prepare request data for API
            const requestData = {
                phoneId: phoneId,
                reviewerId: review.reviewer._id,
                comment: review.comment,
                hide: !isHidden // If currently hidden, set hide to false; if not hidden, set hide to true
            };

            // Call API to toggle visibility
            const response = await apiService.put('/user/profile/comments/visibility', requestData);
            
            if (response.success) {
                // Update local state
                setPhone(prev => ({
                    ...prev,
                    reviews: prev.reviews.map(r => {
                        if (r._id === reviewId) {
                            // If we're hiding the review, add the hidden property
                            // If we're showing the review, remove the hidden property
                            if (!isHidden) {
                                return { ...r, hidden: '' };
                            } else {
                                const { hidden, ...rest } = r;
                                return rest;
                            }
                        }
                        return r;
                    })
                }));
                
                // Show success message
                SwalService.success(isHidden ? 'Review is now visible to all users' : 'Review has been hidden successfully');
            } else {
                throw new Error(response.message || 'Failed to update review visibility status');
            }
        } catch (error) {
            console.error('Error toggling review visibility:', error);
            SwalService.error(error.message || 'Operation failed. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * handle adding phone to cart
     */
    const handleAddToCart = () => {
        if (!user) {
            SwalService.error('Please login to add items to cart');
            const redirectPath = window.location.pathname + window.location.search;
            sessionStorage.setItem('redirectAfterLogin', redirectPath);
            localStorage.setItem('redirectAfterEmailVerification', redirectPath);
            navigate('/auth', { replace: true });
            return;
        }
        setShowQuantityModal(true);
    };

    /**
     * confirm adding to cart with selected quantity
     */
    const confirmAddToCart = async () => {
        if (quantity > 0 && phone && user) {
            try {
                const response = await apiService.put(`/user/${user._id}/cart/${phoneId}`, {
                    quantity: quantity
                });
                
                // Update cart quantity after successful addition
                const cartItem = response.data.cart.items.find(item => item.phone._id === phoneId);
                setCartQuantity(cartItem ? cartItem.quantity : 0);
                
                setShowQuantityModal(false);
                setQuantity(1);
                SwalService.success('Item added to cart successfully');
            } catch (err) {
                console.error('Error adding to cart:', err);
                SwalService.error('Failed to add item to cart. Please try again later.');
            }
        }
    };

    /**
     * handle adding phone to wishlist
     */
    const handleAddToWishlist = async () => {
        if (!user) {
            SwalService.error('Please log in to add items to your wish list');
            return;
        }
        if (phone) {
            try {
                const response = await apiService.post(`/user/${user._id}/wishlist/${phoneId}`);
                if (response.success) {
                    SwalService.success('Added to Wishlist!');
                } else {
                    SwalService.error(response.message || 'Failed to add, please try again later');
                }
            } catch (err) {
                console.error('Error adding to wishlist:', err);
                if (err.response?.status === 409) {
                    SwalService.info('This item is already in your wish list!');
                } else {
                    SwalService.error('Failed to add, please try again later');
                }
            }
        }
    };

    /**
     * handle submitting a new review
     * @param {Event} e - form submit event
     */
    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!user) {
            SwalService.error('please login to submit a review');
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/auth', { replace: true });
            return;
        }

        try {
            setLoading(true);
            
           
            const response = await apiService.post(`/phone/${phoneId}/reviews`, {
                rating: newReview.rating,
                comment: newReview.comment
            });

            if (response.success) {
               
                const newReviewData = {
                    _id: response.data._id,
                    reviewer: {
                        _id: user._id,
                        firstname: user.firstname,
                        lastname: user.lastname
                    },
                    rating: newReview.rating,
                    comment: newReview.comment,
                    createdAt: new Date().toISOString()
                };

                setPhone(prev => ({
                    ...prev,
                    reviews: [newReviewData, ...prev.reviews]
                }));

                setNewReview({ rating: 5, comment: '' });
                
                SwalService.success('comment submitted successfully');
            } else {
                throw new Error(response.message || 'comment submission failed');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            SwalService.error(error.message || 'comment submission failed');
        } finally {
            setLoading(false);
        }
    };

    /**
     * navigate back to previous page
     */
    const handleBack = () => {
        navigate(-1);
    };

    // return state and methods
    return {
        phone,
        loading,
        error,
        visibleReviews,
        expandedComments,
        quantity,
        showQuantityModal,
        cartQuantity,
        newReview,
        handleShowMoreReviews,
        toggleCommentExpansion,
        toggleReviewVisibility,
        handleAddToCart,
        confirmAddToCart,
        handleAddToWishlist,
        handleSubmitReview,
        handleBack,
        setQuantity,
        setShowQuantityModal,
        setNewReview
    };
};

export default usePhoneDetailViewModel;