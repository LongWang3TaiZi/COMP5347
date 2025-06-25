import { useState, useCallback } from 'react';
import SwalService from '../service/SwalService'; // Assuming the path is correct
import ApiService from '../service/ApiService'; // Import ApiService
import { isValidEmail } from '../validators/validationUtils'; // Import the new validator

/**
 * @typedef {object} RequestPasswordResetViewModelResultOptionB
 * @property {boolean} isLoading - Indicates if the password reset request is in progress.
 * @property {string|null} error - Stores the general error message if the request fails (can be used for non-modal error display if needed).
 * @property {(email: string) => Promise<void>} requestReset - Function to initiate the password reset request for the given email, typically called from Form's onFinish.
 */

/**
 * Custom hook for the Request Password Reset page logic (Option B: AntD handles form state/validation).
 * It handles the state management for loading/error and the asynchronous operation
 * of calling the backend API via ApiService to request a password reset email. Uses SwalService for feedback.
 * It expects the email value to be provided by the calling component (e.g., AntD Form's onFinish callback).
 * @returns {RequestPasswordResetViewModelResultOptionB} The view model object containing state and actions.
 */
const useRequestPasswordResetViewModel = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null); // For potential non-modal error display
  
    /**
     * Sends a password reset request to the backend API using the provided email.
     * Assumes email value comes from AntD Form's onFinish handler.
     * Updates loading state and uses SwalService to display success or error messages.
     * Wrapped in useCallback for potential memoization benefits, though might be optional here.
     * @param {string} email - The user's email address obtained from the form's onFinish values.
     * @returns {Promise<void>} A promise that resolves when the request and feedback display are complete.
     */
    const requestReset = useCallback(async (email) => {
      // Basic validation check.... AnTD Form handles the advanced parts...
      if (!email) {
          console.error("RequestReset called without an email.");
          await SwalService.error("An email address is required.", "Input Error");
          return;
      }
  
      setIsLoading(true);
      setError(null); 
      try {
        await ApiService.post('/user/request-password-reset', { email });
  
        await SwalService.success(
          'If this email address is registered, you will receive an email with password reset instructions. Please check your inbox (and spam folder).',
          'Request Sent Successfully!'
        );
  
      } catch (err) {
        let errorMessage = 'An error occurred while sending the request. Please try again later.';
        console.error('Error requesting password reset via ApiService:', err);
        setError(errorMessage); 
  
        await SwalService.error(errorMessage, 'Operation Failed');
  
      } finally {
        setIsLoading(false); 
      }
    }, []); 
  
    return {
      isLoading,
      error, 
      requestReset, 
    };
  };
  
  export default useRequestPasswordResetViewModel;