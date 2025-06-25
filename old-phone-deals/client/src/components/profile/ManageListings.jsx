import React from 'react';
import { Table, Button, Card, Spinner, Alert, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { PlusCircle, PencilSquare, Trash, ToggleOn, ToggleOff } from 'react-bootstrap-icons';
import SwalService from '../../service/SwalService';

/**
 * Manage user product list component
 * @param {Object} props - Component properties
 * @param {Array} props.listings - Product list data
 * @param {boolean} props.listingsLoading - Product list loading state
 * @param {Object} props.listingData - New product form data
 * @param {Object} props.listingErrors - New product form error information
 * @param {Function} props.setListingData - Function to update product form data
 * @param {boolean} props.showAddListingModal - Whether to show the add product modal
 * @param {Function} props.setShowAddListingModal - Function to control the display/hide of the add product modal
 * @param {Function} props.addNewListing - Add new product function
 * @param {Function} props.togglePhoneStatus - Toggle product status function
 * @param {Function} props.deletePhoneListing - Delete product function
 * @param {Function} props.fetchUserListings - Function to fetch latest user listings
 * @param {boolean} props.loading - Global loading state
 */
const ManageListings = ({
  listings,
  listingsLoading,
  listingData,
  listingErrors,
  setListingData,
  showAddListingModal,
  setShowAddListingModal,
  addNewListing,
  togglePhoneStatus,
  deletePhoneListing,
  fetchUserListings,
  loading
}) => {
  // handle form input change
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // clear error message
    if (listingErrors[name]) {
      setListingErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // update form data
    setListingData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  // handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // validate file type
      if (!file.type.startsWith('image/')) {
        setListingData(prev => ({
          ...prev,
          image: null,
          error: 'please upload an image file'
        }));
        return;
      }
      
      // validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setListingData(prev => ({
          ...prev,
          image: null,
          error: 'Image size cannot exceed 10MB, images will be automatically compressed'
        }));
        return;
      }
      
      // validate file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
      if (!allowedExtensions.includes(fileExtension)) {
        setListingData(prev => ({
          ...prev,
          image: null,
          error: 'only JPG, JPEG, PNG, GIF format images are supported'
        }));
        return;
      }
      
      // update listingData, save file object
      setListingData(prev => ({
        ...prev,
        image: file,
        error: null
      }));
    } else {
      // if no file is selected, set to null
      setListingData(prev => ({
        ...prev,
        image: null,
        error: null
      }));
    }
  };

  // clear image preview
  const clearImagePreview = () => {
    if (listingData.image) {
      // if image is a file object, release URL
      if (listingData.image instanceof File) {
        URL.revokeObjectURL(URL.createObjectURL(listingData.image));
      }
    }
    setListingData(prev => ({
      ...prev,
      image: null
    }));
  };

  // check if item is disabled
  const isItemDisabled = (item) => {
    return 'disabled' in item;
  };
  
  // handle toggle phone status with confirmation
  const handleTogglePhoneStatus = async (phoneId, item) => {
    try {
      // determine the action based on current status
      const isDisabled = isItemDisabled(item);
      const actionText = isDisabled ? 'Enable' : 'Disable';

      // show confirmation dialog
      const result = await SwalService.confirm({
        title: `${actionText} Product`,
        text: `Are you sure you want to ${actionText.toLowerCase()} this product?`,
        icon: 'warning',
        confirmButtonText: `Yes, ${actionText.toLowerCase()} it`,
        cancelButtonText: 'Cancel'
      });
      
      // if user confirmed, proceed with the status change
      if (result.isConfirmed) {
        const updatedItem = await togglePhoneStatus(phoneId);
        
        // show success message
        if (updatedItem) {
          await SwalService.success(`Product ${actionText.toLowerCase()}d successfully`);
          
        } 
      }
    } catch (error) {
      SwalService.error('Failed to update product status. Please try again later.');
    }
  };
  
  // handle delete phone listing with confirmation
  const handleDeletePhoneListing = async (phoneId) => {
    try {
      // show delete confirmation dialog
      const result = await SwalService.deleteConfirm(
        'Are you sure you want to delete this product? This action cannot be undone.',
        'Delete Product'
      );
      
      // if user confirmed, proceed with deletion
      if (result.isConfirmed) {
        const success = await deletePhoneListing(phoneId);
        
        // show success message if deletion was successful
        if (success) {
          await SwalService.success('Product deleted successfully');
          
  
        }
      }
    } catch (error) {
      SwalService.error('Failed to delete product. Please try again later.');
    }
  };

  // add product modal
  const renderAddListingModal = () => (
    <Modal
      show={showAddListingModal}
      onHide={() => setShowAddListingModal(false)}
      backdrop="static"
      keyboard={false}
      centered
      aria-labelledby="add-product-modal-title"
      restoreFocus={true}
    >
      <Modal.Header closeButton>
        <Modal.Title id="add-product-modal-title">Add new product</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={(e) => {
          e.preventDefault();
          
          // process form data
          const formData = {
            title: listingData.title?.trim() || '',
            brand: listingData.brand?.trim() || '',
            price: listingData.price ? parseFloat(listingData.price) : 0,
            stock: listingData.stock ? parseInt(listingData.stock) : 0,
            image: listingData.image || null
          };
          
          // check required fields
          if (!formData.title) {
            setListingData(prev => ({
              ...prev,
              error: 'title cannot be empty'
            }));
            return;
          }
          if (!formData.brand) {
            setListingData(prev => ({
              ...prev,
              error: 'brand cannot be empty'
            }));
            return;
          }
          if (!formData.price || formData.price <= 0) {
            setListingData(prev => ({
              ...prev,
              error: 'the price must be greater than 0'
            }));
            return;
          }
          if (!formData.stock || formData.stock < 0) {
            setListingData(prev => ({
              ...prev,
              error: 'the stock cannot be negative'
            }));
            return;
          }
          
          try {
          
            addNewListing(e, formData);
          } catch (error) {
            console.error('error when submitting the form:', error);
            setListingData(prev => ({
              ...prev,
              error: error.message || 'failed to submit, please try again'
            }));
          }
        }}>
          <Form.Group className="mb-3">
            <Form.Label>Product title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={listingData.title}
              onChange={handleChange}
              isInvalid={!!listingErrors.title}
            />
            <Form.Control.Feedback type="invalid">
              {listingErrors.title}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Brand</Form.Label>
            <Form.Control
              type="text"
              name="brand"
              value={listingData.brand}
              onChange={handleChange}
              isInvalid={!!listingErrors.brand}
            />
            <Form.Control.Feedback type="invalid">
              {listingErrors.brand}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Product Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              isInvalid={!!listingErrors.image}
            />
            <Form.Control.Feedback type="invalid">
              {listingErrors.image}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Supported formats: JPG, PNG, GIF. Max size: 10MB (large images will be compressed)
            </Form.Text>
            {listingData.image && (
              <div className="mt-2">
                <img 
                  src={URL.createObjectURL(listingData.image)} 
                  alt="Preview" 
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }} 
                />
                <Button 
                  variant="danger" 
                  size="sm" 
                  className="ms-2"
                  onClick={clearImagePreview}
                >
                  Remove
                </Button>
              </div>
            )}
          </Form.Group>
          
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  name="price"
                  value={listingData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  isInvalid={!!listingErrors.price}
                />
                <Form.Control.Feedback type="invalid">
                  {listingErrors.price}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  name="stock"
                  value={listingData.stock}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  isInvalid={!!listingErrors.stock}
                />
                <Form.Control.Feedback type="invalid">
                  {listingErrors.stock}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button 
              variant="secondary" 
              onClick={() => setShowAddListingModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add product'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>My products</Card.Title>
            <Button 
              variant="success" 
              size="sm"
              onClick={() => setShowAddListingModal(true)}
            >
              <PlusCircle className="me-1" /> Add new product
            </Button>
          </div>
          
          {listingsLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading products...</p>
            </div>
          ) : !listings ? (
            <Alert variant="danger">
              Error fetching product data. Please refresh the page and try again.
            </Alert>
          ) : !Array.isArray(listings) ? (
            <Alert variant="danger">
              Product data format is incorrect. Please contact the administrator.
            </Alert>
          ) : listings.length === 0 ? (
            <Alert variant="info">
              You have not published any products yet. Click the "Add new product" button to start publishing.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(item => (
                    <tr key={item._id}>
                      <td>{item.title}</td>
                      <td>{item.brand}</td>
                      <td>¥{item.price !== undefined && !isNaN(item.price) ? Number(item.price).toFixed(2) : '0.00'}</td>
                      <td>{item.stock !== undefined && !isNaN(item.stock) ? item.stock : 0}</td>
                      <td>
                        {!isItemDisabled(item) ? (
                          <Badge bg="success">Enabled</Badge>
                        ) : (
                          <Badge bg="secondary">Disabled</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            variant={!isItemDisabled(item) ? "warning" : "success"} 
                            size="sm"
                            onClick={() => handleTogglePhoneStatus(item._id, item)}
                            disabled={loading}
                          >
                            {!isItemDisabled(item) ? (
                              <><ToggleOff className="me-1" /> Disable</>
                            ) : (
                              <><ToggleOn className="me-1" /> Enable</>
                            )}
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeletePhoneListing(item._id)}
                            disabled={loading}
                          >
                            <Trash className="me-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {renderAddListingModal()}
    </>
  );
};

ManageListings.propTypes = {
  listings: PropTypes.array,
  listingsLoading: PropTypes.bool.isRequired,
  listingData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
  }).isRequired,
  listingErrors: PropTypes.object.isRequired,
  setListingData: PropTypes.func.isRequired,
  showAddListingModal: PropTypes.bool.isRequired,
  setShowAddListingModal: PropTypes.func.isRequired,
  addNewListing: PropTypes.func.isRequired,
  togglePhoneStatus: PropTypes.func.isRequired,
  deletePhoneListing: PropTypes.func.isRequired,
  fetchUserListings: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired
};

export default ManageListings; 