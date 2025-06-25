import Swal from 'sweetalert2';

/**
 * SwalService - utility service for displaying SweetAlert2 dialogs
 */
const SwalService = {
    /**
     * display a confirmation dialog
     * @param {Object} options - configuration options
     * @param {string} options.title - dialog title
     * @param {string} options.text - dialog message
     * @param {string} [options.icon='question'] - dialog icon (question, warning, error, success, info)
     * @param {string} [options.confirmButtonText='Yes'] - confirm button text
     * @param {string} [options.cancelButtonText='Cancel'] - cancel button text
     * @param {string} [options.confirmButtonColor='#3085d6'] - confirm button color
     * @returns {Promise} - returns the Swal result
     */
    confirm: async (options) => {
        const {
            title,
            text,
            icon = 'question',
            confirmButtonText = 'Yes',
            cancelButtonText = 'Cancel',
            confirmButtonColor = '#3085d6'
        } = options;

        return Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonColor,
            confirmButtonText,
            cancelButtonText
        });
    },

    /**
     * display a success message
     * @param {string} message - success message to display
     * @param {string} [title='Success'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    success: async (message, title = 'Success') => {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    },

    /**
     * display an error message
     * @param {string} message - error message to display
     * @param {string} [title='Error'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    error: async (message, title = 'Error') => {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    },

    /**
     * display an info message
     * @param {string} message - info message to display
     * @param {string} [title='Information'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    info: async (message, title = 'Information') => {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    },

    /**
     * display a warning message
     * @param {string} message - warning message to display
     * @param {string} [title='Warning'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    warning: async (message, title = 'Warning') => {
        return Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            confirmButtonText: 'OK'
        });
    },

    /**
     * display a delete confirmation dialog
     * @param {string} [text='Are you sure you want to delete this item? This action cannot be undone.'] - dialog message
     * @param {string} [title='Delete Confirmation'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    deleteConfirm: async (text = 'Are you sure you want to delete this item? This action cannot be undone.', title = 'Delete Confirmation') => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });
    },

    /**
     * display an update confirmation dialog
     * @param {string} [text='Are you sure you want to update this item?'] - dialog message
     * @param {string} [title='Update Confirmation'] - dialog title
     * @returns {Promise} - returns the Swal result
     */
    updateConfirm: async (text = 'Are you sure you want to update this item?', title = 'Update Confirmation') => {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'Cancel'
        });
    }
};

export default SwalService;