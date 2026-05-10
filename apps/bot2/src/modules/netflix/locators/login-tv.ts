/**
 * Locators for Netflix Login TV Flow
 */
export const TV_LOGIN_LOCATORS = {
  // Input fields for 8-digit PIN (data-uia="pin-number-0" to "pin-number-7")
  PIN_INPUTS: 'input[data-uia^="pin-number-"]',
  
  // Submit button
  SUBMIT_BUTTON: 'button[data-uia="witcher-code-submit"]',
  
  // Final button after successful PIN entry
  GO_TO_NETFLIX_BUTTON: 'button[data-uia="btn-witcher-navigate-home"]',
  
  // Error message content
  ERROR_MESSAGE: 'div[data-uia="UIMessage-content"]',
  
  // Successfully verified check (optional but good for tracking)
  SUCCESS_CONTAINER: '.tvsignup-success-container',
};
