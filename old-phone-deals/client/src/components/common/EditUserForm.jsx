import React from 'react';
import {Form, Input, Select, Button, Space, Modal} from 'antd';
import {UserOutlined, MailOutlined, IdcardOutlined} from '@ant-design/icons';
import useEditUserViewModel from '../../viewModels/EditUserViewModel';

const {Option} = Select;


const EditUserForm = ({user, onSave, onCancel, visible = false}) => {
    // use the view model to get state and methods
    const {
        form,
        isModified,
        fullName,
        onValuesChange,
        onFinish
    } = useEditUserViewModel(user, onSave);

    return (
        <Modal
            title={`Edit User: ${fullName}`}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={onValuesChange}
                preserve={false}
            >
                <Form.Item
                    name="firstname"
                    label="First Name"
                    rules={[{required: true, message: 'Please enter first name'}]}
                >
                    <Input prefix={<UserOutlined/>} placeholder="First name"/>
                </Form.Item>

                <Form.Item
                    name="lastname"
                    label="Last Name"
                    rules={[{required: true, message: 'Please enter last name'}]}
                >
                    <Input prefix={<UserOutlined/>} placeholder="Last name"/>
                </Form.Item>

                <Form.Item
                    name="fullName"
                    label="Full Name"
                >
                    <Input
                        prefix={<IdcardOutlined/>}
                        disabled
                        placeholder="Full name will be generated automatically"
                    />
                </Form.Item>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        {required: true, message: 'Please enter email address'},
                        {type: 'email', message: 'Please enter a valid email'}
                    ]}
                >
                    <Input prefix={<MailOutlined/>} placeholder="Email address"/>
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Status"
                >
                    <Select disabled placeholder="User status">
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                        <Option value="pending">Pending</Option>
                    </Select>
                </Form.Item>

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={!isModified}
                        >
                            Save Changes
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditUserForm;