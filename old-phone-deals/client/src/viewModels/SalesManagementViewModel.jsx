// implements the business logic and state management for the SalesManagement component
import { useState, useEffect, useCallback } from 'react';
import apiService from '../service/ApiService';
import SwalService from '../service/SwalService';
import useBaseManagementViewModel from './BaseManagementViewModel';
import dayjs from 'dayjs';

const useSalesManagementViewModel = () => {
    // use common states and methods from base view model
    const base = useBaseManagementViewModel();
    
    // sales-specific states
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [dateRange, setDateRange] = useState(null);
    const [exportFormat, setExportFormat] = useState('csv');
    
    // rename base items to orders to maintain API compatibility
    const orders = base.items;
    const setOrders = base.setItems;
    
    // fetch orders with pagination and sorting
    const fetchOrders = useCallback(async () => {
        try {
            base.setLoading(true);

            // build query parameters
            const queryParams = {
                page: base.pagination.pageIndex + 1, // convert to 1-based for backend
                limit: base.pagination.pageSize,
                sortBy: sortField,
                order: sortOrder
            };
            
            // add date range filter parameters if they exist
            if (dateRange) {
                if (dateRange.startDate) {
                    queryParams.startDate = dateRange.startDate;
                }
                
                if (dateRange.endDate) {
                    queryParams.endDate = dateRange.endDate;
                }
            }

            // call backend API with parameters
            const response = await apiService.get('/admin/orders', queryParams);

            if (response.success) {
                // update state with response data
                setOrders(response.data.orders);
                base.setTotalCount(response.data.pagination.totalItems);
                base.setTotalPages(response.data.pagination.totalPages);
            } else {
                await SwalService.error(response.message || 'Failed to fetch orders');
            }
        } catch (error) {
            // error already handled by apiService
            console.error('Error fetching orders:', error);
        } finally {
            base.setLoading(false);
        }
    }, [base.pagination.pageIndex, base.pagination.pageSize, sortField, sortOrder, dateRange, base.setLoading, base.setTotalCount, base.setTotalPages, setOrders]);

    // load orders when component mounts and dependencies change
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // handle sorting change
    const handleSortChange = useCallback((field, order) => {
        setSortField(field);
        setSortOrder(order);
    }, []);

    // handle date formatting
    const formatDate = useCallback((dateString) => {
        return dayjs(dateString).format('YYYY-MM-DD');
    }, []);
    
    // handle date range change
    const handleDateRangeChange = useCallback((startDate, endDate) => {
        setDateRange({ startDate, endDate });
        // reset to first page when filter changes
        base.setPagination(prev => ({...prev, pageIndex: 0}));
    }, [base.setPagination]);
    
    // clear date range filter
    const clearDateRange = useCallback(() => {
        setDateRange(null);
    }, []);

    // get formatted items string with better separation between items
    const formatOrderItems = useCallback((items) => {
        if (!items || !items.length) return 'No items';
        
        return items.map(item => {
            const brand = item.phone?.brand || '';
            const title = item.phone?.title || 'Unknown phone';
            const price = item.price;
            const quantity = item.quantity;
            
            return `${brand} - ${title}\nPrice: $${price} × Quantity: ${quantity}`;
        }).join('\n\n');
    }, []);
    
    // handle export format change
    const handleExportFormatChange = useCallback((format) => {
        setExportFormat(format);
    }, []);
    
    // handle data export
    const exportData = useCallback(async () => {
        try {
            // confirm export with user first
            const result = await SwalService.confirm({
                title: 'Export Data',
                text: 'Are you sure you want to export all sales data?',
                icon: 'question',
                confirmButtonText: 'Yes, export it',
                cancelButtonText: 'Cancel'
            });
            
            if (!result.isConfirmed) {
                return;
            }
            
            base.setLoading(true);
            
            try {
                // get current date for filename
                const currentDate = new Date();
                const formattedDate = formatDate(currentDate);
                
                // use apiService's downloadFile method - specify full path without 'admin' prefix
                // our backend endpoint is '/orders/export'
                const response = await apiService.downloadFile(
                    'orders/export', 
                    { format: exportFormat }, 
                    { 
                        filename: `sales_report_${formattedDate}`,
                        format: exportFormat,
                        showErrors: true
                    }
                );
                
                await SwalService.success('Export completed successfully');
                return response;
            } catch (error) {
                console.error('Export error:', error);
                await SwalService.error(`Export failed: ${error.message}`);
            }
        } catch (error) {
            console.error('Export confirmation error:', error);
        } finally {
            base.setLoading(false);
        }
    }, [exportFormat, base.setLoading, formatDate]);

    return {
        // states inherited from base model
        orders,
        totalCount: base.totalCount,
        loading: base.loading,
        pagination: base.pagination,
        totalCount: base.totalCount,
        totalPages: base.totalPages,
        sortField,
        sortOrder,
        dateRange,
        exportFormat,

        // specialized methods
        fetchOrders,
        handleSortChange,
        formatDate,
        formatOrderItems,
        handleDateRangeChange,
        clearDateRange,
        handleExportFormatChange,
        exportData,
        setExportFormat,
        setPagination: base.setPagination
    };
};

export default useSalesManagementViewModel; 