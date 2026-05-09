/**
 * Netflix Plan Upgrade Locators
 */

export const UPGRADE_LOCATORS = {
  // Plan Selection (data-uia contains the plan ID)
  planChoice: (id: string) => `button[data-uia="plan-choice+${id}"]`,
  
  // Continue / Confirm Button in Plan Selection Page
  continueButton: 'button[data-uia="continue-button"]',
  
  // Confirm Button in the final "Confirm your plan change" page
  confirmUpgradeButton: 'button[data-uia="action-confirm-plan-change"]',
  
  // Success Message indicators
  successMessage: '[data-uia="success-message"]',
  backToAccountButton: 'a[data-uia="back-to-account-button"]',

  // Error/Alert if already on Premium or cannot upgrade
  alreadyOnPlanAlert: '[data-uia="plan-selection-already-on-plan"]',
};
