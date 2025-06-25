// implements the business logic and state management for the UserManagement component
import {useState, useEffect, useCallback, useMemo} from 'react';
import {message} from 'antd';
import apiService from '../service/ApiService';
import SwalService from '../service/SwalService';
import useBaseManagementViewModel from './BaseManagementViewModel';

const useUserManagementViewModel = () => {
    // use common states and methods from base view model
    const base = useBaseManagementViewModel();
    
    // user-specific states
    const [statusFilter, setStatusFilter] = useState('');
    
    // rename base items to users to maintain API compatibility
    const users = base.items;
    const setUsers = base.setItems;
    
    // extend base handleReset method to include status filter reset
    const handleReset = useCallback(() => {
        // call base reset method
        base.handleReset();
        // reset status filter
        setStatusFilter('');
    }, [base.handleReset]);

    // fetch users with pagination, search and filtering
    const fetchUsers = useCallback(async () => {
        try {
            base.setLoading(true);
            // call backend API with all parameters
            const queryParams = {
                page: base.pagination.pageIndex + 1, // convert to 1-based for backend
                limit: base.pagination.pageSize,
                search: base.debouncedSearchTerm,
                status: statusFilter
            };

            const response = await apiService.get('/admin/users', queryParams);

            if (response.success) {
                // update state with response data
                setUsers(response.data.users);
                base.setTotalCount(response.data.pagination.total);
                base.setTotalPages(response.data.pagination.totalPages);
            } else {
                message.error(response.message || 'Failed to fetch users');
            }
        } catch (error) {
            // error already handled by apiService
        } finally {
            base.setLoading(false);
        }
    }, [base.pagination.pageIndex, base.pagination.pageSize, base.debouncedSearchTerm, statusFilter, base.setLoading, base.setTotalCount, base.setTotalPages, setUsers]);

    // load users when dependencies change
    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    // render status badges with appropriate colors
    const statusRenderer = useCallback((status) => {
        let variant;
        switch (status) {
            case 'active':
                variant = 'success';
                break;
            case 'inactive':
                variant = 'secondary';
                break;
            case 'pending':
                variant = 'warning';
                break;
            default:
                variant = 'primary';
        }

        return variant;
    }, []);

    // delete user operation
    const handleDeleteUser = useCallback(async (userId) => {
        try {
            const result = await SwalService.deleteConfirm(
                'Are you sure you want to delete this user? This action cannot be undone.',
                'Delete User'
            );

            if (result.isConfirmed) {
                base.setLoading(true);
                const response = await apiService.delete(`/admin/user/${userId}`);

                if (response.success) {
                    message.success('User deleted successfully');
                    await fetchUsers();
                }
            }
        } catch (error) {
            message.error(error.message || 'Failed to delete user');
        } finally {
            base.setLoading(false);
        }
    }, [fetchUsers, base.setLoading]);

    // toggle user status (activate/deactivate)
    const handleToggleUserStatus = useCallback(async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const actionText = currentStatus === 'active' ? 'deactivate' : 'activate';

        try {
            const result = await SwalService.confirm({
                title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`,
                text: `Are you sure you want to ${actionText} this user?`,
                icon: 'question',
                confirmButtonText: `Yes, ${actionText}!`,
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                base.setLoading(true);
                const response = await apiService.put(`/admin/user/${userId}`, {
                    status: newStatus
                });

                if (response.success) {
                    message.success(`User has been ${actionText}d successfully`);
                    await fetchUsers();
                }
            }
        } catch (error) {
            message.error(error.message || `Failed to ${actionText} user`);
        } finally {
            base.setLoading(false);
        }
    }, [fetchUsers, base.setLoading]);

    // prepare to edit user
    const handleEditUser = useCallback((userId) => {
        const userToEdit = users.find(user => user._id === userId);
        if (userToEdit) {
            base.setSelectedItem(userToEdit);
            base.setShowEditForm(true);
        }
    }, [users, base.setSelectedItem, base.setShowEditForm]);

    // handle user actions (single entry point for various user operations)
    const handleUserAction = useCallback(async (action, userId, userStatus) => {
        try {
            switch (action) {
                case 'view':
                    // TODO: implement view user details
                    break;

                case 'edit':
                    handleEditUser(userId);
                    break;

                case 'toggleStatus':
                    await handleToggleUserStatus(userId, userStatus);
                    break;

                case 'delete':
                    await handleDeleteUser(userId);
                    break;

                default:
                    break;
            }
        } catch (error) {
            // errors handled in specific methods
        }
    }, [handleDeleteUser, handleEditUser, handleToggleUserStatus]);

    // update user data
    const handleUserUpdate = useCallback(async (updatedFields) => {
        if (!base.selectedItem) return;

        try {
            base.setLoading(true);
            const response = await apiService.put(`/admin/user/${base.selectedItem._id}`, updatedFields);

            if (response.success) {
                base.setShowEditForm(false);
                base.setSelectedItem(null);
                message.success('User updated successfully');
                await fetchUsers();
            }
        } catch (error) {
            message.error(error.message || 'Failed to update user');
        } finally {
            base.setLoading(false);
        }
    }, [base.selectedItem, fetchUsers, base.setLoading, base.setShowEditForm, base.setSelectedItem]);

    // handle status filter button click
    const handleStatusFilter = useCallback((status) => {
        setStatusFilter(status === 'all' ? '' : status);
        // reset to first page when filter changes
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);

    return {
        // states inherited from base model
        users,
        totalCount: base.totalCount,
        loading: base.loading,
        searchTerm: base.searchTerm,
        pagination: base.pagination,
        showEditForm: base.showEditForm,
        selectedUser: base.selectedItem,
        
        // specialized states
        statusFilter,

        // specialized methods
        handleUserAction,
        handleUserUpdate,
        handleCancelEdit: base.handleCancelEdit,
        handleStatusFilter,
        handleSearchChange: base.handleSearchChange,
        statusRenderer,
        setSearchTerm: base.setSearchTerm,
        setPagination: base.setPagination,
        handleReset
    };
};

export default useUserManagementViewModel;