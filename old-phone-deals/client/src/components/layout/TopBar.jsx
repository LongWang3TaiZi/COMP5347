import React, { useState } from 'react';
import { Navbar, Form, FormControl, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cart, Search, Heart } from 'react-bootstrap-icons';
import styles from '../../styles/layout/TopBar.module.css';
import SwalService from '../../service/SwalService';

const TopBar = () => {
    const { isAuthenticated, user, logout, isLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    /**
     * Handle search form submission
     * @param {Event} e - form submission event
     */
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const params = new URLSearchParams();
            params.append('q', searchQuery.trim());
            navigate(`/?${params.toString()}`);
        }
    };

    /**
     * Handle checkout button click
     */
    const handleCheckout = () => {
        if (!isAuthenticated) {
            SwalService.warning('Please Sign-in to checkout');
            return;
        }
        navigate('/cart');
    };

    /**
     * Handle wishlist button click
     */
    const handleWishlist = () => {
        if (!isAuthenticated) {
            SwalService.warning('Please Sign-in to view wishlist');
            return;
        }
        navigate('/wishlist');
    };

    return (
        <div className={styles.topBarContainer}>
            {/* left section */}
            <div className={styles.logoContainer}>
                <h4 className={styles.logoTitle}>
                    <Link to="/" className={styles.logoLink}>
                        OldPhoneDeals
                    </Link>
                </h4>
            </div>

            {/* middle section */}
            <div className={styles.searchContainer}>
                <Form className="w-100" onSubmit={handleSearch}>
                    <InputGroup>
                        <FormControl
                            type="search"
                            placeholder="Search phones..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                            aria-label="Search"
                        />
                        <Button variant="primary" type="submit">
                            <Search />
                        </Button>
                    </InputGroup>
                </Form>
            </div>

            {/* right section: button group */}
            <div className={styles.actionsContainer}>
                <Button 
                    variant="outline-primary" 
                    className="me-2"
                    onClick={handleCheckout}
                >
                    <Cart className="me-1" /> Checkout
                </Button>
                <Button 
                    variant="outline-danger" 
                    className="me-2"
                    onClick={handleWishlist}
                >
                    <Heart className="me-1" /> Wishlist
                </Button>
                {isLoading ? (
                    // if loading initial state
                    <span className="text-secondary fs-6">Loading...</span>
                ) : isAuthenticated ? (
                    // if logged in
                    <div className="d-flex align-items-center">
                        <span className="me-2">Hello, {user?.firstname || 'User'}!</span>
                        <Link to="/profile" className="me-2">
                            <Button variant="outline-secondary">Profile</Button>
                        </Link>
                        <Button variant="danger" onClick={logout}>
                            Signout
                        </Button>
                    </div>
                ) : (
                    // if not logged in
                    <div className="d-flex">
                        <Link 
                            to="/auth?signup=true" 
                            replace
                            className="me-2"
                            onClick={() => {
                                localStorage.setItem('redirectAfterEmailVerification', window.location.pathname + window.location.search);
                                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                            }}
                        >
                            <Button variant="outline-primary">Register</Button>
                        </Link>
                        <Link
                            to="/auth"
                            replace
                            onClick={() => {
                                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                            }}
                        >
                            <Button variant="primary">Sign-in</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopBar;