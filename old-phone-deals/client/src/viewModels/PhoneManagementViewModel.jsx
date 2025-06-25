// implements the business logic and state management for the PhoneManagement component
import {useState, useEffect, useCallback, useMemo} from 'react';
import apiService from '../service/ApiService';
import SwalService from '../service/SwalService';
import useBaseManagementViewModel from './BaseManagementViewModel';

const usePhoneManagementViewModel = () => {
    // use common states and methods from base view model
    const base = useBaseManagementViewModel();
    
    // phone-specific states
    const [brandFilter, setBrandFilter] = useState('');
    const [disabledFilter, setDisabledFilter] = useState('');
    const [inStockFilter, setInStockFilter] = useState('');
    const [availableBrands, setAvailableBrands] = useState([]);
    
    // rename base items to phones to maintain API compatibility
    const phones = base.items;
    const setPhones = base.setItems;
    
    // extend base handleReset method to include phone-specific filter resets
    const handleReset = useCallback(() => {
        // call base reset method
        base.handleReset();
        // reset filters
        handleDisabledFilter('all');
        handleInStockFilter('all');
        handleBrandFilter('');
    }, [base.handleReset]);

    // fetch all available brands for filter dropdown
    const fetchBrands = useCallback(async () => {
        try {
            base.setLoading(true);
            const response = await apiService.get('/admin/phones/brands');
            if (response.success && response.data.brands) {
                setAvailableBrands(response.data.brands);
            }
        } catch (error) {
            // error already handled by apiService
        } finally {
            base.setLoading(false);
        }
    }, [base.setLoading]);

    // fetch phones with pagination, search and filtering
    const fetchPhones = useCallback(async () => {
        try {
            base.setLoading(true);

            // build query parameters
            const queryParams = {
                page: base.pagination.pageIndex + 1, // convert to 1-based for backend
                limit: base.pagination.pageSize,
                search: base.debouncedSearchTerm,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            };

            // add filters if they are set
            if (brandFilter) {
                queryParams.brand = brandFilter;
            }

            if (disabledFilter !== '') {
                queryParams.disabled = disabledFilter;
            }

            if (inStockFilter !== '') {
                queryParams.inStock = inStockFilter;
            }

            // call backend API with all parameters
            const response = await apiService.get('/admin/phones', queryParams);

            if (response.success) {
                // update state with response data
                setPhones(response.data.phones);
                base.setTotalCount(response.data.pagination.total);
                base.setTotalPages(response.data.pagination.totalPages);
            } else {
                await SwalService.error(response.message || 'Failed to fetch phones');
            }
        } catch (error) {
            // error already handled by apiService
        } finally {
            base.setLoading(false);
        }
    }, [base.pagination.pageIndex, base.pagination.pageSize, base.debouncedSearchTerm, brandFilter, disabledFilter, inStockFilter, base.setLoading, base.setTotalCount, base.setTotalPages, setPhones]);

    // load phones and brands when component mounts and dependencies change
    useEffect(() => {
        void fetchPhones();
    }, [fetchPhones]);

    useEffect(() => {
        void fetchBrands();
    }, [fetchBrands]);

    // handle phone delete operation
    const handleDeletePhone = useCallback(async (phoneId) => {
        try {
            // Display confirmation dialog using SwalService
            const result = await SwalService.confirm({
                title: 'Confirm Delete',
                text: 'Are you sure you want to delete this phone? This action cannot be undone.',
                icon: 'warning',
                confirmButtonText: 'Yes, delete',
                cancelButtonText: 'Cancel'
            });
            
            // If user confirmed, proceed with deletion
            if (result.isConfirmed) {
                base.setLoading(true);
                const response = await apiService.delete(`/admin/phones/${phoneId}`);
                
                if (response.success) {
                    await SwalService.success('Phone deleted successfully');
                    // Refresh the phones list
                    await fetchPhones();
                } else {
                    await SwalService.error(response.message || 'Failed to delete phone');
                }
            }
        } catch (error) {
            // Error already handled by apiService
        } finally {
            base.setLoading(false);
        }
    }, [fetchPhones, base.setLoading]);

    // toggle phone disabled status
    const handleToggleDisabledStatus = useCallback(async (phoneId, currentDisabled) => {
        try {
            // Determine action text based on current status
            const actionText = currentDisabled ? 'Enable' : 'Disable';
            
            // Display confirmation dialog
            const result = await SwalService.confirm({
                title: `Confirm ${actionText}`,
                text: `Are you sure you want to ${actionText} this phone?`,
                icon: 'warning',
                confirmButtonText: `Yes, ${actionText}`,
                cancelButtonText: 'Cancel'
            });
            
            // If user confirmed, proceed with toggling status
            if (result.isConfirmed) {
                base.setLoading(true);
                
                // If currently disabled, we want to enable it (set disabled to false)
                // If currently enabled, we want to disable it (set disabled to true)
                const toggledStatus = !currentDisabled;
                
                const response = await apiService.put(`/admin/phones/${phoneId}`, {
                    disabled: toggledStatus
                });
                
                if (response.success) {
                    await SwalService.success(`${actionText} phone successfully`);
                    // Refresh the phones list
                    await fetchPhones();
                } else {
                    await SwalService.error(response.message || `${actionText} phone failed`);
                }
            }
        } catch (error) {
            // Error already handled by apiService
        } finally {
            base.setLoading(false);
        }
    }, [fetchPhones, base.setLoading]);

    // prepare to edit phone
    const handleEditPhone = useCallback((phoneId) => {
        // Find the phone to edit
        const phoneToEdit = phones.find(p => p._id === phoneId);
        if (phoneToEdit) {
            base.setSelectedItem(phoneToEdit);
        } else {
            SwalService.error('Phone not found');
        }
    }, [phones, base.setSelectedItem]);

    // handle phone actions (single entry point for various phone operations)
    const handlePhoneAction = useCallback(async (action, phoneId, phoneDisabled = false) => {
        try {
            switch (action) {
                case 'view':
                    // View is handled by PhoneDetails component
                    break;

                case 'edit':
                    handleEditPhone(phoneId);
                    break;

                case 'toggleDisabled':
                    await handleToggleDisabledStatus(phoneId, phoneDisabled);
                    break;

                case 'delete':
                    await handleDeletePhone(phoneId);
                    break;

                default:
                    break;
            }
        } catch (error) {
            // errors handled in specific methods
        }
    }, [handleDeletePhone, handleEditPhone, handleToggleDisabledStatus]);

    // update phone data
    const handlePhoneUpdate = useCallback(async (phoneId, updatedFields) => {
        try {
            base.setLoading(true);
            
            const response = await apiService.put(`/admin/phones/update/${phoneId}`, updatedFields);
            
            if (response.success) {
                await SwalService.success('Phone updated successfully');
                // Refresh the phones list
                await fetchPhones();
                return true;
            } else {
                await SwalService.error(response.message || 'Failed to update phone');
                return false;
            }
        } catch (error) {
            // Error already handled by apiService
            return false;
        } finally {
            base.setLoading(false);
        }
    }, [fetchPhones, base.setLoading]);

    // handle disabled filter button click
    const handleDisabledFilter = useCallback((disabled) => {
        setDisabledFilter(disabled === 'all' ? '' : disabled);
        // reset to first page when filter changes
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);

    // handle brand filter change
    const handleBrandFilter = useCallback((brand) => {
        setBrandFilter(brand === 'all' ? '' : brand);
        // reset to first page when filter changes
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);

    // handle inStock filter change
    const handleInStockFilter = useCallback((inStock) => {
        setInStockFilter(inStock === 'all' ? '' : inStock);
        // reset to first page when filter changes
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);

    // helper for rendering disabled status with appropriate style
    const disabledStatusRenderer = useCallback((disabled) => {
        return disabled ? 'error' : 'success';
    }, []);

    // helper for rendering stock status with appropriate style
    const stockStatusRenderer = useCallback((stock) => {
        return stock > 0 ? 'success' : 'warning';
    }, []);

    return {
        // states inherited from base model
        phones,
        totalCount: base.totalCount,
        loading: base.loading,
        searchTerm: base.searchTerm,
        pagination: base.pagination,
        showEditForm: base.showEditForm,
        selectedPhone: base.selectedItem,
        
        // specialized states
        brandFilter,
        disabledFilter,
        inStockFilter,
        availableBrands,

        // specialized methods
        handlePhoneAction,
        handlePhoneUpdate,
        handleDisabledFilter,
        handleBrandFilter,
        handleInStockFilter,
        handleSearchChange: base.handleSearchChange,
        stockStatusRenderer,
        setSearchTerm: base.setSearchTerm,
        setPagination: base.setPagination,
        handleReset,
        fetchPhones
    };
};

export default usePhoneManagementViewModel;