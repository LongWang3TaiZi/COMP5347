import React, { useState, useEffect } from 'react';
import { 
  Modal, Form, Input, Button, InputNumber, 
  Upload, message, Spin, Space, Select
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import apiService from '../../service/ApiService';
import Swal from 'sweetalert2';

const EditPhone = ({ phone, visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Initialize form with phone data when component mounts or phone changes
  useEffect(() => {
    if (phone && visible) {
      form.setFieldsValue({
        title: phone.title,
        brand: phone.brand,
        price: phone.price,
        stock: phone.stock,
      });
      setImageUrl(phone.image || '');
    }
    
  }, [phone, visible, form]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setImageUrl('');
    }
  }, [visible, form]);

  // Handle image upload
  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    // Validate file type and size
    const isValidImage = file.type === 'image/jpeg' || 
                         file.type === 'image/png' || 
                         file.type === 'image/gif' ||
                         file.type === 'image/jpg';
                         
    const isValidSize = file.size / 1024 / 1024 < 5; // Less than 5MB
    
    if (!isValidImage) {
      message.error('You can only upload JPG/PNG/GIF file!');
      onError('File type error');
      return;
    }
    
    if (!isValidSize) {
      message.error('Image must be smaller than 5MB!');
      onError('File size error');
      return;
    }
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploadLoading(true);
      
      // Call the upload API using the specialized file upload method
      const response = await apiService.uploadFile('admin/phones/upload-image', formData);
      
      if (response.success) {
        setImageUrl(response.data);
        message.success('Image uploaded successfully');
        onSuccess();
      } else {
        message.error(response.message || 'Failed to upload image');
        onError('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
      onError('Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Prepare data for API call
      // Only include fields that have been changed
      const updatedData = {};
      
      if (values.title !== phone.title) updatedData.title = values.title;
      if (values.brand !== phone.brand) updatedData.brand = values.brand;
      if (values.price !== phone.price) updatedData.price = values.price;
      if (values.stock !== phone.stock) updatedData.stock = values.stock;
      if (imageUrl !== phone.image) updatedData.image = imageUrl;
      
      // If nothing changed, show message and return
      if (Object.keys(updatedData).length === 0) {
        message.info('No changes detected');
        onClose();
        return;
      }
      
      // Make API call to update phone
      setLoading(true);
      
      const response = await apiService.put(`admin/phones/update/${phone._id}`, updatedData);
      
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Phone updated successfully',
          timer: 2000,
          showConfirmButton: false
        });
        // Call onSuccess before closing to ensure data is refreshed
        if (onSuccess) {
          onSuccess();
        }
        onClose(); // Close the modal
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to update phone'
        });
      }
    } catch (error) {
      console.error('Error updating phone:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred while updating the phone'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Custom upload button UI
  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <Modal
      title="Edit Phone"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      ]}
      maskClosable={false}
      width={600}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          name="editPhoneForm"
        >
          {/* Title field */}
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter the phone title' }]}
          >
            <Input placeholder="Phone title" />
          </Form.Item>
          
          {/* Brand field */}
          <Form.Item
            name="brand"
            label="Brand"
            rules={[{ required: true, message: 'Please select a brand' }]}
          >
            <Input placeholder="Phone brand" />
          </Form.Item>
          
          <Space style={{ display: 'flex' }}>
            {/* Price field */}
            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: 'Please enter the price' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                prefix="$"
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="0.00"
              />
            </Form.Item>
            
            {/* Stock field */}
            <Form.Item
              name="stock"
              label="Stock"
              rules={[{ required: true, message: 'Please enter the stock' }]}
              style={{ flex: 1 }}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: '100%' }}
                placeholder="0"
              />
            </Form.Item>
          </Space>
          
          {/* Image upload field */}
          <Form.Item
            label="Phone Image"
            extra="Supported formats: JPG, PNG, GIF. Max size: 5MB"
          >
            <Upload
              name="phone_image"
              listType="picture-card"
              showUploadList={false}
              customRequest={handleImageUpload}
              accept="image/png, image/jpeg, image/gif, image/jpg"
              beforeUpload={(file) => {
                // Additional validation before upload
                const isValidImage = file.type === 'image/jpeg' || 
                                    file.type === 'image/png' || 
                                    file.type === 'image/gif' ||
                                    file.type === 'image/jpg';
                                    
                const isValidSize = file.size / 1024 / 1024 < 5; // Less than 5MB
                
                if (!isValidImage) {
                  message.error('You can only upload JPG/PNG/GIF file!');
                  return Upload.LIST_IGNORE;
                }
                
                if (!isValidSize) {
                  message.error('Image must be smaller than 5MB!');
                  return Upload.LIST_IGNORE;
                }
                
                return true;
              }}
            >
              {imageUrl ? (
                <img 
                  src={`http://localhost:7777${imageUrl}`} 
                  alt="Phone" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    // Handle image loading error
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/100x100?text=Image+Error';
                  }}
                />
              ) : uploadButton}
            </Upload>
            {uploadLoading && <Spin size="small" />}
            {imageUrl && (
              <Button 
                type="text" 
                danger 
                onClick={() => setImageUrl('')}
                style={{ marginTop: 8 }}
              >
                Remove Image
              </Button>
            )}
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditPhone; 