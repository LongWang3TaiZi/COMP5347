import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, Space, Spin, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import useResetPasswordViewModel from '../../viewModels/ResetPasswordViewModel';
import styles from '../../styles/auth/ResetPasswordPage.module.css';

const { Title, Text } = Typography;

/**
 * @component ResetPasswordPage
 * @description Renders the password reset page. It reads the reset token from the URL,
 * displays a form for entering a new password, handles form validation using Ant Design,
 * and utilizes the `useResetPasswordViewModel` hook for submitting the new password,
 * managing loading states, handling submission errors, and navigating upon success.
 * @returns {React.ReactElement} The password reset page component.
 */
const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [initialError, setInitialError] = useState(null);
  const [isTokenChecked, setIsTokenChecked] = useState(false);

  const { isLoading, error: submitError, submitReset } = useResetPasswordViewModel();

  /**
   * @effect Reads the password reset token from the URL search parameters
   * when the component mounts or search parameters change. Sets the token
   * in state or sets an initial error if the token is missing. Marks token
   * check as complete.
   */
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setInitialError('Invalid or missing password reset link. Please request a new one.');
    }
    setIsTokenChecked(true);
  }, [searchParams]);

  /**
   * @function onFinish
   * @description Handles the form submission after Ant Design's validation passes.
   * It verifies the presence of the token and calls the ViewModel's `submitReset`
   * function with the token and the new password. Navigation on success is handled
   * within the ViewModel.
   * @param {object} values - The validated form values.
   * @param {string} values.password - The new password entered by the user.
   * @async
   */
  const onFinish = async (values) => {
    if (!token) {
      console.error("Submission attempted without a valid token.");
      setInitialError("Cannot reset password without a valid link.");
      return;
    }
    await submitReset(token, values.password);
  };

  /**
   * @function onFinishFailed
   * @description Handles form submission failure due to Ant Design's internal validation rules.
   * Logs the error information and optionally scrolls to the first field with an error.
   * @param {object} errorInfo - Ant Design's validation error information object.
   * @param {Array} errorInfo.errorFields - Array of fields that failed validation.
   */
  const onFinishFailed = (errorInfo) => {
    if (errorInfo.errorFields.length > 0) {
       form.scrollToField(errorInfo.errorFields[0].name[0]);
    }
  };

  if (!isTokenChecked) {
    return (
      <div className={styles.pageContainer}>
        <Spin size="large" tip="Verifying link..." />
      </div>
    );
  }

  const displayError = initialError || submitError;

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <Spin spinning={isLoading} tip="Resetting password...">
          <Space direction="vertical" size="large" className={styles.contentSpace}>
            <Title level={3} className={styles.title}>Set New Password</Title>
            <Text type="secondary" className={styles.description}>
              Please enter your new password below. Make sure it's secure!
            </Text>

            {displayError && (
              <Alert
                message="Error"
                description={displayError}
                type="error"
                showIcon
                closable
                onClose={() => initialError ? setInitialError(null) : null}
                className={styles.alert}
              />
            )}

            {!initialError && (
              <Form
                form={form}
                name="reset_password"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="new-password"
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  label="New Password"
                  name="password"
                  className={styles.formItem}
                  rules={[
                    { required: true, message: 'Please input your new password!' },
                    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, message: 'Password must contain at least 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' }
                  ]}
                  hasFeedback
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    placeholder="Enter new password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Confirm New Password"
                  name="confirmPassword"
                  dependencies={['password']}
                  className={styles.formItem}
                  hasFeedback
                  rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('The two passwords that you entered do not match!'));
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    placeholder="Confirm new password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item className={styles.formItemLast}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={isLoading}
                    size="large"
                  >
                    Set New Password
                  </Button>
                </Form.Item>
              </Form>
            )}
            {initialError && (
                 <Button type="link" onClick={() => navigate('/login')} style={{ display: 'block', margin: '16px auto 0' }}>Go back to Login</Button>
            )}
          </Space>
        </Spin>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;