import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
// import bootstrap components
import {Nav, Button, Container} from 'react-bootstrap';
// import sidebar css
import styles from '../../styles/admin/Sidebar.module.css';
// import icons
import {
    PeopleFill,
    ListCheck,
    BarChartLineFill,
    ChatDotsFill,
    BoxArrowRight
} from 'react-bootstrap-icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SwalService from '../../service/SwalService';

// receive expanded state from props
const Sidebar = ({activeSection, setActiveSection, expanded, toggleSidebar}) => {
    // set sidebar class name based on expanded state
    const sidebarClass = `${styles.sidebar} ${expanded ? styles.sidebarExpanded : ''}`;
    const { logout } = useAuth();
    const navigate = useNavigate();

    // handle logout functionality
    const handleLogout = async () => {
        try {
            const logoutSuccess = await logout();
            // if the user cancels the logout, do nothing
            if (!logoutSuccess) {
                return;
            }
            await SwalService.success('Logout Success');
            // Navigate to home page instead of admin login page
            navigate('/admin/login');
        } catch (error) {
            console.error('Signout failed:', error);
            await SwalService.error('Logout Failed, please try again later');
        }
    };

    return (
        <div className={`${sidebarClass} bg-dark text-light d-flex flex-column h-100`}>
            <Container fluid className="p-0 d-flex flex-column h-100">
                <div className={`${styles.brandContainer} py-3 text-center`}>
                    <h5 className="mb-0">OldPhoneDeals Admin Management</h5>
                </div>

                <Nav className="flex-column mt-3">
                    <Nav.Link
                        className={`${styles.navItem} ${activeSection === 'users' ? styles.activeNavItem : ''}`}
                        onClick={() => setActiveSection('users')}
                    >
                        <PeopleFill className={`${styles.icon} me-2`}/>
                        <span className={styles.navItemText}>User Management</span>
                    </Nav.Link>

                    <Nav.Link
                        className={`${styles.navItem} ${activeSection === 'phones' ? styles.activeNavItem : ''}`}
                        onClick={() => setActiveSection('phones')}
                    >
                        <ListCheck className={`me-2`}/>
                        <span className={styles.navItemText}>Listing Management</span>
                    </Nav.Link>

                    <Nav.Link
                        className={`${styles.navItem} ${activeSection === 'reviews' ? styles.activeNavItem : ''}`}
                        onClick={() => setActiveSection('reviews')}
                    >
                        <ChatDotsFill className={`me-2`}/>
                        <span className={styles.navItemText}>Review & Comment</span>
                    </Nav.Link>

                    <Nav.Link
                        className={`${styles.navItem} ${activeSection === 'sales' ? styles.activeNavItem : ''}`}
                        onClick={() => setActiveSection('sales')}
                    >
                        <BarChartLineFill className={`me-2`}/>
                        <span className={styles.navItemText}>Sales & Activity Logs</span>
                    </Nav.Link>
                </Nav>

                <div className="mt-auto p-3 border-top border-secondary">
                    <Button
                        variant="danger"
                        className="w-100 d-flex align-items-center justify-content-center"
                        onClick={handleLogout}
                    >
                        <BoxArrowRight className="me-2"/>
                        <span className={styles.navItemText}>Logout</span>
                    </Button>
                </div>
            </Container>
        </div>
    );
};

export default Sidebar;