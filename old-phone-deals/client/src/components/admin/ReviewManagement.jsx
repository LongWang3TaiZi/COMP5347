import React, { useRef, useState, useEffect } from 'react';
import {
    Layout, Card, Tag, Input, Button, Rate,
    Row, Col, Table, Space, Tooltip, Typography, Empty, Select
} from 'antd';
import {
    SearchOutlined, EyeOutlined, EyeInvisibleOutlined,
    ReloadOutlined, CloseCircleOutlined, FilterFilled
} from '@ant-design/icons';
import useReviewManagementViewModel from '../../viewModels/ReviewManagementViewModel';

const { Title, Text } = Typography;

const ReviewManagement = () => {
    // sort state for client-side sorting
    const [sortedInfo, setSortedInfo] = useState({});
    // store locally sorted data to prevent duplication
    const [sortedData, setSortedData] = useState([]);

    // use the view model to get state and methods
    const {
        reviews,
        totalCount,
        loading,
        searchTerm,
        pagination,
        fetchReviews,
        toggleReviewVisibility,
        isReviewHidden,
        handleSearchChange,
        setSearchTerm,
        setPagination,
        brandFilter,
        hiddenFilter, 
        availableBrands,
        handleBrandFilter,
        handleHiddenFilter,
        handleResetFilters
    } = useReviewManagementViewModel();

    // update sorted data when reviews change or sort info changes
    useEffect(() => {
        setSortedData(getSortedData(reviews, sortedInfo));
    }, [reviews, sortedInfo]);

    // add table ref to programmatically control the table
    const tableRef = useRef();

    // handler to reset search and pagination
    const handleReset = () => {
        // reset search
        setSearchTerm('');

        // reset filters
        handleResetFilters();

        // reset sorting
        setSortedInfo({});

        // reset pagination to first page
        setPagination(prev => ({
            ...prev,
            pageIndex: 0
        }));

        // force table to clear its internal sort state
        if (tableRef.current) {
            tableRef.current.clearFilters();
            tableRef.current.clearSorters();
        }
    };

    // handle clearing search term
    const handleClearSearch = () => {
        setSearchTerm('');
        // reset to first page when search is cleared
        setPagination(prev => ({...prev, pageIndex: 0}));
    };

    // render filter section
    const renderFilterSection = () => {
        return (
            <Row gutter={16} style={{ marginBottom: '16px' }}>
                {/* Brand 过滤器 */}
                <Col xs={24} md={12} style={{marginBottom: '16px'}}>
                    <Space>
                        <span><FilterFilled/> Brand:</span>
                        <Select
                            style={{width: '100%', minWidth: 200}}
                            value={brandFilter || ''}
                            onChange={handleBrandFilter}
                            placeholder="All Brands"
                            options={[
                                {value: '', label: 'All Brands'},
                                ...availableBrands.map(brand => ({value: brand, label: brand}))
                            ]}
                        />
                    </Space>
                </Col>

                <Col xs={24} md={12}>
                    <Space>
                        <span><FilterFilled/> Comment Status:</span>
                        <Space.Compact>
                            <Button
                                type={!hiddenFilter ? 'primary' : 'default'}
                                onClick={() => handleHiddenFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={hiddenFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    color: hiddenFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: hiddenFilter === 'false' ? '#52c41a' : undefined,
                                    borderColor: hiddenFilter === 'false' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleHiddenFilter('false')}
                            >
                                Visible
                            </Button>
                            <Button
                                type={hiddenFilter === 'true' ? 'primary' : 'default'}
                                style={{
                                    color: hiddenFilter === 'true' ? '#fff' : undefined,
                                    backgroundColor: hiddenFilter === 'true' ? '#faad14' : undefined,
                                    borderColor: hiddenFilter === 'true' ? '#faad14' : undefined
                                }}
                                onClick={() => handleHiddenFilter('true')}
                            >
                                Hidden
                            </Button>
                        </Space.Compact>
                    </Space>
                </Col>
            </Row>
        );
    };

    // get sorted data based on current sort state - pure function without side effects
    const getSortedData = (data, sorterInfo) => {
        if (!data || !data.length || !sorterInfo.columnKey) {
            return data || [];
        }

        return [...data].sort((a, b) => {
            const { columnKey, order } = sorterInfo;
            
            switch (columnKey) {
                case 'phoneTitle':
                    return order === 'ascend' 
                        ? a.phoneTitle.localeCompare(b.phoneTitle)
                        : b.phoneTitle.localeCompare(a.phoneTitle);
                case 'rating':
                    const ratingA = a.review && a.review.rating ? a.review.rating : 0;
                    const ratingB = b.review && b.review.rating ? b.review.rating : 0;
                    return order === 'ascend' ? ratingA - ratingB : ratingB - ratingA;
                case 'comment':
                    const commentA = a.review && a.review.comment ? a.review.comment : '';
                    const commentB = b.review && b.review.comment ? b.review.comment : '';
                    return order === 'ascend'
                        ? commentA.localeCompare(commentB)
                        : commentB.localeCompare(commentA);
                case 'reviewer':
                    const reviewerA = a.review && a.review.reviewer 
                        ? `${a.review.reviewer.firstname} ${a.review.reviewer.lastname}` 
                        : 'Anonymous';
                    const reviewerB = b.review && b.review.reviewer 
                        ? `${b.review.reviewer.firstname} ${b.review.reviewer.lastname}` 
                        : 'Anonymous';
                    return order === 'ascend'
                        ? reviewerA.localeCompare(reviewerB)
                        : reviewerB.localeCompare(reviewerA);
                default:
                    return 0;
            }
        });
    };

    // generate a unique key for each row
    const generateRowKey = (record, index) => {
        // use combination of record ID and index to ensure uniqueness
        return `${record._id || 'unknown'}-${record.review?._id || 'no-review'}-${index}`;
    };

    // prepare column definitions for Ant Design Table
    const columns = [
        {
            title: 'Phone',
            dataIndex: 'phoneTitle',
            key: 'phoneTitle',
            width: 300,
            ellipsis: {
                showTitle: false,
            },
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'phoneTitle' && sortedInfo.order,
            render: (text) => (
                <Tooltip placement="topLeft" title={text}>
                    <div style={{ 
                        maxWidth: '300px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
            width: 120
        },
        {
            title: 'Rating',
            key: 'rating',
            width: 120,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'rating' && sortedInfo.order,
            render: (_, record) => (
                record.review && record.review.rating ? (
                    <Rate disabled defaultValue={record.review.rating} />
                ) : 'N/A'
            ),
        },
        {
            title: 'Comment',
            key: 'comment',
            width: 400,
            ellipsis: {
                showTitle: false,
            },
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'comment' && sortedInfo.order,
            render: (_, record) => {
                const comment = record.review && record.review.comment 
                    ? record.review.comment 
                    : 'No comment';

                const isHidden = isReviewHidden(record);
                
                return (
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Tooltip placement="topLeft" title={comment}>
                            <div style={{ 
                                maxWidth: '400px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {isHidden ? (
                                    <Text type="secondary" italic>
                                        <Tag color="red">Hidden</Tag> {comment}
                                    </Text>
                                ) : (
                                    comment
                                )}
                            </div>
                        </Tooltip>
                    </Space>
                );
            },
        },
        {
            title: 'Reviewer',
            key: 'reviewer',
            width: 150,
            sorter: true,
            sortOrder: sortedInfo.columnKey === 'reviewer' && sortedInfo.order,
            render: (_, record) => {
                if (record.review && record.review.reviewer) {
                    const { firstname, lastname } = record.review.reviewer;
                    return `${firstname} ${lastname}`;
                }
                return 'Anonymous';
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => {
                const isHidden = isReviewHidden(record);
                
                return (
                    <Space>
                        <Tooltip title={isHidden ? "Show Comment" : "Hide Comment"}>
                            <Button
                                type={isHidden ? "primary" : "default"}
                                icon={isHidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => toggleReviewVisibility(record, isHidden)}
                                size="small"
                            />
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    // handle onChange event from Ant Design Table
    const handleTableChange = (newPagination, filters, sorter) => {
        // handle pagination change
        setPagination({
            pageIndex: newPagination.current - 1, // convert from 1-based to 0-based
            pageSize: newPagination.pageSize
        });
        
        // update sorting information
        setSortedInfo(sorter);
    };

    return (
        <Layout.Content style={{padding: '0 16px'}}>
            <Card>
                <Space direction="vertical" size="middle" style={{width: '100%'}}>
                    {/* header with search and reset button */}
                    <Row gutter={16} align="middle">
                        <Col xs={24} md={8} style={{marginBottom: '16px'}}>
                            <Space>
                                <Title level={4} style={{margin: 0}}>Reviews List</Title>
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={handleReset}
                                    title="Reset search and pagination"
                                    icon={<ReloadOutlined />}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                        <Col xs={24} md={16}>
                            <Input
                                placeholder="Search reviews by phone title, brand, or comment..."
                                value={searchTerm || ''}
                                onChange={handleSearchChange}
                                prefix={<SearchOutlined />}
                                suffix={
                                    searchTerm ? (
                                        <CloseCircleOutlined
                                            style={{cursor: 'pointer'}}
                                            onClick={handleClearSearch}
                                        />
                                    ) : null
                                }
                            />
                        </Col>
                    </Row>

                    {renderFilterSection()}

                    {/* reviews table */}
                    <Table
                        ref={tableRef}
                        columns={columns}
                        dataSource={sortedData}
                        rowKey={generateRowKey}
                        loading={loading}
                        locale={{
                            emptyText: loading 
                                ? 'Loading...' 
                                : searchTerm 
                                    ? <Empty description={`No reviews matching "${searchTerm}"`} /> 
                                    : <Empty description="No reviews data" />
                        }}
                        pagination={{
                            current: pagination.pageIndex + 1, // convert 0-based to 1-based
                            pageSize: pagination.pageSize,
                            total: totalCount,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '25', '50'],
                            showTotal: (total, range) => 
                                searchTerm 
                                    ? `${range[0]}-${range[1]} of ${total} matching reviews` 
                                    : `${range[0]}-${range[1]} of ${total} reviews`,
                        }}
                        onChange={handleTableChange}
                        scroll={{x: '100%', y: 600}}
                        sticky={{offsetHeader: 0}}
                    />
                </Space>
            </Card>
        </Layout.Content>
    );
};

export default ReviewManagement; 