import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiService from '../service/ApiService';

/**
 * ViewModel for VerifyEmailPage component.
 * Handles the verification process after clicking the email verification link.
 * * @returns {Object} - An object containing the status, message, and verifyToken function.
 * @property {String} status - The status of the verification process. ('loading', 'success', 'error')
 * @property {String} message - The message to display to the user.
 * @property {Function} verifyToken - A function to verify the token and update the status and message.
 */
const useVerifyEmailViewModel = () => {
  const navigate = useNavigate();
  // loading, success, error
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('loading');

  const verifyToken = useCallback(async (token) => {
    // check the passed token
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link, missing verification token.');
      // Display error prompt for missing token case as well
      Swal.fire({
        title: 'Verification Failed',
        text: 'Invalid verification link, missing verification token.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const response = await apiService.get(`/user/verify?token=${token}`);
      setStatus('success');
      const successMessage = response?.data?.message || 'Email verification successful. You can now log in.';

      // Display success prompt
      Swal.fire({
        title: 'Verification Successful',
        text: response?.data?.message || 'Your email has been successfully verified!', 
        icon: 'success',
        confirmButtonText: 'Go to Login'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
    } 
    /*This part is to bypass the React StrictMode double invocation after successful verification.
    It catches the 304 Not Modified error and ignores it, assuming the verification was successful previously (due to caching).
    It also catches the 400 Bad Request error and ignores it, assuming the account is already verified.
    */
    catch (error) {
      if (error.response) {
        if (error.response.status === 304) {
          console.warn('Caught 304 Not Modified. Assuming verification was successful previously (due to caching).');
        } else if (error.response.status === 400 &&
                   error.response.data?.message === 'Attempt to verify already active account') {
          console.warn('Ignoring 400 Bad Request: "Attempt to verify already active account". This is likely due to React StrictMode double invocation after successful verification.');
        } else {
          const errorMessage = error.response.data?.message || 'Verification failed, please try again later.';
          setStatus('error');
          setMessage(errorMessage);
          Swal.fire({
            title: 'Verification Failed',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } else {
        setStatus('error');
        const genericErrorMessage = 'Verification failed due to a network error or unexpected issue.';
        setMessage(genericErrorMessage);
        Swal.fire({
          title: 'Verification Failed',
          text: genericErrorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
      console.error("Verification Error Object:", error);
    }
  }, [navigate]);

  return {
    status,
    message,
    verifyToken,
  };
};

export default useVerifyEmailViewModel;