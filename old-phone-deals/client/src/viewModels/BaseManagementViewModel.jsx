import { useState, useEffect, useCallback } from 'react';

const useBaseManagementViewModel = () => {
    // data states
    const [items, setItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // search states
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // pagination states
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // edit states
    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // debounce search input to reduce API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // handle search term change
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
        // reset to first page when search changes
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, []);

    // handle page size change
    const handlePageSizeChange = useCallback((e) => {
        const newPageSize = Number(e.target.value);
        setPagination(prev => ({
            pageIndex: 0, // reset to first page when changing page size
            pageSize: newPageSize
        }));
    }, []);

    // cancel edit operation
    const handleCancelEdit = useCallback(() => {
        setShowEditForm(false);
        setSelectedItem(null);
    }, []);

    // reset search and pagination (to be extended by specific implementations)
    const handleReset = useCallback(() => {
        // reset search
        setSearchTerm('');
        // reset to first page
        setPagination(prev => ({
            ...prev,
            pageIndex: 0
        }));
    }, []);

    return {
        // states
        items,
        setItems,
        totalCount,
        setTotalCount,
        totalPages,
        setTotalPages,
        loading,
        setLoading,
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        pagination,
        setPagination,
        showEditForm,
        setShowEditForm,
        selectedItem,
        setSelectedItem,
        
        // methods
        handleSearchChange,
        handlePageSizeChange,
        handleCancelEdit,
        handleReset
    };
};

export default useBaseManagementViewModel; 