import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import useVerifyEmailViewModel from '../../viewModels/VerifyEmailViewModel';

/**
 * Email Verification Page Component
 * Handles the verification process after clicking the email verification link
 */
const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { status, message, verifyToken } = useVerifyEmailViewModel();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      console.error("Verification token is missing from URL.");
    }
  }, [token, verifyToken]);
  
  // Effect to handle Swal popup on success
  useEffect(() => {
    if (status === 'success') {
      const redirectUrl = localStorage.getItem('redirectAfterEmailVerification');
      let confirmButtonText = 'Go to Login';
      let targetUrl = '/auth'; // Default to login page

      if (redirectUrl) {
        confirmButtonText = 'Go to Previous Page';
        targetUrl = redirectUrl;
        localStorage.removeItem('redirectAfterEmailVerification');
      }

      Swal.fire({
        title: 'Verification Successful',
        text: message, 
        icon: 'success',
        confirmButtonText: confirmButtonText,
        allowOutsideClick: false, // Prevent closing by clicking outside
        allowEscapeKey: false // Prevent closing by Escape key
      }).then((result) => {
        if (result.isConfirmed) {
           navigate(targetUrl, { replace: true }); 
        }
      });
    }
  }, [status, message, navigate]); 
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Email Verification</h4>
            </div>
            <div className="card-body">
              {status === 'loading' && (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">{message || 'Verifying your email, please wait...'}</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className="text-center">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">{message}</h5>
                </div>
              )}
              
              {status === 'error' && (
                <div className="text-center">
                  <i className="bi bi-x-circle text-danger" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3">{message}</h5>
                  <p>If you need help, please contact our customer support.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;