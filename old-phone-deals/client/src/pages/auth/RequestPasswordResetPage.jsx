// client/src/pages/auth/RequestPasswordResetPage.jsx
import React from 'react';
// Added Alert for optional non-modal error display
import { Form, Input, Button, Typography, Card, Space, Spin, Alert } from 'antd';
import { MailOutlined } from '@ant-design/icons';
// Ensure path points to the Option B ViewModel (the one we just fixed and tested)
import useRequestPasswordResetViewModel from '../../viewModels/RequestPasswordResetViewModel';
import styles from '../../styles/auth/RequestPasswordResetPage.module.css'; // Import the CSS module

const { Title, Text } = Typography;

/**
 * Renders the request password reset page (Option B integration).
 * This component provides a form for users to enter their email address.
 * Ant Design Form handles input state and validation based on rules defined in Form.Item.
 * It utilizes the `useRequestPasswordResetViewModel` hook (Option B version)
 * to handle the submission logic (API call via requestReset, loading state, feedback).
 * Styles are applied using CSS Modules (`RequestPasswordResetPage.module.css`).
 *
 * @component
 * @returns {JSX.Element} The RequestPasswordResetPage component.
 */
const RequestPasswordResetPage = () => {
  // AntD form instance
  const [form] = Form.useForm();
  // Destructure ONLY what the Option B ViewModel provides
  const { isLoading, error, requestReset } = useRequestPasswordResetViewModel();

  /**
   * Handles the successful submission of the form AFTER AntD validation passes.
   * It calls the `requestReset` function from the ViewModel with the validated email.
   *
   * @param {object} values - The validated form values provided by Ant Design Form's onFinish.
   * @param {string} values.email - The validated email address entered by the user.
   * @returns {Promise<void>}
   */
  const onFinish = async (values) => {
    // Call the ViewModel's function with the validated email
    await requestReset(values.email);
    // Consider if form should be reset after Swal confirmation?
    // form.resetFields();
  };

  /**
   * Handles form submission failure due to AntD validation errors.
   * Ant Design Form automatically displays errors based on rules.
   * This function is primarily for logging or additional side effects if needed.
   *
   * @param {object} errorInfo - Information about the validation errors.
   */
  const onFinishFailed = (errorInfo) => {
    if (errorInfo.errorFields.length > 0) {
       form.scrollToField(errorInfo.errorFields[0].name[0]);
    }
  };


  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Spin spinning={isLoading} tip="Sending request..." size="large">
          <Space direction="vertical" size="large" className={styles.formContainer}>
            <Title level={3} className={styles.title}>
              Forgot Your Password?
            </Title>
            <Text type="secondary" className={styles.subtitle}>
              Enter Email Address to Receive Reset Link.
            </Text>

            {error && (
              <Alert
                message="Request Failed"
                description={error}
                type="error"
                showIcon
                closable
                className={styles.alert} 
              />
            )}

            <Form
              form={form}
              name="request_password_reset"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  {
                    required: true,
                    message: 'Please enter your email address!',
                  },
                  {
                    type: 'email',
                    message: 'Please enter a valid email address format!',
                  },
                ]}
              >
                <Input
                  prefix={<MailOutlined className={styles.icon} />} // Apply icon color via class
                  placeholder="e.g., user@example.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item className={styles.buttonItem}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  size="large"
                >
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Spin>
      </Card>
    </div>
  );
};

export default RequestPasswordResetPage;