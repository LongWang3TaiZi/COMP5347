import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { ArrowLeft, Heart, Cart, StarFill } from 'react-bootstrap-icons';
import usePhoneDetailViewModel from '../../viewModels/PhoneDetailViewModel';
import ReviewItem from '../../components/layout/ReviewItem';
import QuantityModal from '../../components/layout/QuantityModal';
import { useAuth } from '../../context/AuthContext';

/**
 * page component for displaying phone details
 */
const PhoneDetailPage = () => {
    // get phoneId from URL params
    const { id } = useParams();
    
    // get current user information
    const { user } = useAuth();

    // get navigation function
    const navigate = useNavigate();

    // use view model for data and logic
    const {
        phone,
        loading,
        error,
        visibleReviews,
        expandedComments,
        quantity,
        showQuantityModal,
        cartQuantity,
        newReview,
        handleShowMoreReviews,
        toggleCommentExpansion,
        toggleReviewVisibility,
        handleAddToCart,
        confirmAddToCart,
        handleAddToWishlist,
        handleSubmitReview,
        handleBack,
        setQuantity,
        setShowQuantityModal,
        setNewReview
    } = usePhoneDetailViewModel(id);

    // loading state
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // error state
    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    // handle case where phone data is not available
    if (!phone) {
        return (
            <Container className="py-4">
                <Alert variant="warning">Phone not found</Alert>
            </Container>
        );
    }

    // determine if current user is the seller of this phone
    const isSeller = user && phone.seller && user._id === phone.seller._id;

    // determine how many reviews to show and if there are more
    const reviews = phone.reviews || [];
    
    // filter out hidden reviews for users who are not the seller or reviewer
    const visibleReviewsForUser = reviews.filter(review => {
        // if user is seller or reviewer of this review, show all reviews
        if (isSeller || (user && user._id === review.reviewer?._id)) {
            return true;
        }
        // for other users, only show reviews that are not hidden
        return !('hidden' in review);
    });
    
    const displayedReviews = visibleReviewsForUser.slice(0, visibleReviews);
    const hasMoreReviews = visibleReviews < visibleReviewsForUser.length;

    return (
        <Container className="py-4">
            {/* Back button */}
            <Button
                variant="link"
                className="mb-4 p-0 text-decoration-none"
                onClick={handleBack}
            >
                <ArrowLeft className="me-1" size={18} />
                Back to listings
            </Button>

            {/* Phone details section */}
            <Row className="mb-5">
                {/* Left column - Image */}
                <Col md={5} className="mb-4 mb-md-0">
                    <div className="bg-light p-3 d-flex align-items-center justify-content-center rounded" style={{ height: '400px' }}>
                        <img
                            src={`http://localhost:7777${phone.image}`}
                            alt={phone.title}
                            className="img-fluid"
                            style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        />
                    </div>
                </Col>

                {/* Right column - Details */}
                <Col md={7}>
                    <h1 className="h2 mb-3">{phone.title}</h1>
                    <div className="mb-3">
                        <Badge bg="secondary" className="me-2">{phone.brand}</Badge>
                        <Badge bg={phone.stock > 0 ? 'success' : 'danger'}>
                            {phone.stock > 0 ? `${phone.stock} in stock` : 'Out of stock'}
                        </Badge>
                    </div>

                    <p className="text-muted mb-4">
                        Sold by: {phone.seller?.firstname} {phone.seller?.lastname}
                    </p>

                    <h2 className="h1 text-primary mb-4">${phone.price.toFixed(2)}</h2>

                    <div className="d-flex gap-2 mb-3">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleAddToCart}
                            disabled={phone.stock <= 0}
                        >
                            <Cart className="me-2" /> Add to Cart
                        </Button>

                        <Button
                            variant="outline-secondary"
                            size="lg"
                            onClick={handleAddToWishlist}
                        >
                            <Heart className="me-2" /> Add to Wishlist
                        </Button>
                    </div>

                    { (
                        <div className="mb-4 p-3 bg-light rounded">
                            <p className="mb-0">
                                <strong>Currently in cart:</strong> {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Reviews section */}
            <h3 className="mb-4">Customer Reviews</h3>

            {/* Review list */}
            {displayedReviews.length > 0 ? (
                <div className="mb-4">
                    {displayedReviews.map(review => (
                        <ReviewItem
                            key={review._id}
                            review={review}
                            isExpanded={expandedComments[review._id]}
                            isReviewer={user && user._id === review.reviewer?._id}
                            isSeller={isSeller}
                            onToggleExpand={toggleCommentExpansion}
                            onToggleVisibility={(reviewId) => toggleReviewVisibility(phone._id, reviewId)}
                        />
                    ))}

                    {hasMoreReviews && (
                        <Button
                            variant="outline-primary"
                            onClick={handleShowMoreReviews}
                            className="mb-4"
                        >
                            Show More Reviews
                        </Button>
                    )}
                </div>
            ) : (
                <Alert variant="light" className="mb-4">
                    No reviews yet. Be the first to leave a review!
                </Alert>
            )}

            {/* Add review form */}
            <Card className="mb-5">
                <Card.Header>
                    <h4 className="mb-0">Write a Review</h4>
                </Card.Header>
                <Card.Body>
                    {user ? (
                        <Form onSubmit={handleSubmitReview}>
                            <Form.Group className="mb-3">
                                <Form.Label>Rating</Form.Label>
                                <div className="d-flex align-items-center">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <StarFill
                                            key={star}
                                            size={24}
                                            className={`me-1 ${star <= newReview.rating ? 'text-warning' : 'text-secondary opacity-25'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setNewReview({...newReview, rating: star})}
                                        />
                                    ))}
                                    <span className="ms-2">({newReview.rating} / 5)</span>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Your Review</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                                    placeholder="Share your experience with this product..."
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit">
                                Submit Review
                            </Button>
                        </Form>
                    ) : (
                        <Alert variant="info">
                            Please <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>login</Button> to write a review.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Quantity Modal */}
            <QuantityModal
                show={showQuantityModal}
                onHide={() => setShowQuantityModal(false)}
                quantity={quantity}
                setQuantity={setQuantity}
                maxStock={phone.stock}
                onConfirm={confirmAddToCart}
            />
        </Container>
    );
};

export default PhoneDetailPage;