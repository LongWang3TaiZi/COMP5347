import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import ApiService from '../service/ApiService'; 
import SwalService from '../service/SwalService'; 

/**
 * @typedef {object} ResetPasswordViewModelResult
 * @property {boolean} isLoading - Indicates if the password reset submission is in progress.
 * @property {string|null} error - Stores the general error message if the submission fails.
 * @property {(token: string, password: string) => Promise<void>} submitReset - Function to submit the new password.
 */

/**
 * Custom hook for the Reset Password page logic.
 * (Final Version - aligned with backend expecting only password)
 *
 * Manages the state (loading, error) for the password reset process. It handles
 * the asynchronous operation of calling the backend API via ApiService to set
 * the new password using a token. It utilizes SwalService for user feedback
 * and navigates the user to the login page upon successful password reset.
 *
 * @returns {ResetPasswordViewModelResult} The view model object containing state and actions.
 */
const useResetPasswordViewModel = () => {
  // --- State ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Hooks ---
  /** @type {import('react-router-dom').NavigateFunction} */
  const navigate = useNavigate();

  // --- Callbacks ---
  /**
   * Submits the new password to the backend API using the provided reset token.
   * Backend now only requires the 'password' field.
   *
   * @param {string} token - The password reset token obtained from the URL. Must not be null or empty.
   * @param {string} password - The new password entered and validated by the user. Must not be null or empty.
   * @returns {Promise<void>} A promise that resolves when the submission attempt (including feedback) is complete.
   * @async
   */
  const submitReset = useCallback(async (token, password) => {
    if (!token || !password) {
      const inputErrorMsg = "Missing required information to reset password.";
      console.error("submitReset validation failed:", inputErrorMsg, { hasToken: !!token, hasPassword: !!password });
      setError(inputErrorMsg);
      await SwalService.error("Cannot reset password. Token or password missing.", "Error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = `/user/reset-password/${token}`;

      await ApiService.post(apiUrl, { password: password });

      setIsLoading(false);

      await SwalService.success(
        'Your password has been successfully reset! You can now log in with your new password.', // Updated success message slightly
        'Password Reset Successful!'
      );

      navigate('/login'); 

    } catch (err) {
      setIsLoading(false); 

      let errorMessage = `An error occurred while resetting your password. The link may be invalid or expired, or the password might not meet the required criteria. Please try requesting a new link.`;
      console.error('Error resetting password via ApiService:', err);

      if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
      }
      // Removed the check for non-network errors doing nothing, just set the error

      setError(errorMessage);

      await SwalService.error(errorMessage, 'Password Reset Failed');
    }
  }, [navigate]); 

  return {
    isLoading,
    error,
    submitReset, 
  };
};

export default useResetPasswordViewModel;