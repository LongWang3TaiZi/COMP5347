/**
 * Checks if the provided string is a valid email address.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if the email is valid, false otherwise.
 */
export const isValidEmail = (email) => {
  if (!email) {
    return false;
  }
  // Basic email regex, consider using a more robust one if needed
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
}; 