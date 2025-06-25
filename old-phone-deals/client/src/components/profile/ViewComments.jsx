import React from 'react';
import { Card, Accordion, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { EyeFill, EyeSlashFill, StarFill } from 'react-bootstrap-icons';

/**
 * View comments component
 * @param {Object} props - Component properties
 * @param {Array} props.comments - Comment data list
 * @param {boolean} props.commentsLoading - Comment loading state
 * @param {Function} props.toggleCommentVisibility - Function to toggle comment visibility
 * @param {boolean} props.loading - Global loading state
 */
const ViewComments = ({ 
  comments, 
  commentsLoading, 
  toggleCommentVisibility, 
  loading 
}) => {
  // format display time
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // calculate time difference (milliseconds)
      const diffMs = now - date;
      
      // convert to various time units
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffMonth / 12);
      
      // return different formats based on time difference
      if (diffSec < 60) {
        return 'just now';
      } else if (diffMin < 60) {
        return `${diffMin} minutes ago`;
      } else if (diffHour < 24) {
        return `${diffHour} hours ago`;
      } else if (diffDay < 30) {
        return `${diffDay} days ago`;
      } else if (diffMonth < 12) {
        return `${diffMonth} months ago`;
      } else {
        return `${diffYear} years ago`;
      }
    } catch (error) {
      return 'unknown time';
    }
  };

  // render stars
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <StarFill 
        key={index} 
        className={`me-1 ${index < rating ? 'text-warning' : 'text-muted'}`} 
      />
    ));
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>Product comments</Card.Title>
        
        {commentsLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading comments...</p>
          </div>
        ) : !comments ? (
          <Alert variant="danger">
            Error fetching comment data. Please refresh the page and try again.
          </Alert>
        ) : comments.length === 0 ? (
          <Alert variant="info">
            Your product has not received any comments yet.
          </Alert>
        ) : (
          <Accordion className="comments-accordion">
            {comments.map((phone) => (
              <Accordion.Item key={phone._id} eventKey={phone._id}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                    <span>{phone.title} ({phone.brand})</span>
                    <Badge bg="info">{phone.reviews ? phone.reviews.length : 0} comments</Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  {!phone.reviews || phone.reviews.length === 0 ? (
                    <Alert variant="info">
                      This product has not received any comments yet.
                    </Alert>
                  ) : !Array.isArray(phone.reviews) ? (
                    <Alert variant="warning">
                      Comment data format is incorrect.
                    </Alert>
                  ) : (
                    <div className="comment-list">
                      {phone.reviews.map((review) => (
                        <div key={review._id} className="comment-item border-bottom pb-3 mb-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6>
                                {review.reviewer && typeof review.reviewer === 'object' 
                                  ? `${review.reviewer.firstname} ${review.reviewer.lastname}` 
                                  : 'Anonymous user'}
                                <small className="text-muted ms-2">
                                  {formatDate(review.createdAt)}
                                </small>
                              </h6>
                              <div className="rating mb-2">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            <Button
                              variant={review.hidden === "" ? "outline-success" : "outline-warning"}
                              size="sm"
                              onClick={() => toggleCommentVisibility(phone._id, review._id)}
                              disabled={loading}
                            >
                              {review.hidden === "" ? (
                                <><EyeFill className="me-1" /> Show</>
                              ) : (
                                <><EyeSlashFill className="me-1" /> Hide</>
                              )}
                            </Button>
                          </div>
                          <p className={review.hidden === "" ? "text-muted" : ""}>
                            {review.comment}
                          </p>
                          {review.hidden === "" && (
                            <Badge bg="secondary">Hidden</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );
};

ViewComments.propTypes = {
  comments: PropTypes.array,
  commentsLoading: PropTypes.bool.isRequired,
  toggleCommentVisibility: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

export default ViewComments; 