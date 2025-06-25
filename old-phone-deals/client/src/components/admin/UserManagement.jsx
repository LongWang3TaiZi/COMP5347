import React, {useRef, useState, useEffect} from 'react';
import {
    Table, Input, Button, Space, Card, Tag, Dropdown,
    Typography, Row, Col, Select, Spin, Radio
} from 'antd';
import {
    SearchOutlined, ReloadOutlined, FilterFilled,
    UserOutlined, EditOutlined, CheckOutlined, StopOutlined,
    DeleteOutlined, MoreOutlined
} from '@ant-design/icons';
import EditUserForm from '../common/EditUserForm';
import UserDetails from './UserDetails';
import useUserManagementViewModel from '../../viewModels/UserManagementViewModel';
import dayjs from 'dayjs';

const {Title} = Typography;
const {Option} = Select;


const UserManagement = () => {
    // local sorting state (for client-side sorting)
    const [tableSorter, setTableSorter] = useState(null);
    // responsive state for screen size
    const [isMobile, setIsMobile] = useState(false);
    
    // User details modal state
    const [userDetailsVisible, setUserDetailsVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // use the view model to get state and methods
    const {
        users,
        totalCount,
        loading,
        searchTerm,
        statusFilter,
        pagination,
        showEditForm,
        selectedUser,
        handleUserAction,
        handleUserUpdate,
        handleCancelEdit,
        handleStatusFilter,
        handleSearchChange,
        statusRenderer,
        setSearchTerm,
        setPagination
    } = useUserManagementViewModel();

    // detect screen size for responsive design
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // initial check
        checkIsMobile();

        // add event listener for window resize
        window.addEventListener('resize', checkIsMobile);

        // cleanup event listener
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    // add table ref to programmatically control the table
    const tableRef = useRef();

    // handler to reset all filters, search, and sorting
    const handleReset = () => {
        // reset search
        setSearchTerm('');

        // reset filter
        handleStatusFilter('all');

        // reset sorting
        setTableSorter(null);

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
    
    // Custom handler for user actions that wraps the view model's handler
    const handleUserActionWithDetails = (action, userId, status = null) => {
        if (action === 'view') {
            setSelectedUserId(userId);
            setUserDetailsVisible(true);
        } else {
            handleUserAction(action, userId, status);
        }
    };

    // generate columns - we'll use the same columns for all screen sizes
    const getColumns = () => {
        // common columns for both mobile and desktop
        return [
            {
                title: 'First Name',
                dataIndex: 'firstname',
                key: 'firstname',
                sorter: (a, b) => a.firstname.localeCompare(b.firstname),
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Last Name',
                dataIndex: 'lastname',
                key: 'lastname',
                sorter: (a, b) => a.lastname.localeCompare(b.lastname),
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Full Name',
                key: 'fullName',
                render: (_, record) => `${record.firstname} ${record.lastname}`,
                sorter: (a, b) => {
                    const fullNameA = `${a.firstname} ${a.lastname}`;
                    const fullNameB = `${b.firstname} ${b.lastname}`;
                    return fullNameA.localeCompare(fullNameB);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
                sorter: (a, b) => a.email.localeCompare(b.email),
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Last Login Time',
                key: 'lastLoginTime',
                render: (_, record) => {
                    return record.lastLoginTime 
                        ? dayjs(record.lastLoginTime).format('YYYY-MM-DD HH:mm')
                        : 'N/A';
                },
                sorter: (a, b) => {
                    const lastLoginTimeA = a.lastLoginTime ? dayjs(a.lastLoginTime) : dayjs(0);
                    const lastLoginTimeB = b.lastLoginTime ? dayjs(b.lastLoginTime) : dayjs(0);
                    return lastLoginTimeA.diff(lastLoginTimeB);
                },
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                    const color = statusRenderer(status);
                    return <Tag color={color === 'success' ? 'green' :
                        color === 'warning' ? 'orange' :
                            color === 'secondary' ? 'default' : 'blue'}>
                        {status.toUpperCase()}
                    </Tag>;
                },
                sorter: (a, b) => a.status.localeCompare(b.status),
                sortDirections: ['ascend', 'descend'],
            },
            {
                title: 'Actions',
                key: 'actions',
                fixed: 'right',
                width: 80,
                render: (_, record) => {
                    const userStatus = record.status;
                    let statusText, statusIcon, isStatusDisabled;

                    if (userStatus === 'active') {
                        statusText = 'Deactivate User';
                        statusIcon = <StopOutlined/>;
                        isStatusDisabled = false;
                    } else if (userStatus === 'inactive') {
                        statusText = 'Activate User';
                        statusIcon = <CheckOutlined/>;
                        isStatusDisabled = false;
                    } else if (userStatus === 'pending') {
                        isStatusDisabled = true;
                    } else {
                        statusText = 'Change Status';
                        statusIcon = <StopOutlined/>;
                        isStatusDisabled = true;
                    }

                    // using Ant Design v5 items format to define menu items
                    const items = [
                        {
                            key: 'view',
                            icon: <UserOutlined/>,
                            label: 'View',
                            onClick: () => handleUserActionWithDetails('view', record._id)
                        },
                        {
                            key: 'edit',
                            icon: <EditOutlined/>,
                            label: 'Edit',
                            disabled: userStatus === 'inactive',
                            onClick: () => handleUserActionWithDetails('edit', record._id)
                        },
                        {
                            key: 'status',
                            icon: statusIcon,
                            label: statusText,
                            disabled: isStatusDisabled,
                            onClick: () => handleUserActionWithDetails('toggleStatus', record._id, userStatus)
                        },
                        {
                            type: 'divider'
                        },
                        {
                            key: 'delete',
                            icon: <DeleteOutlined/>,
                            label: 'Delete',
                            danger: true,
                            onClick: () => handleUserActionWithDetails('delete', record._id)
                        }
                    ];

                    return (
                        <Dropdown menu={{items}} trigger={['click']}>
                            <Button type="text" icon={<MoreOutlined/>}/>
                        </Dropdown>
                    );
                }
            }
        ];
    };

    // convert pagination for ant design table
    const antdPagination = {
        current: pagination.pageIndex + 1, // convert 0-based to 1-based
        pageSize: pagination.pageSize,
        total: totalCount,
        showSizeChanger: true,
        pageSizeOptions: ['10', '25', '50', '100'],
        showTotal: isMobile ? false : (total, range) => `${range[0]}-${range[1]} of ${total} users`,
        size: isMobile ? 'small' : 'default'
    };

    // handle table change (sorting, pagination)
    const handleTableChange = (pagination, filters, sorter) => {
        // update pagination
        setPagination({
            pageIndex: pagination.current - 1,
            pageSize: pagination.pageSize
        });

        setTableSorter(sorter);
    };

    // render status filter buttons/dropdown based on screen size with improved flex layout
    const renderStatusFilter = () => {
        if (isMobile) {
            return (
                <div style={{marginBottom: '16px'}}>
                    <div style={{marginBottom: '8px'}}>
                        <FilterFilled/> <span>Filter by status:</span>
                    </div>
                    <div className="filter-container" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%'
                    }}>
                        <Radio.Group
                            value={statusFilter || 'all'}
                            onChange={(e) => handleStatusFilter(e.target.value === 'all' ? 'all' : e.target.value)}
                            buttonStyle="solid"
                            size="small"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                width: '100%'
                            }}
                        >
                            {/* make each button adapt to available width */}
                            <Radio.Button
                                value="all"
                                style={{
                                    flex: '1 0 auto',
                                    textAlign: 'center',
                                    minWidth: '70px' // ensure minimum width
                                }}
                            >
                                All Users
                            </Radio.Button>
                            <Radio.Button
                                value="active"
                                style={{
                                    flex: '1 0 auto',
                                    textAlign: 'center',
                                    minWidth: '70px',
                                    ...(statusFilter === 'active' ? {
                                        backgroundColor: '#52c41a',
                                        borderColor: '#52c41a'
                                    } : {})
                                }}
                            >
                                Active
                            </Radio.Button>
                            <Radio.Button
                                value="pending"
                                style={{
                                    flex: '1 0 auto',
                                    textAlign: 'center',
                                    minWidth: '70px',
                                    ...(statusFilter === 'pending' ? {
                                        backgroundColor: '#faad14',
                                        borderColor: '#faad14'
                                    } : {})
                                }}
                            >
                                Pending
                            </Radio.Button>
                            <Radio.Button
                                value="inactive"
                                style={{
                                    flex: '1 0 auto',
                                    textAlign: 'center',
                                    minWidth: '70px',
                                    ...(statusFilter === 'inactive' ? {
                                        backgroundColor: '#ff4d4f',
                                        borderColor: '#ff4d4f'
                                    } : {})
                                }}
                            >
                                Inactive
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                </div>
            );
        } else {
            // desktop: use original button layout
            return (
                <Row className="mb-4">
                    <Col span={24}>
                        <Space>
                            <FilterFilled/>
                            <span>Filter:</span>
                            <Button
                                type={!statusFilter ? 'primary' : 'default'}
                                onClick={() => handleStatusFilter('all')}
                            >
                                All Users
                            </Button>
                            <Button
                                type={statusFilter === 'active' ? 'primary' : 'default'}
                                style={statusFilter === 'active' ? {background: '#52c41a', borderColor: '#52c41a'} : {}}
                                onClick={() => handleStatusFilter('active')}
                            >
                                Active
                            </Button>
                            <Button
                                type={statusFilter === 'pending' ? 'primary' : 'default'}
                                style={statusFilter === 'pending' ? {
                                    background: '#faad14',
                                    borderColor: '#faad14'
                                } : {}}
                                onClick={() => handleStatusFilter('pending')}
                            >
                                Pending
                            </Button>
                            <Button
                                type={statusFilter === 'inactive' ? 'primary' : 'default'}
                                style={statusFilter === 'inactive' ? {
                                    background: '#ff4d4f',
                                    borderColor: '#ff4d4f'
                                } : {}}
                                onClick={() => handleStatusFilter('inactive')}
                            >
                                Inactive
                            </Button>
                        </Space>
                    </Col>
                </Row>
            );
        }
    };

    return (
        <div className="site-card-border-less-wrapper">
            <Card>
                <div className="user-management-container">
                    {/* header with search and reset button */}
                    <Row gutter={16} className="mb-4">
                        <Col xs={24} md={6} style={{marginBottom: isMobile ? '16px' : '0'}}>
                            <Space>
                                <Title level={4}>Users List</Title>
                                <Button
                                    icon={<ReloadOutlined/>}
                                    onClick={handleReset}
                                    title="Reset all filters and sorting"
                                    size={isMobile ? "small" : "middle"}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </Col>
                        <Col xs={24} md={18}>
                            <Input
                                placeholder="Search users by name or email..."
                                value={searchTerm || ''}
                                onChange={handleSearchChange}
                                prefix={<SearchOutlined/>}
                                allowClear
                            />
                        </Col>
                    </Row>

                    {/* status filter buttons/dropdown - responsive */}
                    {renderStatusFilter()}

                    {/* users table */}
                    <Spin spinning={loading}>
                        <Table
                            ref={tableRef}
                            columns={getColumns()}
                            dataSource={users}
                            rowKey="_id"
                            pagination={antdPagination}
                            onChange={handleTableChange}
                            locale={{
                                emptyText: loading ? 'Loading users...' : 'No users found'
                            }}
                            scroll={{ x: 'max-content', y: 600 }}
                            sticky={{
                                offsetHeader: 0
                            }}
                            size={isMobile ? "small" : "middle"}
                        />
                    </Spin>

                    {/* user edit modal form */}
                    {selectedUser && (
                        <EditUserForm
                            user={selectedUser}
                            visible={showEditForm}
                            onSave={handleUserUpdate}
                            onCancel={handleCancelEdit}
                        />
                    )}
                    
                    {/* User Details Modal */}
                    <UserDetails 
                        userId={selectedUserId}
                        visible={userDetailsVisible}
                        onClose={() => setUserDetailsVisible(false)}
                    />
                </div>
            </Card>
        </div>
    );
};

export default UserManagement;