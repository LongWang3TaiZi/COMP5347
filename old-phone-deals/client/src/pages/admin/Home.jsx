import React, {useState, useEffect} from 'react';
import {Container, Row, Col, Button, Toast, ToastContainer} from 'react-bootstrap';
import Sidebar from '../../components/admin/Sidebar';
import 'bootstrap/dist/css/bootstrap.min.css';
import styles from '../../styles/admin/AdminHome.module.css';
import UserManagement from '../../components/admin/UserManagement';
import PhoneManagement from "../../components/admin/PhoneManagement";
import ReviewManagement from "../../components/admin/ReviewManagement";
import SalesManagement from "../../components/admin/SalesManagement";
import {List, CurrencyDollar} from 'react-bootstrap-icons';
import webSocketService from '../../service/WebSocketService';

const AdminHome = () => {
    // state management
    const [activeSection, setActiveSection] = useState('users');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Generate unique ID for toasts
    const generateUniqueId = () => `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // WebSocket notification handler
    const handleWebSocketMessage = (wsMessage) => {
        if (wsMessage.type === 'NEW_ORDER') {
            const newToast = {
                id: generateUniqueId(),
                title: 'New Order Received',
                message: `Order from ${wsMessage.data.user.firstname} ${wsMessage.data.user.lastname}\nTotal: $${wsMessage.data.totalAmount}`
            };
            
            // Remove any existing toasts with the same message to prevent duplicates
            setToasts(prev => {
                const filteredToasts = prev.filter(toast => 
                    toast.message !== newToast.message
                );
                return [...filteredToasts, newToast];
            });

            // Auto remove toast after 8 seconds
            setTimeout(() => {
                setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
            }, 8000);
        }
    };

    // Initialize WebSocket connection
    useEffect(() => {
        // Clean up any existing WebSocket connections
        webSocketService.disconnect();
        
        // Initialize new connection
        webSocketService.connect();
        const unsubscribe = webSocketService.subscribe(handleWebSocketMessage);

        return () => {
            unsubscribe();
            webSocketService.disconnect();
        };
    }, []);

    // toggle sidebar visibility (for mobile)
    const toggleSidebar = () => {
        setSidebarExpanded(!sidebarExpanded);
    };

    // close sidebar when window is resized to desktop size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 576 && sidebarExpanded) {
                setSidebarExpanded(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarExpanded]);

    // set class name for main content area based on sidebar state
    const contentWrapperClass = `${styles.contentWrapper} ${
        sidebarExpanded ? styles.contentWrapperWithExpandedSidebar : ''
    }`;

    // render user management section
    const renderUsers = () => (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h1 className="h3">User Management</h1>
                <Button
                    variant="light"
                    className="d-md-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <List size={24}/>
                </Button>
            </div>
            <UserManagement/>
        </>
    );

    // render phones management section
    const renderPhones = () => (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h1 className="h3">Listing Management</h1>
                <Button
                    variant="light"
                    className="d-md-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <List size={24}/>
                </Button>
            </div>
            <PhoneManagement/>
        </>
    );

    // render reviews management section
    const renderReviews = () => (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h1 className="h3">Review & Comment Management</h1>
                <Button
                    variant="light"
                    className="d-md-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <List size={24}/>
                </Button>
            </div>
            <ReviewManagement/>
        </>
    );

    // render sales management section
    const renderSales = () => (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                <h1 className="h3">Sales & Activity Logs</h1>
                <Button
                    variant="light"
                    className="d-md-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle sidebar"
                >
                    <List size={24}/>
                </Button>
            </div>
            <SalesManagement/>
        </>
    );

    // render content based on active section
    const renderContent = () => {
        switch (activeSection) {
            case 'users':
                return renderUsers();
            case 'phones':
                return renderPhones();
            case 'reviews':
                return renderReviews();
            case 'sales':
                return renderSales();
            default:
                return renderUsers();
        }
    };

    return (
        <div className="d-flex min-vh-100">
            {/* sidebar component */}
            <Sidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                expanded={sidebarExpanded}
                toggleSidebar={toggleSidebar}
            />

            {/* main content area */}
            <div className={contentWrapperClass}>
                {/* overlay for mobile - clicking it closes the sidebar */}
                <div
                    className={styles.overlay}
                    onClick={toggleSidebar}
                    role="button"
                    tabIndex={0}
                    aria-label="Close sidebar"
                ></div>

                <Container fluid className="p-4">
                    {renderContent()}
                </Container>

                {/* Toast Container */}
                <ToastContainer 
                    className="p-3" 
                    position="top-end"
                    style={{ zIndex: 1056 }}
                >
                    {toasts.map(toast => (
                        <Toast 
                            key={toast.id}
                            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className={styles.orderNotification}
                            show={true}
                            autohide
                            delay={8000}
                        >
                            <Toast.Header closeButton>
                                <CurrencyDollar className="me-2" style={{ color: '#198754' }}/>
                                <strong className="me-auto">{toast.title}</strong>
                            </Toast.Header>
                            <Toast.Body style={{ whiteSpace: 'pre-line' }}>
                                {toast.message}
                            </Toast.Body>
                        </Toast>
                    ))}
                </ToastContainer>
            </div>
        </div>
    );
};

export default AdminHome;