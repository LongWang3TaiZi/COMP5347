const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

/**
 * Creates a mail transporter.
 * @returns {Object} - Nodemailer transporter.
 */
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE_USING_GMAIL === 'true') {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE_GMAIL,
    auth: {
      user: process.env.EMAIL_USER_GMAIL,
        pass: process.env.EMAIL_PASS_GMAIL
      }
    });
  } else {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

/**
 * Sends a verification email to a user.
 * 
 * @param {Object} user - User object for whom to send the verification email.
 * @param {string} user._id - MongoDB user ID.
 * @param {string} user.email - User's email address.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object with success status and message ID.
 * @returns {boolean} result.success - Indicates whether the email was sent successfully.
 * @returns {string} result.messageId - The message ID returned by the mail server.
 * 
 * @throws {Error} If there's an issue with token generation, email sending, or any other error.
 * 
 * @precondition user._id - Must be a valid MongoDB ID.
 * @precondition user.email - Must be a valid email address.
 * @precondition Environment variables - JWT_SECRET, FRONTEND_URL, EMAIL_* must be configured.
 * 
 * @postcondition (Success) - Verification email is sent to the user with a valid JWT token link.
 * @postcondition (Failure) - Error is thrown with details about the failure.
 */
const sendVerificationEmail = async (user) => {
  try {
    // Generates a JWT verification token.
    const token = jwt.sign(
      { userId: user._id, type: 'verify_email' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // 24 hours validity
    );
    
    // Creates the verification URL.
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    // Email content.
    const mailOptions = {
      from: `"OldPhone Team" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Welcome to OldPhone</h2>
          <p>Hello!</p>
          <p>Thank you for registering with OldPhone. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p>Or, you can copy the following link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not register with OldPhone, please disregard this email.</p>
          <p>Thank you!<br>OldPhone Team</p>
        </div>
      `
    };
    
    // Sends the email.
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Verification email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Sends a password reset email to the user.
 * 
 * @param {object} user - The user object (needs at least email and firstname).
 * @param {string} token - The password reset token (from PasswordResetToken collection).
 * @returns {Promise<Object>} A promise that resolves to an object with success status and message ID.
 * @throws {Error} If there's an issue with email sending or configuration.
 * @precondition Environment variables - FRONTEND_URL, EMAIL_* must be configured.
 * @precondition Transporter is configured correctly.
 */
const sendPasswordResetEmail = async (user, token) => {
  console.log(`Initiating password reset email for user: ${user.email}`); 

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
       console.error('FRONTEND_URL environment variable is not set. Cannot create reset link.');
       throw new Error('Frontend URL is not configured.');
  }

  try {
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`; 
      const mailOptions = {
          from: `"OldPhone Team" <${process.env.EMAIL_FROM}>`, 
          to: user.email,
          subject: 'Password Reset Request for OldPhone', 
          text: `Hello ${user.firstname || 'User'},\n\nYou requested a password reset for your OldPhone account. Click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in ${parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MS, 10) / 60000 || '60'} minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nOldPhone Team`, // 纯文本内容
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">Password Reset for OldPhone</h2>
                <p>Hello ${user.firstname || 'User'},</p>
                <p>We received a request to reset the password for your OldPhone account. Please click the button below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}"
                     style="background-color: #FFA500; color: white; padding: 10px 20px;
                            text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Reset Your Password
                  </a>
                </div>
                <p>Or, you can copy the following link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <p>This link will expire in <strong>${parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MS, 10) / 60000 || '60'} minutes</strong>.</p> <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p>Thanks,<br/>OldPhone Team</p>
              </div>
          ` 
      };

      const transporter = createTransporter(); 
      const info = await transporter.sendMail(mailOptions);

      console.log('Password reset email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };

  } catch (error) {
      console.error(`Failed to send password reset email to ${user.email}:`, error);
      throw new Error('Failed to send password reset email.');
  }
};

/**
 * Sends a email to notify the user that the password has been changed.
 * 
 * @param {object} user - The user object (needs at least email and firstname).
 * @returns {Promise<Object>} A promise that resolves to an object with success status and message ID.
 * @throws {Error} If there's an issue with email sending or configuration.
 * @precondition Environment variables - EMAIL_* must be configured.
 * @precondition Transporter is configured correctly.
 */
const sendPasswordChangedEmail = async (user) => {
  console.log(`Initiating password changed email for user: ${user.email}`); 

  try {
      const mailOptions = {
          from: `"OldPhone Team" <${process.env.EMAIL_FROM}>`, 
          to: user.email,
          subject: 'Password Changed for OldPhone', 
          text: `Hello ${user.firstname || 'User'},\n\nYou have successfully changed your password for your OldPhone account.\n\nThanks,\nOldPhone Team`, // 纯文本内容
          html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">Password Changed for OldPhone</h2>
                <p>Hello ${user.firstname || 'User'},</p>
                <p>You have successfully changed your password for your OldPhone account.</p>
                <p>Thanks,<br/>OldPhone Team</p>
              </div>
          ` 
      };

      const transporter = createTransporter(); 
      const info = await transporter.sendMail(mailOptions);

      console.log('Password changed email sent: %s', info.messageId);
      return { success: true, messageId: info.messageId };

  } catch (error) {
      console.error(`Failed to send password changed email to ${user.email}:`, error);
      throw new Error('Failed to send password changed email.');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};