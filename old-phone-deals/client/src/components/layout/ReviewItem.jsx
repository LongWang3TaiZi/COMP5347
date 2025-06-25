import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { StarFill, EyeSlash, Eye } from 'react-bootstrap-icons';

/**
 * component for displaying a single review
 * @param {Object} props - component props
 * @param {Object} props.review - review data
 * @param {boolean} props.isExpanded - whether the comment is expanded
 * @param {boolean} props.canToggleVisibility - whether user can toggle visibility
 * @param {function} props.onToggleExpand - handler for toggling comment expansion
 * @param {function} props.onToggleVisibility - handler for toggling review visibility
 * @param {boolean} props.isReviewer - whether current user is the reviewer
 * @param {boolean} props.isSeller - whether current user is the seller
 */
const ReviewItem = ({
                        review,
                        isExpanded,
                        onToggleExpand,
                        onToggleVisibility,
                        isReviewer,
                        isSeller
                    }) => {
    // safety check for review data
    if (!review) return null;

    // determine if current user can toggle this review's visibility
    const canToggleVisibility = isReviewer || isSeller;
    
    // determine if review is hidden
    const isHidden = 'hidden' in review;

    // determine if comment needs "show more" button
    const needsExpansion = review.comment && review.comment.length > 200;

    // limit comment text based on expansion state
    const displayComment = needsExpansion && !isExpanded
        ? `${review.comment.substring(0, 200)}...`
        : review.comment;

    /**
     * render star rating display
     * @param {number} rating - rating value (0-5)
     * @returns {JSX.Element} star rating display
     */
    const renderStars = (rating = 0) => {
        return (
            <div className="d-flex align-items-center">
                {[...Array(5)].map((_, i) => (
                    <StarFill
                        key={i}
                        className={`me-1 ${i < Math.floor(rating) ? 'text-warning' : 'text-secondary opacity-25'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Card
            className="mb-3"
            style={{
                opacity: isHidden ? 0.7 : 1,
                backgroundColor: isHidden ? '#f8f9fa' : 'white'
            }}
        >
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h6 className="mb-0">
                            {review.reviewer?.firstname} {review.reviewer?.lastname}
                        </h6>
                        {renderStars(review.rating)}
                    </div>
                    {canToggleVisibility && (
                        <Button
                            variant={isHidden ? "outline-success" : "outline-secondary"}
                            size="sm"
                            onClick={() => onToggleVisibility(review._id)}
                            title={isHidden ? "Show this review" : "Hide this review"}
                        >
                            {isHidden ? <><Eye className="me-1" /> Show</> : <><EyeSlash className="me-1" /> Hide</>}
                        </Button>
                    )}
                </div>

                <div className={`mt-2 ${isHidden ? 'text-muted' : ''}`}>
                    {displayComment}
                </div>

                {needsExpansion && (
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 mt-1"
                        onClick={() => onToggleExpand(review._id)}
                    >
                        {isExpanded ? "Show less" : "Show more"}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
};

export default ReviewItem;