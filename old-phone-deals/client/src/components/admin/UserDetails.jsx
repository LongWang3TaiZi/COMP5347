import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Typography, Table, Space, Tag, Rate, Spin, Empty, Image, Card, Avatar, message } from 'antd';
import { UserOutlined, MobileOutlined, CommentOutlined, StarFilled } from '@ant-design/icons';
import apiService from '../../service/ApiService';

const { Text, Title } = Typography;

const UserDetails = ({ userId, visible, onClose }) => {
    const [activeTab, setActiveTab] = useState('phones');
    const [loading, setLoading] = useState(false);
    const [phones, setPhones] = useState([]);
    const [reviews, setReviews] = useState([]);

    // Fetch data when component mounts or userId changes
    useEffect(() => {
        if (userId && visible) {
            if (activeTab === 'phones') {
                fetchPhones();
            } else if (activeTab === 'reviews') {
                fetchReviews();
            }
        }
    }, [userId, visible, activeTab]);

    // Fetch user's phones
    const fetchPhones = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/admin/users/${userId}/phones`);
            
            if (response.success) {
                setPhones(response.data);
            } else {
                message.error(response.message || 'Failed to load phones');
            }
        } catch (error) {
            console.error('Error fetching phones:', error);
            message.error('Error loading phones');
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's reviews
    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/admin/users/${userId}/reviews`);
            
            if (response.success) {
                setReviews(response.data);
            } else {
                message.error(response.message || 'Failed to load reviews');
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            message.error('Error loading reviews');
        } finally {
            setLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (key) => {
        setActiveTab(key);
    };

    // Columns for phone listings
    const phoneColumns = [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            render: (image) => (
                <Image
                    src={`http://localhost:7777${image}`}
                    alt="Phone"
                    style={{ width: 50, height: 50, objectFit: 'cover' }}
                />
            )
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Brand',
            dataIndex: 'brand',
            key: 'brand',
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `$${price?.toFixed(2) || '0.00'}`
        },
        {
            title: 'Stock',
            dataIndex: 'stock',
            key: 'stock',
            render: (stock) => (
                <Tag color={stock > 0 ? 'success' : 'error'}>
                    {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                </Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => (
                <Tag color={record.disabled ? 'error' : 'success'}>
                    {record.disabled ? 'Disabled' : 'Enabled'}
                </Tag>
            )
        }//,
        // {
        //     title: 'Reviews',
        //     dataIndex: 'reviews',
        //     key: 'reviewCount',
        //     render: (reviews) => reviews ? reviews.length : 0
        // }
    ];

    // Render phone listings tab
    const renderPhoneListings = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div>;
        }

        if (!phones || phones.length === 0) {
            return <Empty description="No phone listings found" />;
        }

        return (
            <Table 
                dataSource={phones}
                columns={phoneColumns}
                rowKey="_id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 'max-content' }}
            />
        );
    };

    // Render reviews tab
    const renderReviews = () => {
        if (loading) {
            return <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div>;
        }

        if (!reviews || reviews.length === 0) {
            return <Empty description="No reviews found" />;
        }

        return (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {reviews.map((item, index) => (
                    <Card 
                        key={index} 
                        style={{ marginBottom: '16px' }}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <MobileOutlined style={{ marginRight: 8 }} />
                                <span>{item.phoneTitle}</span>
                            </div>
                        }
                    >
                        <div style={{ marginBottom: '8px' }}>
                            <Text type="secondary">Brand: {item.brand}</Text>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <Rate disabled value={item.review.rating} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                           
                            <div>
                                <Text strong>Review:</Text>
                                <p>{item.review.comment}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <Modal
            title="Details"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            style={{ top: 20 }}
        >
            <Tabs 
                activeKey={activeTab}
                onChange={handleTabChange}
                items={[
                    {
                        key: 'phones',
                        label: (
                            <span>
                                <MobileOutlined />
                                Phone Listings
                            </span>
                        ),
                        children: renderPhoneListings()
                    },
                    {
                        key: 'reviews',
                        label: (
                            <span>
                                <CommentOutlined />
                                Reviews
                            </span>
                        ),
                        children: renderReviews()
                    }
                ]}
            />
        </Modal>
    );
};

export default UserDetails;