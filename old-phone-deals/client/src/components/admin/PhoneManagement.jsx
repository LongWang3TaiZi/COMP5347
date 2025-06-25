import React, {useRef, useState, useEffect} from 'react';
import {
    Layout, Card, Tag, Input, Dropdown, Button,
    Row, Col, Table, Space, Select
} from 'antd';
import {
    SearchOutlined, EditOutlined, CheckOutlined, StopOutlined,
    MoreOutlined, FilterFilled, DeleteOutlined, 
    EyeOutlined, UndoOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import usePhoneManagementViewModel from '../../viewModels/PhoneManagementViewModel';
import PhoneDetails from './PhoneDetails';
import EditPhone from './EditPhone';


const PhoneManagement = () => {
    // responsive state for screen size
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    // Phone details modal state
    const [phoneDetailsVisible, setPhoneDetailsVisible] = useState(false);
    const [selectedPhoneId, setSelectedPhoneId] = useState(null);
    
    // Phone edit modal state
    const [editPhoneVisible, setEditPhoneVisible] = useState(false);
    const [selectedPhone, setSelectedPhone] = useState(null);

    // use the view model to get state and methods
    const {
        phones,
        totalCount,
        loading,
        searchTerm,
        brandFilter,
        disabledFilter,
        inStockFilter,
        pagination,
        availableBrands,
        handlePhoneAction,
        handleDisabledFilter,
        handleBrandFilter,
        handleInStockFilter,
        handleSearchChange,
        stockStatusRenderer,
        setSearchTerm,
        setPagination,
        fetchPhones
    } = usePhoneManagementViewModel();

    // detect screen size for responsive design
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 576);
            setIsTablet(window.innerWidth >= 576 && window.innerWidth < 992);
        };

        // initial check
        checkScreenSize();

        // add event listener for window resize
        window.addEventListener('resize', checkScreenSize);

        // cleanup event listener
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const tableRef = useRef();

    // handler to reset all filters, search, and sorting
    const handleReset = () => {
        // reset search
        setSearchTerm('');

        // reset filters
        handleDisabledFilter('all');
        handleInStockFilter('all');
        handleBrandFilter('');

        // reset sorting - need a different approach with Ant Design
        // table state is handled by the Table component
        if (tableRef.current) {
            tableRef.current.clearFilters();
        }

        // optionally reset pagination to first page
        setPagination(prev => ({
            ...prev,
            pageIndex: 0
        }));
    };

    // check if phone is disabled - if 'disabled' field exists in the phone object
    const isPhoneDisabled = (phone) => {
        return 'disabled' in phone;
    };
    
    // Custom handler for phone actions that wraps the view model's handler
    const handlePhoneActionWithDetails = (action, phoneId, disabled = false) => {
        if (action === 'view') {
            setSelectedPhoneId(phoneId);
            setPhoneDetailsVisible(true);
        } else if (action === 'edit') {
            // Find the selected phone from the phones array
            const phoneToEdit = phones.find(phone => phone._id === phoneId);
            if (phoneToEdit) {
                setSelectedPhone(phoneToEdit);
                setEditPhoneVisible(true);
            }
        } else {
            handlePhoneAction(action, phoneId, disabled);
        }
    };

    // prepare column definitions for Ant Design Table
    const antdColumns = [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            width: 80,
            render: (text, record) => {
                const imageUrl = `http://localhost:7777${record.image}`;
                return (
                    <div style={{width: '70%', height: '70%'}}>
                        <img
                            src={imageUrl}
                            alt={record.title || 'Phone'}
                            style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            width: 320,
            ellipsis: true,
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <div style={{
                    width: '100%',
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: '1.3',
                }}>
                    {record.title}
                </div>
            ),
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
            width: 100,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'disabled',
            key: 'disabled',
            width: 80,
            render: (_, record) => {
                const isDisabled = isPhoneDisabled(record);
                return <Tag color={isDisabled ? 'error' : 'success'}>
                    {isDisabled ? 'Disabled' : 'Enabled'}
                </Tag>;
            },
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
            width: 80,
            sorter: (a, b) => (a.stock || 0) - (b.stock || 0),
            render: (stock) => {
                stock = stock || 0;
                return <Tag color={stockStatusRenderer(stock)}>{stock}</Tag>;
            },
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 80,
            sorter: (a, b) => (a.price || 0) - (b.price || 0),
            render: (price) => `$${price?.toFixed(2) || '0.00'}`,
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 80,
            fixed: 'right',
            render: (_, record) => {
                const phoneDisabled = isPhoneDisabled(record);
                let statusToggleText, statusIcon, statusDisabled = false;
                statusToggleText = 'Disable Phone';
                    statusIcon = <StopOutlined/>;
                if (phoneDisabled) {
                    statusDisabled = true;
                } 

                const items = [
                    {
                        key: 'view',
                        icon: <EyeOutlined/>,
                        label: 'View',
                        onClick: () => handlePhoneActionWithDetails('view', record._id)
                    },
                    {
                        key: 'edit',
                        icon: <EditOutlined/>,
                        label: 'Edit',
                        onClick: () => handlePhoneActionWithDetails('edit', record._id)
                    },
                    {
                        key: 'toggleDisabled',
                        icon: statusIcon,
                        label: statusToggleText,
                        disabled: statusDisabled,
                        onClick: () => handlePhoneActionWithDetails('toggleDisabled', record._id, phoneDisabled)
                    },
                    {
                        type: 'divider'
                    },
                    {
                        key: 'delete',
                        icon: <DeleteOutlined/>,
                        label: 'Delete',
                        danger: true,
                        onClick: () => handlePhoneActionWithDetails('delete', record._id)
                    }
                ];

                return (
                    <Dropdown menu={{items}} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined/>}/>
                    </Dropdown>
                );
            },
        },
    ];

    // handle onChange event from Ant Design Table
    const handleTableChange = (pagination) => {
        // Update pagination
        setPagination({
            pageIndex: pagination.current - 1, // convert from 1-based to 0-based
            pageSize: pagination.pageSize
        });
    };

    // render filter section with responsive layout
    const renderFilterSection = () => {
        // for mobile, stack all filters
        if (isMobile) {
            return (
                <Space direction="vertical" style={{width: '100%', marginBottom: '16px'}}>
                    {/* Status filter */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Status:</span>
                        </div>
                        <Space.Compact style={{width: '100%'}}>
                            <Button
                                type={!disabledFilter ? 'primary' : 'default'}
                                style={{flex: 1, justifyContent: 'center'}}
                                onClick={() => handleDisabledFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={disabledFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    color: disabledFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: disabledFilter === 'false' ? '#52c41a' : undefined,
                                    borderColor: disabledFilter === 'false' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleDisabledFilter('false')}
                            >
                                Enabled
                            </Button>
                            <Button
                                type={disabledFilter === 'true' ? 'primary' : 'default'}
                                danger={disabledFilter === 'true'}
                                style={{flex: 1, justifyContent: 'center'}}
                                onClick={() => handleDisabledFilter('true')}
                            >
                                Disabled
                            </Button>
                        </Space.Compact>
                    </div>

                    {/* Stock filter */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Stock:</span>
                        </div>
                        <Space.Compact style={{width: '100%'}}>
                            <Button
                                type={!inStockFilter ? 'primary' : 'default'}
                                style={{flex: 1, justifyContent: 'center'}}
                                onClick={() => handleInStockFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={inStockFilter === 'true' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    color: inStockFilter === 'true' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'true' ? '#52c41a' : undefined,
                                    borderColor: inStockFilter === 'true' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleInStockFilter('true')}
                            >
                                In Stock
                            </Button>
                            <Button
                                type={inStockFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    color: inStockFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'false' ? '#faad14' : undefined,
                                    borderColor: inStockFilter === 'false' ? '#faad14' : undefined
                                }}
                                onClick={() => handleInStockFilter('false')}
                            >
                                Out
                            </Button>
                        </Space.Compact>
                    </div>

                    {/* Brand filter */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Brand:</span>
                        </div>
                        <Select
                            style={{width: '100%'}}
                            value={brandFilter || ''}
                            onChange={handleBrandFilter}
                            placeholder="All Brands"
                            options={[
                                {value: '', label: 'All Brands'},
                                ...availableBrands.map(brand => ({value: brand, label: brand}))
                            ]}
                        />
                    </div>
                </Space>
            );
        }
        
        if (isTablet) {
            return (
                <Space direction="vertical" style={{width: '100%', marginBottom: '16px'}}>
                    {/* Status filter - full width row */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Status:</span>
                        </div>
                        <Space.Compact style={{width: '100%'}}>
                            <Button
                                type={!disabledFilter ? 'primary' : 'default'}
                                style={{flex: 1}}
                                onClick={() => handleDisabledFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={disabledFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    color: disabledFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: disabledFilter === 'false' ? '#52c41a' : undefined,
                                    borderColor: disabledFilter === 'false' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleDisabledFilter('false')}
                            >
                                Enabled
                            </Button>
                            <Button
                                type={disabledFilter === 'true' ? 'primary' : 'default'}
                                danger={disabledFilter === 'true'}
                                style={{flex: 1}}
                                onClick={() => handleDisabledFilter('true')}
                            >
                                Disabled
                            </Button>
                        </Space.Compact>
                    </div>

                    {/* Stock filter - full width row */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Stock:</span>
                        </div>
                        <Space.Compact style={{width: '100%'}}>
                            <Button
                                type={!inStockFilter ? 'primary' : 'default'}
                                style={{flex: 1}}
                                onClick={() => handleInStockFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={inStockFilter === 'true' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    color: inStockFilter === 'true' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'true' ? '#52c41a' : undefined,
                                    borderColor: inStockFilter === 'true' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleInStockFilter('true')}
                            >
                                In Stock
                            </Button>
                            <Button
                                type={inStockFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    flex: 1,
                                    color: inStockFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'false' ? '#faad14' : undefined,
                                    borderColor: inStockFilter === 'false' ? '#faad14' : undefined
                                }}
                                onClick={() => handleInStockFilter('false')}
                            >
                                Out
                            </Button>
                        </Space.Compact>
                    </div>

                    {/* Brand filter - full width */}
                    <div>
                        <div style={{marginBottom: '8px'}}>
                            <FilterFilled/> <span>Brand:</span>
                        </div>
                        <Select
                            style={{width: '100%'}}
                            value={brandFilter || ''}
                            onChange={handleBrandFilter}
                            placeholder="All Brands"
                            options={[
                                {value: '', label: 'All Brands'},
                                ...availableBrands.map(brand => ({value: brand, label: brand}))
                            ]}
                        />
                    </div>
                </Space>
            );
        }
        
        // for desktop, use the regular 3-column layout
        return (
            <Row gutter={16}>
                {/* Status filter */}
                <Col xs={24} md={8} style={{marginBottom: 16}}>
                    <Space>
                        <span><FilterFilled/> Status:</span>
                        <Space.Compact>
                            <Button
                                type={!disabledFilter ? 'primary' : 'default'}
                                onClick={() => handleDisabledFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={disabledFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    color: disabledFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: disabledFilter === 'false' ? '#52c41a' : undefined,
                                    borderColor: disabledFilter === 'false' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleDisabledFilter('false')}
                            >
                                Enabled
                            </Button>
                            <Button
                                type={disabledFilter === 'true' ? 'primary' : 'default'}
                                danger={disabledFilter === 'true'}
                                onClick={() => handleDisabledFilter('true')}
                            >
                                Disabled
                            </Button>
                        </Space.Compact>
                    </Space>
                </Col>

                {/* Stock filter */}
                <Col xs={24} md={8} style={{marginBottom: 16}}>
                    <Space>
                        <span><FilterFilled/> Stock:</span>
                        <Space.Compact>
                            <Button
                                type={!inStockFilter ? 'primary' : 'default'}
                                onClick={() => handleInStockFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                type={inStockFilter === 'true' ? 'primary' : 'default'}
                                style={{
                                    color: inStockFilter === 'true' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'true' ? '#52c41a' : undefined,
                                    borderColor: inStockFilter === 'true' ? '#52c41a' : undefined
                                }}
                                onClick={() => handleInStockFilter('true')}
                            >
                                In Stock
                            </Button>
                            <Button
                                type={inStockFilter === 'false' ? 'primary' : 'default'}
                                style={{
                                    color: inStockFilter === 'false' ? '#fff' : undefined,
                                    backgroundColor: inStockFilter === 'false' ? '#faad14' : undefined,
                                    borderColor: inStockFilter === 'false' ? '#faad14' : undefined
                                }}
                                onClick={() => handleInStockFilter('false')}
                            >
                                Out of Stock
                            </Button>
                        </Space.Compact>
                    </Space>
                </Col>

                {/* Brand filter */}
                <Col xs={24} md={8}>
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
            </Row>
        );
    };

    // Handle successful phone update
    const handlePhoneUpdateSuccess = () => {
        // Directly fetch phones to refresh the list
        fetchPhones();
    };

    return (
        <Layout.Content style={{padding: '0 16px'}}>
            <Card>
                <Space direction="vertical" size="middle" style={{width: '100%'}}>
                    {/* header with search and reset button */}
                    <Row gutter={16} align="middle">
                        <Col xs={24} md={8} style={{marginBottom: isMobile ? '16px' : '0'}}>
                            <Space>
                                <h5 style={{margin: 0}}>Phones List</h5>
                                <Button
                                    type="default"
                                    size="small"
                                    onClick={handleReset}
                                    title="Reset all filters and sorting"
                                    icon={<UndoOutlined/>}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                        <Col xs={24} md={16}>
                            <Input
                                placeholder="Search phones by title or brand..."
                                value={searchTerm || ''}
                                onChange={handleSearchChange}
                                prefix={<SearchOutlined/>}
                                suffix={
                                    searchTerm ? (
                                        <CloseCircleOutlined
                                            style={{cursor: 'pointer'}}
                                            onClick={() => setSearchTerm('')}
                                        />
                                    ) : null
                                }
                            />
                        </Col>
                    </Row>

                    {/* filter section - responsive */}
                    {renderFilterSection()}

                    {/* phones table */}
                    <Table
                        ref={tableRef}
                        columns={antdColumns}
                        dataSource={phones}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            current: pagination.pageIndex + 1, // convert 0-based to 1-based
                            pageSize: pagination.pageSize,
                            total: totalCount,
                            showSizeChanger: true,
                            pageSizeOptions: ['5', '10', '25', '50'],
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} phones`,
                        }}
                        onChange={handleTableChange}
                        scroll={{x: '100%', y: 600}}
                        sticky={{offsetHeader: 0}}
                        size={isMobile ? "small" : "middle"}
                    />
                </Space>
            </Card>
            
            {/* Phone Details Modal */}
            <PhoneDetails 
                phoneId={selectedPhoneId}
                visible={phoneDetailsVisible}
                onClose={() => setPhoneDetailsVisible(false)}
            />
            
            {/* Edit Phone Modal */}
            <EditPhone
                phone={selectedPhone}
                visible={editPhoneVisible}
                onClose={() => setEditPhoneVisible(false)}
                onSuccess={handlePhoneUpdateSuccess}
            />
        </Layout.Content>
    );
};

export default PhoneManagement;