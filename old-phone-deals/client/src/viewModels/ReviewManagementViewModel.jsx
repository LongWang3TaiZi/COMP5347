// implements the business logic and state management for the ReviewManagement component
import { useState, useEffect, useCallback } from 'react';
import apiService from '../service/ApiService';
import SwalService from '../service/SwalService';
import useBaseManagementViewModel from './BaseManagementViewModel';

const useReviewManagementViewModel = () => {
    // use common states and methods from base view model
    const base = useBaseManagementViewModel();
    
    // rename base items to reviews to maintain API compatibility
    const reviews = base.items;
    const setReviews = base.setItems;
    
    const [brandFilter, setBrandFilter] = useState('');
    const [hiddenFilter, setHiddenFilter] = useState('');
    const [availableBrands, setAvailableBrands] = useState([]);
    
    const [hasLoaded, setHasLoaded] = useState(false);
    
    // fetch reviews with pagination, search and filtering
    const fetchReviews = useCallback(async () => {
        try {
            base.setLoading(true);

            setReviews([]);

            // build query parameters
            const queryParams = {
                page: base.pagination.pageIndex + 1, // convert to 1-based for backend
                limit: base.pagination.pageSize
            };
            
            if (brandFilter) {
                queryParams.brand = brandFilter;
            }
            
            if (hiddenFilter !== '') {
                queryParams.hidden = hiddenFilter;
            }
            
            // Add search term if it exists
            if (base.debouncedSearchTerm) {
                queryParams.search = base.debouncedSearchTerm;
            }

            // determine which endpoint to use based on whether there's a search term
            const endpoint = base.debouncedSearchTerm 
                ? '/admin/reviews/search' 
                : '/admin/reviews';

            // call backend API with all parameters
            const response = await apiService.get(endpoint, queryParams);

            if (response.success) {
                if (!response.data || !Array.isArray(response.data.reviews)) {
                    setReviews([]);
                } else {
                    setReviews(response.data.reviews);
                }
                
                if (response.data && response.data.pagination) {
                    base.setTotalCount(response.data.pagination.total || 0);
                    base.setTotalPages(response.data.pagination.totalPages || 0);
                } else if (response.data) {
                    // handle the direct response format from search endpoint
                    base.setTotalCount(response.data.total || 0);
                    base.setTotalPages(response.data.totalPages || 0);
                }
                
                setHasLoaded(true);
            } else {
                await SwalService.error(response.message || 'Failed to fetch reviews');
                setReviews([]);
            }
        } catch (error) {
            // error already handled by apiService
            setReviews([]);
        } finally {
            base.setLoading(false);
        }
    }, [base.pagination.pageIndex, base.pagination.pageSize, base.debouncedSearchTerm, brandFilter, hiddenFilter, base.setLoading, base.setTotalCount, base.setTotalPages, setReviews]);
    
    const fetchBrands = useCallback(async () => {
        try {
            const response = await apiService.get('/admin/phones/brands');
            if (response.success && response.data.brands) {
                setAvailableBrands(response.data.brands);
            }
        } catch (error) {
        }
    }, []);

    // load reviews when component mounts and dependencies change
    useEffect(() => {
        fetchReviews();
    }, [base.pagination.pageIndex, base.pagination.pageSize, base.debouncedSearchTerm, brandFilter, hiddenFilter, fetchReviews]);
    
    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);
    
    // handle brand filter change
    const handleBrandFilter = useCallback((brand) => {
        setBrandFilter(brand === 'all' ? '' : brand);
        // reset to first page
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);
    
    // handle hidden filter change
    const handleHiddenFilter = useCallback((hidden) => {
        setHiddenFilter(hidden === 'all' ? '' : hidden);
        // reset to first page
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);
    
    const handleResetFilters = useCallback(() => {
        setBrandFilter('');
        setHiddenFilter('');
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);

    // toggle review visibility (show/hide)
    const toggleReviewVisibility = useCallback(async (record, isHidden) => {
        try {
            const actionText = isHidden ? 'Show' : 'Hide';
            const result = await SwalService.confirm({
                title: `Confirm ${actionText} Review`,
                text: `Are you sure you want to ${actionText.toLowerCase()} this review?`,
                icon: 'warning',
                confirmButtonText: `Yes, ${actionText.toLowerCase()} it`,
                cancelButtonText: 'Cancel'
            });
            
            if (!result.isConfirmed) {
                return false;
            }
            
            // Set loading state after confirmation
            base.setLoading(true);
            
            // Extract required parameters from record
            const phoneId = record._id;
            const reviewerId = record.review?.reviewer?._id || null;
            const comment = record.review?.comment || '';
            

            // Call API endpoint
            const response = await apiService.put(`/admin/reviews/hide-show`, {
                phoneId,
                reviewerId,
                comment,
                hide: !isHidden // Flip current state
            });
            
            if (response.success) {
                await SwalService.success(`Review ${actionText.toLowerCase()}n successfully`);
                await fetchReviews();
                return true;
            }
            
            console.error('Review visibility update failed:', response);
            await SwalService.error(response.message || `Failed to ${actionText.toLowerCase()} review`);
            return false;
            
        } catch (error) {
            // Error already handled by apiService
            console.error('Review visibility toggle error:', error);
            return false;
        } finally {
            base.setLoading(false);
        }
    }, [fetchReviews, base.setLoading]);

    // check if a review is hidden
    const isReviewHidden = useCallback((record) => {
        return record.review && 'hidden' in record.review;
    }, []);

    return {
        // states inherited from base model
        reviews,
        totalCount: base.totalCount,
        loading: base.loading,
        searchTerm: base.searchTerm,
        pagination: base.pagination,
        hasLoaded,
        brandFilter,
        hiddenFilter, 
        availableBrands,
        
        // specialized methods
        fetchReviews,
        toggleReviewVisibility,
        isReviewHidden,
        handleSearchChange: base.handleSearchChange,
        setSearchTerm: base.setSearchTerm,
        setPagination: base.setPagination,
        handleBrandFilter,
        handleHiddenFilter,
        handleResetFilters
    };
};

export default useReviewManagementViewModel; 