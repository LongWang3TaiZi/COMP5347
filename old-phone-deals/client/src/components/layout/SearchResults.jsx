import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import PhoneCard from './PhoneCard';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { Range } from 'react-range';
import apiService from '../../service/ApiService';
import SwalService from '../../service/SwalService';

/**
 * Component for displaying search results
 * @returns {JSX.Element} Search results component
 */
const SearchResults = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [brands, setBrands] = useState([]);
    const [filters, setFilters] = useState({
        brand: '',
        minPrice: 0,
        maxPrice: 1000
    });
    const [priceRange, setPriceRange] = useState({
        min: 0,
        max: 1000
    });
    const [isPriceRangeSet, setIsPriceRangeSet] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchOptions, setSearchOptions] = useState({
        search: '',
        brand: '',
        price: { min: undefined, max: undefined },
        page: 1,
        limit: 8
    });

    /**
     * Handle phone selection/click
     * @param {string} phoneId - id of the selected phone
     */
    const handlePhoneSelect = (phoneId) => {
        navigate(`/phone/${phoneId}`);
    };

    /**
     * Handle filter changes
     * @param {Event} e - input change event
     */
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        
        setCurrentPage(1);
        setSearchOptions(prev => ({
            ...prev,
            brand: name === 'brand' ? value : prev.brand,
            price: {
                min: name === 'minPrice' ? parseFloat(value) : prev.price.min,
                max: name === 'maxPrice' ? parseFloat(value) : prev.price.max
            },
            page: 1
        }));
    };

    /**
     * Reset filters and update search results
     */
    const resetFilters = () => {
        setCurrentPage(1);
        setFilters({
            brand: '',
            minPrice: priceRange.min,
            maxPrice: priceRange.max
        });
        setSearchOptions(prev => ({
            ...prev,
            brand: '',
            price: { min: undefined, max: undefined },
            page: 1
        }));
    };

    /**
     * Load more results
     */
    const loadMore = () => {
        if (loading || !hasMore) return;
        setCurrentPage(prev => prev + 1);
        setSearchOptions(prev => ({
            ...prev,
            page: prev.page + 1
        }));
    };

    /**
     * Fetch search results and brands
     */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const searchParams = new URLSearchParams(location.search);
                const search = searchParams.get('q') || '';
                
                if (!isPriceRangeSet) {
                    const rangeResponse = await apiService.get('/phone/search', {
                            search,
                            brand: searchOptions.brand,
                            page: 1,
                            limit: 1000 
                    });

                    if (rangeResponse.success && rangeResponse.data.phones.length > 0) {
                        const prices = rangeResponse.data.phones.map(phone => phone.price);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        setPriceRange({
                            min: minPrice,
                            max: maxPrice
                        });
                        setFilters({
                            brand: '',
                            minPrice: minPrice,
                            maxPrice: maxPrice
                        });
                        setIsPriceRangeSet(true);
                    }
                }

                const response = await apiService.get('/phone/search', {
                        search,
                        brand: searchOptions.brand,
                        minPrice: searchOptions.price.min,
                        maxPrice: searchOptions.price.max,
                        page: currentPage,
                        limit: searchOptions.limit
                });

                if (response.success) {
                    if (currentPage === 1) {
                        setSearchResults(response.data.phones);
                    } else {
                        setSearchResults(prev => [...prev, ...response.data.phones]);
                    }
                    
                    const uniqueBrands = [...new Set(response.data.phones.map(phone => phone.brand))].filter(Boolean);
                    setBrands(uniqueBrands);
                    
                    if (filters.brand && !uniqueBrands.includes(filters.brand)) {
                        setFilters(prev => ({
                            ...prev,
                            brand: ''
                        }));
                        setSearchOptions(prev => ({
                            ...prev,
                            brand: ''
                        }));
                    }
                    
                    setTotalPages(response.data.pagination.totalPages);
                    setHasMore(currentPage < response.data.pagination.totalPages);
                } else {
                    setError('Failed to fetch search results');
                    await SwalService.error('Failed to fetch search results');
                }
            } catch (err) {
                setError(err.message || 'An error occurred while searching');
                await SwalService.error(err.message || 'An error occurred while searching');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentPage, location.search, searchOptions, isPriceRangeSet]);

    useEffect(() => {
        setIsPriceRangeSet(false);
    }, [location.search]);

    if (loading && searchResults.length === 0) {
        return (
            <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-5 text-danger">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <section className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <Link to="/" className="text-decoration-none me-3">
                        <Button variant="outline-secondary">
                            <ArrowLeft className="me-2" />
                            Back to Website
                        </Button>
                    </Link>
                    <h2 className="fs-2 fw-bold text-dark mb-0">Search Results</h2>
                </div>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Brand</Form.Label>
                                    <Form.Select
                                        name="brand"
                                        value={filters.brand}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Brands</option>
                                        {brands.map(brand => (
                                            <option key={brand} value={brand}>
                                                {brand}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={8}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price Range</Form.Label>
                                    <div className="d-flex flex-column">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>${filters.minPrice === filters.maxPrice ? 0 : filters.minPrice}</span>
                                            <span>${filters.maxPrice === filters.minPrice ? filters.maxPrice: filters.maxPrice}</span>
                                        </div>
                                        <div className="px-3">
                                            <Range
                                                values={[filters.minPrice, filters.maxPrice]}
                                                step={1}
                                                min={priceRange.min === priceRange.max ? 0 : priceRange.min}
                                                max={priceRange.min === priceRange.max ? priceRange.max : priceRange.max}
                                                onChange={(values) => {
                                                    const [min, max] = values;
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        minPrice: min,
                                                        maxPrice: max
                                                    }));
                                                    setCurrentPage(1);
                                                    setSearchOptions(prev => ({
                                                        ...prev,
                                                        price: {
                                                            min: min,
                                                            max: max
                                                        },
                                                        page: 1
                                                    }));
                                                }}
                                                renderTrack={({ props, children }) => (
                                                    <div
                                                        {...props}
                                                        style={{
                                                            ...props.style,
                                                            height: '6px',
                                                            width: '100%',
                                                            backgroundColor: '#ddd',
                                                            borderRadius: '3px'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${((filters.minPrice - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                                                                width: `${((filters.maxPrice - filters.minPrice) / (priceRange.max - priceRange.min)) * 100}%`,
                                                                height: '100%',
                                                                backgroundColor: '#0d6efd',
                                                                borderRadius: '3px'
                                                            }}
                                                        />
                                                        {children}
                                                    </div>
                                                )}
                                                renderThumb={({ props, isDragged }) => (
                                                    <div
                                                        {...props}
                                                        style={{
                                                            ...props.style,
                                                            height: '20px',
                                                            width: '20px',
                                                            backgroundColor: '#fff',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            boxShadow: '0px 2px 6px #AAA',
                                                            borderRadius: '50%',
                                                            border: '2px solid #0d6efd'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                height: '8px',
                                                                width: '2px',
                                                                backgroundColor: isDragged ? '#0d6efd' : '#CCC'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end">
                            <Button 
                                variant="outline-secondary" 
                                onClick={resetFilters}
                            >
                                Reset
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
            
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {searchResults.length > 0 ? (
                    searchResults.map(phone => (
                        <Col key={phone._id}>
                            <PhoneCard 
                                phone={phone}
                                onPhoneSelect={handlePhoneSelect}
                                showDetails={true}
                            />
                        </Col>
                    ))
                ) : (
                    <Col xs={12}>
                        <div className="p-4 text-center bg-light rounded text-secondary fst-italic">
                            No phones found matching your search criteria
                        </div>
                    </Col>
                )}
            </Row>

            {hasMore && (
                <div className="text-center mt-4">
                    <Button 
                        variant="outline-primary" 
                        onClick={loadMore}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        ) : null}
                        Load More
                    </Button>
                    <span className="ms-3 text-muted">
                        {totalPages > currentPage ? 
                            `still have ${(totalPages - currentPage) * searchOptions.limit} phones left` : 
                            'already show all results'}
                    </span>
                </div>
            )}
        </section>
    );
};

export default SearchResults;