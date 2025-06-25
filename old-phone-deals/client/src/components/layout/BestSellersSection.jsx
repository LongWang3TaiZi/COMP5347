import React from 'react';
import { Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PhoneCard from './PhoneCard';

/**
 * component for displaying the best sellers section
 * @param {Object} props - component props
 * @param {Array} props.phones - array of phone data objects with ratings
 */
const BestSellersSection = ({ phones }) => {
  const navigate = useNavigate();
  
  /**
   * handle phone selection/click
   * @param {string} phoneId - id of the selected phone
   */
  const handlePhoneSelect = (phoneId) => {
    navigate(`/phone/${phoneId}`);
  };

  return (
    <section className="mb-5">
      <h2 className="fs-2 fw-bold mb-2 text-dark">Best Sellers</h2>
      
      <Row xs={1} sm={2} md={3} lg={5} className="g-4">
        {phones.length > 0 ? (
          phones.map(phone => (
            <Col key={phone._id}>
              <PhoneCard 
                phone={phone}
                type="bestSeller" 
                onPhoneSelect={handlePhoneSelect}
              />
            </Col>
          ))
        ) : (
          <Col xs={12}>
            <div className="p-4 text-center bg-light rounded text-secondary fst-italic">
              No top-rated phones available at the moment
            </div>
          </Col>
        )}
      </Row>
    </section>
  );
};

export default BestSellersSection;