import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import { StarFill, Heart, HeartFill } from 'react-bootstrap-icons';
import { useAuth } from '../../context/AuthContext';
import SwalService from '../../service/SwalService';
import apiService from '../../service/ApiService';
import { useNavigate } from 'react-router-dom';

/**
 * reusable phone card component for displaying phone information
 * @param {Object} props - component props
 * @param {Object} props.phone - phone data object
 * @param {string} props.type - type of card ('soldOutSoon' or 'bestSeller')
 * @param {function} props.onPhoneSelect - callback function when phone is selected
 * @param {boolean} props.showDetails - whether to show detailed information
 */
const PhoneCard = ({ phone, type, onPhoneSelect, showDetails = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * handle click on phone card
   * @param {Event} e - click event
   */
  const handleCardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (phone && phone._id && onPhoneSelect) {
      onPhoneSelect(phone._id);
    }
  };

  /**
   * handle add to cart
   * @param {Event} e - click event
   */
  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (!isRedirecting) {
        setIsRedirecting(true);
        await SwalService.error('Please login to add items to cart');
        navigate('/auth', { replace: true });
      }
      return;
    }

    try {
      // Add item to cart with quantity 1
      await apiService.put(`/user/${user._id}/cart/${phone._id}`, {
        quantity: 1
      });
      
      SwalService.success('Item added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
      SwalService.error('Failed to add item to cart. Please try again later.');
    }
  };

  /**
   * handle add to wishlist
   * @param {Event} e - click event
   */
  const handleAddToWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      await SwalService.error('Please log in to add items to your wish list');
      return;
    }

    try {
      // Add item to wishlist using API
      const response = await apiService.post(`/user/${user._id}/wishlist/${phone._id}`);
      if (response.success) {
        SwalService.success('Added to Wishlist!');
      } else {
        SwalService.error(response.message || 'Failed to add, please try again later');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      if (err.response?.status === 409) {
        SwalService.info('This item is already in your wish list!');
      } else {
        SwalService.error('Failed to add, please try again later');
      }
    }
  };

  // safety check for phone object
  if (!phone || !phone._id) {
    return (
      <Card className="h-100 shadow-sm border-0 mb-3">
        <div className="text-center p-4 text-secondary">
          Phone data unavailable
        </div>
      </Card>
    );
  }

  /**
   * render star rating display with fallback for undefined values
   * @param {number} rating - rating value (0-5)
   * @returns {JSX.Element} star rating display
   */
  const renderStars = (rating) => {
    // ensure rating is a number or default to 0
    const safeRating = typeof rating === 'number' ? rating : 0;
    
    return (
      <div className="d-flex align-items-center">
        {[...Array(5)].map((_, i) => (
          <StarFill 
            key={i} 
            className={`me-1 ${i < Math.floor(safeRating) ? 'text-warning' : 'text-secondary opacity-25'}`} 
          />
        ))}
        <span className="ms-1 fw-bold text-secondary">{safeRating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div 
      className="card-wrapper" 
      onClick={handleCardClick}
      role="button"
      tabIndex="0"
      style={{ cursor: 'pointer' }}
    >
      <Card className="h-100 shadow-sm border-0 mb-3 card-hover">
        <div className="d-flex align-items-center justify-content-center bg-light p-3" style={{ height: '180px' }}>
          <Card.Img 
            variant="top" 
            src={`http://localhost:7777${phone.image}`}
            alt={phone.title || 'Phone image'} 
            className="img-fluid" 
            style={{ maxHeight: '150px', objectFit: 'contain' }}
          />
        </div>
        <Card.Body className="d-flex flex-column justify-content-between p-3">
          {showDetails ? (
            <>
              <div>
                <Card.Title 
                  className="text-dark fs-5 fw-bold mb-2"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    height: '48px',
                    lineHeight: '1.2'
                  }}
                  title={phone.title}
                >
                  {phone.title}
                </Card.Title>
                <div className="text-primary fs-4 fw-bold mb-2">
                  ${phone.price?.toFixed(2) || '0.00'}
                </div>
                {phone.averageRating && renderStars(phone.averageRating)}
              </div>
              <div className="d-flex justify-content-between mt-3">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={handleAddToWishlist}
                >
                  <Heart className="me-1" />
                  Wishlist
                </Button>
              </div>
            </>
          ) : (
            <>
              {type === 'soldOutSoon' && (
                <>
                  <Card.Title className="text-primary fs-4 fw-bold mb-1">${phone.price || 0}</Card.Title>
                </>
              )}
              
              {type === 'bestSeller' && (
                <div>
                  {renderStars(phone.averageRating)}
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default PhoneCard;