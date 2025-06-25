import React from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import useHomeViewModel from '../../viewModels/HomeViewModel';
import SoldOutSoonSection from '../../components/layout/SoldOutSoonSection';
import BestSellersSection from '../../components/layout/BestSellersSection';
import SearchResults from '../../components/layout/SearchResults';
import { useLocation } from 'react-router-dom';

/**
 * home page component that displays featured phone sections
 */
const HomePage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('q');

    // use the view model to handle data and business logic
    const { soldOutSoon, bestSellers, loading, error } = useHomeViewModel();

    // loading state
    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    // error state
    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Search Results Section - only show when there's a search query */}
            {searchQuery && <SearchResults />}

            {/* Featured Sections - only show when there's no search query */}
            {!searchQuery && (
                <>
                    {/* Sold Out Soon Section */}
                    <SoldOutSoonSection phones={soldOutSoon} />

                    {/* Best Sellers Section */}
                    <BestSellersSection phones={bestSellers} />
                </>
            )}
        </Container>
    );
};

export default HomePage;