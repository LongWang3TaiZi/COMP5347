import { useState, useEffect } from 'react';
import apiService from "../service/ApiService";

/**
 * view model for home page that handles data fetching and business logic
 * @returns {Object} state and methods for the home page
 */
const useHomeViewModel = () => {
    // state management
    const [soldOutSoon, setSoldOutSoon] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // fetch data when component mounts
    useEffect(() => {
        fetchHomeData();
    }, []);

    /**
     * fetch both sold out soon and best seller phone data
     */
    const fetchHomeData = async () => {
        try {
            setLoading(true);

            // fetch both data sets in parallel
            const [soldOutSoonRes, bestSellersRes] = await Promise.all([
                apiService.get('/phone/sold-out-soon'),
                apiService.get('/phone/best-sellers')
            ]);
            setSoldOutSoon(soldOutSoonRes.data);
            setBestSellers(bestSellersRes.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching home data:', err);
            setError('Failed to load featured phones. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // return state and methods
    return {
        soldOutSoon,
        bestSellers,
        loading,
        error,
        refreshData: fetchHomeData
    };
};

export default useHomeViewModel;