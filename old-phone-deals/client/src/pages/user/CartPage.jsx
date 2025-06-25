import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Navbar } from 'react-bootstrap';
import { Trash, Plus, Dash, ArrowLeft, BoxArrowRight, HouseDoor } from 'react-bootstrap-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../../service/ApiService';
import SwalService from '../../service/SwalService';

/**
 * Shopping Cart Page Component
 * Displays user's cart items with quantity controls and order summary
 */
const CartPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Fetch cart data when user is available
    useEffect(() => {
        if (user) {
            fetchCart();
        }
    }, [user]);

    /**
     * Fetch user's cart data from the API
     */
    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/user/${user._id}/cart`);
            setCart(response.data.cart);
            setError(null);
        } catch (err) {
            console.error('Error details:', {
                status: err.response?.status,
                data: err.response?.data,
                message: err.message,
                url: err.config?.url
            });
            
            if (err.response?.status === 401) {
                setError('Please login to access your cart');
            } else if (err.response?.status === 403) {
                setError('You do not have permission to access this cart');
            } else if (err.response?.status === 404) {
                setError('Cart not found');
            } else {
                setError('Failed to fetch cart data. Please try again later');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update item quantity in the cart
     * @param {string} phoneId - ID of the phone to update
     * @param {number} newQuantity - New quantity value
     */
    const updateQuantity = async (phoneId, newQuantity) => {
        try {
            // If quantity is 0, show confirmation dialog
            if (newQuantity === 0) {
                const result = await SwalService.confirm({
                    title: 'Remove Item',
                    text: 'Are you sure you want to remove this item from your cart?',
                    icon: 'warning',
                    confirmButtonText: 'Yes, remove it',
                    cancelButtonText: 'Cancel'
                });

                if (result.isConfirmed) {
                    const response = await apiService.delete(`/user/${user._id}/cart/${phoneId}`);
                    setCart(response.data.cart);
                    SwalService.success('Item removed from cart');
                }
                return;
            }

            // For non-zero quantities, update normally
            const response = await apiService.put(`/user/${user._id}/cart/${phoneId}`, {
                quantity: newQuantity
            });
            setCart(response.data.cart);
        } catch (err) {
            SwalService.error('Failed to update item quantity. Please try again later.');
            console.error('Error updating quantity:', err);
        }
    };

    /**
     * Remove an item from the cart after confirmation
     * @param {string} phoneId - ID of the phone to remove
     */
    const removeItem = async (phoneId) => {
        try {
            // Show confirmation dialog
            const result = await SwalService.confirm({
                title: 'Remove Item',
                text: 'Are you sure you want to remove this item from your cart?',
                icon: 'warning',
                confirmButtonText: 'Yes, remove it',
                cancelButtonText: 'Cancel'
            });

            if (result.isConfirmed) {
                const response = await apiService.delete(`/user/${user._id}/cart/${phoneId}`);
                setCart(response.data.cart);
                SwalService.success('Item removed from cart');
            }
        } catch (err) {
            SwalService.error('Failed to remove item. Please try again later.');
            console.error('Error removing item:', err);
        }
    };

    /**
     * Calculate total price of all items in cart
     * @returns {number} Total price
     */
    const calculateTotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => {
            return total + (item.phone.price * item.quantity);
        }, 0);
    };

    /**
     * Handle checkout process
     */
    const handleCheckout = async () => {
        try {
            setIsCheckingOut(true);
            
            // Confirm transaction
            const confirmResult = await SwalService.confirm({
                title: 'Confirm Transaction',
                text: 'Are you sure you want to complete this transaction? This will update the stock and clear your cart.',
                icon: 'warning',
                confirmButtonText: 'Yes, confirm',
                cancelButtonText: 'Cancel'
            });

            if (confirmResult.isConfirmed) {
                // Call checkout API
                const response = await apiService.post(`/user/${user._id}/cart/checkout`, {
                    items: cart.items.map(item => ({
                        phoneId: item.phone._id,
                        quantity: item.quantity
                    }))
                });
                
                if (response.success) {
                    // Show success message with auto close
                    await SwalService.success('Transaction Successful!');
                    
                    // Clear the cart in the UI
                    setCart({ ...cart, items: [] });
                    
                    // Redirect to home page
                    navigate('/', { replace: true });
                } else {
                    throw new Error(response.message || 'Transaction failed');
                }
            }
        } catch (err) {
            console.error('Checkout error:', err);
            SwalService.error(err.response?.data?.message || 'An error occurred during checkout. Please try again later.');
        } finally {
            setIsCheckingOut(false);
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
            SwalService.error('Logout Failed, please try again later');
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

    // Empty cart state
    if (!cart || !cart.items || cart.items.length === 0) {
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
                    Your cart is empty. Start shopping!
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
            
            <h1 className="mb-4 text-center">Shopping Cart</h1>
            
            <Row>
                <Col md={8}>
                    {cart.items.map((item) => (
                        <Card key={item.phone._id} className="mb-3">
                            <Card.Body>
                                <Row className="align-items-center">
                                    <Col md={2}>
                                        <img
                                            src={`http://localhost:7777${item.phone.image}`}
                                            alt={item.phone.title}
                                            className="img-fluid"
                                        />
                                    </Col>
                                    <Col md={4}>
                                        <h5 className="mb-0">{item.phone.title}</h5>
                                        <p className="text-muted mb-0">Brand: {item.phone.brand}</p>
                                    </Col>
                                    <Col md={2}>
                                        <div className="d-flex align-items-center">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => {
                                                    if (item.quantity === 1) {
                                                        // If current quantity is 1, clicking minus will trigger removal
                                                        updateQuantity(item.phone._id, 0);
                                                    } else {
                                                        updateQuantity(item.phone._id, item.quantity - 1);
                                                    }
                                                }}
                                            >
                                                <Dash />
                                            </Button>
                                            <Form.Control
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newQuantity = parseInt(e.target.value);
                                                    if (!isNaN(newQuantity)) {
                                                        updateQuantity(item.phone._id, newQuantity);
                                                    }
                                                }}
                                                min="0"
                                                max={item.phone.stock}
                                                className="mx-2 text-center"
                                                style={{ width: '60px' }}
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => updateQuantity(item.phone._id, item.quantity + 1)}
                                                disabled={item.quantity >= item.phone.stock}
                                            >
                                                <Plus />
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col md={2}>
                                        <h5 className="mb-0">${(item.phone.price * item.quantity).toFixed(2)}</h5>
                                        <small className="text-muted">Price: ${item.phone.price.toFixed(2)}</small>
                                    </Col>
                                    <Col md={2} className="text-end">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeItem(item.phone._id)}
                                        >
                                            <Trash />
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}
                </Col>
                <Col md={4}>
                    <Card>
                        <Card.Body>
                            <h4 className="mb-3">Order Summary</h4>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Items:</span>
                                <span>{cart.items.reduce((total, item) => total + item.quantity, 0)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                                <span>Total Price:</span>
                                <span className="h5 mb-0">${calculateTotal().toFixed(2)}</span>
                            </div>
                            <Button 
                                variant="primary" 
                                className="w-100"
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                            >
                                {isCheckingOut ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Transaction'
                                )}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CartPage; 