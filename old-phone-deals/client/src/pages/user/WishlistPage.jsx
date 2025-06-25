import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Form, Navbar } from 'react-bootstrap';
import { ArrowLeft, Heart, Cart, Trash, BoxArrowRight, HouseDoor } from 'react-bootstrap-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../service/ApiService';
import SwalService from '../../service/SwalService';

/**
 * Wishlist Page Component
 * Displays user's wishlist items with options to add to cart or remove
 */
const WishlistPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showQuantityModal, setShowQuantityModal] = useState(false);
    const [selectedPhone, setSelectedPhone] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Fetch wishlist data when user is available
    useEffect(() => {
        if (user) {
            fetchWishlist();
        }
    }, [user]);

    /**
     * Fetch user's wishlist data from the API
     */
    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/user/${user._id}/wishlist`);
            if (response.success) {
                setWishlist(response.data.wishlist);
                setError(null);
            } else {
                setError(response.message || 'Failed to fetch wishlist data');
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            if (err.response?.status === 401) {
                setError('Please login to access your wishlist');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to access this wishlist');
            } else if (err.response?.status === 404) {
                setError('Wishlist not found');
            } else {
                setError('Failed to fetch wishlist data. Please try again later');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Remove an item from the wishlist
     * @param {string} phoneId - ID of the phone to remove
     */
    const removeItem = async (phoneId) => {
        try {
            // Show confirmation dialog
            const result = await SwalService.confirm({
                title: 'Remove Item',
                text: 'Are you sure you want to remove this item from your wishlist?',
                icon: 'warning',
                confirmButtonText: 'Yes, remove it',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                const response = await apiService.delete(`/user/${user._id}/wishlist/${phoneId}`);
                if (response.success) {
                    setWishlist(response.data.wishlist);
                    SwalService.success('Item removed from wishlist');
                } else {
                    SwalService.error(response.message || 'Failed to remove item. Please try again later');
                }
            }
        } catch (err) {
            console.error('Error removing item:', err);
            SwalService.error('Failed to remove item. Please try again later');
        }
    };

    /**
     * Show quantity selection modal for adding item to cart
     * @param {Object} phone - Phone object to add to cart
     */
    const handleAddToCart = (phone) => {
        setSelectedPhone(phone);
        setQuantity(1);
        setShowQuantityModal(true);
    };

    /**
     * Confirm adding item to cart with selected quantity
     */
    const confirmAddToCart = async () => {
        if (!selectedPhone) return;

        try {
            const response = await apiService.put(`/user/${user._id}/cart/${selectedPhone._id}`, {
                quantity: quantity
            });
            
            if (response.success) {
                setShowQuantityModal(false);
                SwalService.success('Item added to cart successfully');
            } else {
                SwalService.error(response.message || 'Failed to add item to cart. Please try again later');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            SwalService.error(err.response?.data?.message || 'Failed to add item to cart. Please try again later');
        }
    };
    
    /**
     * Go back to previous page
     */
    const goBack = () => {
        navigate(-1);
    };
    
    /**
     * Handle user logout
     */
    const handleLogout = async () => {
        try {
            const logoutSuccess = await logout();
            // if the user cancels the logout, do nothing
            if (!logoutSuccess) {
                return;
            }
            // Navigate to home page instead of auth page
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
            SwalService.error('Logout failed, please try again later');
        }
    };

    // Loading state
    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container className="py-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    // Empty wishlist state
    if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
        return (
            <Container className="py-5">
                <Navbar className="mb-4 d-flex justify-content-between">
                    <Button 
                        variant="outline-primary" 
                        onClick={goBack}
                    >
                        <ArrowLeft className="me-2" />
                        Back
                    </Button>
                    <Button 
                        variant="outline-danger" 
                        onClick={handleLogout}
                    >
                        <BoxArrowRight className="me-2" />
                        Signout
                    </Button>
                </Navbar>
                <Alert variant="info">
                    Your wishlist is empty. Start adding some phones!
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Navbar className="mb-4 d-flex justify-content-between">
                <Button 
                    variant="outline-primary" 
                    onClick={goBack}
                >
                    <ArrowLeft className="me-2" />
                    Back
                </Button>
                <Button 
                    variant="outline-danger" 
                    onClick={handleLogout}
                >
                    <BoxArrowRight className="me-2" />
                    Signout
                </Button>
            </Navbar>
            
            <h1 className="mb-4 text-center">My Wishlist</h1>
            
            <Row>
                {wishlist.items.map((item) => (
                    <Col key={item.phone._id} md={4} className="mb-4">
                        <Card className="h-100">
                            <Card.Img
                                variant="top"
                                src={`http://localhost:7777${item.phone.image}`}
                                alt={item.phone.title}
                                style={{ height: '200px', objectFit: 'contain' }}
                            />
                            <Card.Body>
                                <Card.Title>{item.phone.title}</Card.Title>
                                <Card.Text>
                                    <p className="text-muted mb-2">Brand: {item.phone.brand}</p>
                                    <p className="h5 text-primary mb-3">${item.phone.price.toFixed(2)}</p>
                                    <p className="mb-0">
                                        <small className={item.phone.stock > 0 ? 'text-success' : 'text-danger'}>
                                            {item.phone.stock > 0 ? `Stock: ${item.phone.stock}` : 'Out of stock'}
                                        </small>
                                    </p>
                                </Card.Text>
                            </Card.Body>
                            <Card.Footer className="bg-white border-top-0">
                                <div className="d-flex justify-content-between">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAddToCart(item.phone)}
                                        disabled={item.phone.stock <= 0}
                                    >
                                        <Cart className="me-1" /> Add to Cart
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeItem(item.phone._id)}
                                    >
                                        <Trash className="me-1" /> Remove
                                    </Button>
                                </div>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Quantity Selection Modal */}
            <Modal show={showQuantityModal} onHide={() => setShowQuantityModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Select Quantity</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPhone && (
                        <>
                            <p>Selected item: {selectedPhone.title}</p>
                            <p>Available stock: {selectedPhone.stock}</p>
                            <Form.Group>
                                <Form.Label>Quantity:</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={selectedPhone.stock}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedPhone.stock))}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowQuantityModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={confirmAddToCart}>
                        Add to Cart
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default WishlistPage; 