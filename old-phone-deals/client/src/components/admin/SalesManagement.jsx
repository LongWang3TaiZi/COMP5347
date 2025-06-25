import React, { useState } from 'react';
import {
    Layout, Card, Table, Space,
    Row, Col, Button, Typography, DatePicker, Form, 
    Select, Divider, Tooltip
} from 'antd';
import { ReloadOutlined, SearchOutlined, DownloadOutlined, TableOutlined } from '@ant-design/icons';
import useSalesManagementViewModel from '../../viewModels/SalesManagementViewModel';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesManagement = () => {
    // local state for export loading
    const [exportLoading, setExportLoading] = useState(false);
    const [exportCurrentLoading, setExportCurrentLoading] = useState(false);
    
    // use the view model to get state and methods
    const {
        orders,
        totalCount,
        loading,
        pagination,
        sortField,
        sortOrder,
        dateRange,
        exportFormat,
        setPagination,
        handleSortChange,
        formatDate,
        formatOrderItems,
        handleDateRangeChange,
        clearDateRange,
        handleExportFormatChange,
        exportData
    } = useSalesManagementViewModel();

    const [form] = Form.useForm();

    // handler to reset sorting, pagination and filters
    const handleReset = () => {
        // reset form fields
        form.resetFields();
        
        // reset date range
        clearDateRange();
        
        // reset sorting to default
        handleSortChange('createdAt', 'desc');
        
        // reset pagination to first page
        setPagination(prev => ({
            ...prev,
            pageIndex: 0
        }));
    };
    
    // handle date range search
    const handleDateSearch = (values) => {
        const { dateRange } = values;
        if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');
            handleDateRangeChange(startDate, endDate);
        } else {
            clearDateRange();
        }
    };
    
    // handle export with loading state
    const handleExport = async () => {
        try {
            setExportLoading(true);
            await exportData();
        } finally {
            setExportLoading(false);
        }
    };
    
    // function to export current table data
    const handleExportCurrentPage = async () => {
        try {
            setExportCurrentLoading(true);
            
            // process current page data
            const currentData = orders.map(order => {
                // prepare buyer name
                const buyerName = order.user ? 
                    `${order.user.firstname} ${order.user.lastname}` : 
                    'Unknown';
                
                // prepare items purchased text
                const itemsText = order.items?.map(item => {
                    const brand = item.phone?.brand || '';
                    const title = item.phone?.title || 'Unknown phone';
                    const price = item.price;
                    const quantity = item.quantity;
                    return `${brand} - ${title} (${quantity} x $${price})`;
                }).join(', ') || 'No items';
                
                // create a structured export object
                return {
                    'Timestamp': formatDate(order.createdAt),
                    'Buyer name': buyerName,
                    'Items purchased and quantities': itemsText,
                    'Total amount': Number(order.totalAmount).toFixed(2)
                };
            });
            
            // get current date for filename
            const currentDate = new Date();
            const formattedDate = formatDate(currentDate);
            const filename = `current_sales_${formattedDate}`;
            
            if (exportFormat === 'csv') {
                // convert to CSV
                const header = Object.keys(currentData[0]).join(',');
                const csv = [
                    header,
                    ...currentData.map(row => 
                        Object.values(row).map(value => 
                            // escape quotes and wrap in quotes
                            `"${String(value).replace(/"/g, '""')}"`
                        ).join(',')
                    )
                ].join('\n');
                
                // create blob and download
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                saveAs(blob, `${filename}.csv`);
            } else {
                // for JSON format
                const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
                saveAs(blob, `${filename}.json`);
            }
        } catch (error) {
            console.error('Export current page error:', error);
        } finally {
            setExportCurrentLoading(false);
        }
    };

    // prepare column definitions for Ant Design Table
    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            defaultSortOrder: 'descend',
            render: (text) => formatDate(text)
        },
        {
            title: 'Buyer Name',
            dataIndex: 'user',
            key: 'user',
            width: 150,
            render: (user) => user ? `${user.firstname} ${user.lastname}` : 'Unknown'
        },
        {
            title: 'Items Purchased',
            dataIndex: 'items',
            key: 'items',
            render: (items) => <div className="items-list">{formatOrderItems(items)}</div>,
            ellipsis: false,
            width: 400
        },
        {
            title: 'Total Amount',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 120,
            render: (totalAmount) => `$${Number(totalAmount).toFixed(2)}`,
        }
    ];

    // handle onChange event from Ant Design Table
    const handleTableChange = (pagination, _, sorter) => {
        // update pagination
        setPagination({
            pageIndex: pagination.current - 1, // convert from 1-based to 0-based
            pageSize: pagination.pageSize
        });
        
        // update sorting if changed
        if (sorter && sorter.field) {
            const order = sorter.order === 'ascend' ? 'asc' : 
                          sorter.order === 'descend' ? 'desc' : 'desc';
            
            handleSortChange(
                sorter.field,
                order
            );
        }
    };

    return (
        <Layout.Content style={{padding: '0 16px'}}>
            <Card>
                <Space direction="vertical" size="middle" style={{width: '100%'}}>
                    {/* header with title and reset button */}
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} sm={12} md={8} lg={8}>
                            <Space>
                                <Title level={4} style={{margin: 0}}>Sales History</Title>
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={handleReset}
                                    title="Reset sorting, pagination and filters"
                                    icon={<ReloadOutlined />}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                        
                        {/* export controls */}
                        <Col xs={24} sm={12} md={16} lg={16}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <Select
                                    value={exportFormat}
                                    onChange={handleExportFormatChange}
                                    style={{ width: 120, minWidth: 120 }}
                                >
                                    <Option value="csv">CSV Format</Option>
                                    <Option value="json">JSON Format</Option>
                                </Select>
                                
                                <Tooltip title="Export all sales data">
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={handleExport}
                                        loading={exportLoading}
                                        disabled={loading || exportCurrentLoading}
                                    >
                                        Export All
                                    </Button>
                                </Tooltip>
                                
                                <Tooltip title="Export current page data">
                                    <Button
                                        type="default"
                                        icon={<TableOutlined />}
                                        onClick={handleExportCurrentPage}
                                        loading={exportCurrentLoading}
                                        disabled={loading || exportLoading || orders.length === 0}
                                    >
                                        Export Current Page
                                    </Button>
                                </Tooltip>
                            </div>
                        </Col>
                        
                        {/* date range filter - moved to a separate row */}
                        <Col xs={24}>
                            <Form 
                                form={form}
                                layout="inline" 
                                onFinish={handleDateSearch}
                                initialValues={{
                                    dateRange: dateRange ? [
                                        dateRange.startDate ? dayjs(dateRange.startDate) : null,
                                        dateRange.endDate ? dayjs(dateRange.endDate) : null
                                    ] : null
                                }}
                                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                            >
                                <Form.Item 
                                    name="dateRange" 
                                    label="Date Range"
                                    style={{ marginBottom: '8px', flex: '1 1 300px', minWidth: '260px' }}
                                >
                                    <RangePicker 
                                        style={{ width: '100%' }}
                                        format="YYYY-MM-DD"
                                        allowClear={true}
                                    />
                                </Form.Item>
                                <Form.Item style={{ marginBottom: '8px' }}>
                                    <Button 
                                        type="primary" 
                                        htmlType="submit" 
                                        icon={<SearchOutlined />}
                                    >
                                        Search
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    {/* orders table */}
                    <Table
                        columns={columns}
                        dataSource={orders}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            current: pagination.pageIndex + 1, // convert 0-based to 1-based
                            pageSize: pagination.pageSize,
                            total: totalCount,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '25', '50'],
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                        }}
                        onChange={handleTableChange}
                        scroll={{x: '100%', y: 600}}
                        sticky={{offsetHeader: 0}}
                    />
                </Space>
            </Card>

            <style jsx="true">{`
                .items-list {
                    white-space: pre-line;
                }
            `}</style>
        </Layout.Content>
    );
};

export default SalesManagement; 