import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * modal component for selecting product quantity
 * @param {Object} props - component props
 * @param {boolean} props.show - whether to show the modal
 * @param {function} props.onHide - function to call when hiding the modal
 * @param {number} props.quantity - current quantity value
 * @param {function} props.setQuantity - function to update quantity
 * @param {number} props.maxStock - maximum available stock
 * @param {function} props.onConfirm - function to call when confirming selection
 */
const QuantityModal = ({show, onHide, quantity, setQuantity, maxStock, onConfirm }) => {
    /**
     * handle quantity change and ensure it's within valid range
     * @param {Event} e - input change event
     */
    const handleQuantityChange = (e) => {
       
        if (e.target.value === '') {
            setQuantity('');
            return;
        }
        
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setQuantity(value);
        }
    };

    const handleBlur = () => {
        if (quantity === '' || isNaN(quantity)) {
            setQuantity(1);
            return;
        }
        
        setQuantity(Math.min(Math.max(1, quantity), maxStock));
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Select Quantity</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                <Form.Group>
                    <Form.Label>How many would you like?</Form.Label>
                    <Form.Control 
                        type="number" 
                        min="1" 
                        max={maxStock} 
                        value={quantity} 
                        onChange={handleQuantityChange} 
                        onBlur={handleBlur} 
                        step="1"
                    />
                    <Form.Text className="text-muted">
                        {maxStock} available in stock
                    </Form.Text>
                </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm}>
                    Add to Cart
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default QuantityModal;