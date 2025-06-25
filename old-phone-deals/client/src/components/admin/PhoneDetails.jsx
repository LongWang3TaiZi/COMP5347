import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Typography, List, Rate, Avatar, Tag, Divider, Spin, message } from 'antd';
import { UserOutlined, StarOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import apiService from '../../service/ApiService';

const { Title, Text, Paragraph } = Typography;

const PhoneDetails = ({ phoneId, visible, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [phone, setPhone] = useState(null);

    useEffect(() => {
        if (phoneId && visible) {
            fetchPhoneDetails();
        }
    }, [phoneId, visible]);

    const fetchPhoneDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/admin/phones/${phoneId}`);
            
            if (response.success) {
                setPhone(response.data);
            } else {
                message.error(response.message || 'Failed to load phone details');
            }
        } catch (error) {
            message.error('Error loading phone details');
        } finally {
            setLoading(false);
        }
    };

    const renderReviews = () => {
        if (!phone?.reviews?.length) {
            return <Text>No reviews available</Text>;
        }
        return (
            <List
                itemLayout="vertical"
                dataSource={phone.reviews}
                renderItem={(review, index) => (
                    <List.Item key={index}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Avatar icon={<UserOutlined />} /> 
                                <Text strong style={{ marginLeft: 8 }}>
                                    Reviewer: {typeof review.reviewer === 'object' ? review.reviewer.firstname + " " + review.reviewer.lastname : review.reviewer}
                                </Text>
                            </div>
                            <div>
                                <Rate disabled value={review.rating} />
                                {review.hidden && (
                                    <Tag color="warning" style={{ marginLeft: 8 }}>
                                        <EyeInvisibleOutlined /> Hidden
                                    </Tag>
                                )}
                            </div>
                        </div>
                        <Paragraph style={{ marginTop: 8, marginLeft: 32 }}>
                            {review.comment}
                        </Paragraph>
                    </List.Item>
                )}
            />
        );
    };

    return (
        <Modal
            title="Phone Details"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" />
                </div>
            ) : phone ? (
                <>
                    <div style={{ display: 'flex', marginBottom: 20 }}>
                        {phone.image && (
                            <div style={{ marginRight: 24, width: 150 }}>
                                <img
                                    src={`http://localhost:7777${phone.image}`}
                                    alt={phone.title}
                                    style={{ width: '100%', borderRadius: 4 }}
                                />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <Title level={4}>{phone.title}</Title>
                            <Descriptions column={1} bordered>
                                <Descriptions.Item label="Brand">{phone.brand}</Descriptions.Item>
                                <Descriptions.Item label="Price">${phone.price?.toFixed(2)}</Descriptions.Item>
                                <Descriptions.Item label="Stock">
                                    <Tag color={phone.stock > 0 ? 'success' : 'error'}>
                                        {phone.stock > 0 ? `${phone.stock} in stock` : 'Out of stock'}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={phone.status === 'available' ? 'success' : 'warning'}>
                                        {phone.status}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </div>

                    <Divider orientation="left">Seller Information</Divider>
                    {phone.seller ? (
                        <Descriptions bordered>
                            <Descriptions.Item label="Name">
                                {typeof phone.seller.firstname === 'string' && typeof phone.seller.lastname === 'string' 
                                    ? `${phone.seller.firstname}  ${phone.seller.lastname}`
                                    : 'Unknown'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {typeof phone.seller.email === 'string' ? phone.seller.email : 'Unknown'}
                            </Descriptions.Item>
                        </Descriptions>
                    ) : (
                        <Text>No seller information available</Text>
                    )}

                    <Divider orientation="left">Reviews</Divider>
                    {renderReviews()}
                </>
            ) : (
                <Text>Phone details not available</Text>
            )}
        </Modal>
    );
};

export default PhoneDetails; 