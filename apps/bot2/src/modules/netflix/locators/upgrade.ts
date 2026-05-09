/**
 * Netflix Plan Upgrade Locators
 * Dikonfirmasi dari inspeksi DOM langsung pada halaman netflix.com/changeplan
 *
 * Struktur DOM:
 *   Mobile:    <label data-uia="plan-selection+option+4120" for="select-4120">
 *   Standard:  <label data-uia="plan-selection+option+3088" for="select-3088">
 *   Premium:   <label data-uia="plan-selection+option+3108" for="select-3108">
 *
 * Plan yang sudah aktif ditandai dengan div[data-uia="selected-indicator"] di dalam label-nya.
 */

export const UPGRADE_LOCATORS = {
  // Klik label plan berdasarkan ID — Selector utama
  planChoice: (planId: string) => `label[data-uia="plan-selection+option+${planId}"]`,

  // Input radio terkait
  planInput: (planId: string) => `input#select-${planId}`,

  // Cek apakah plan ini sudah aktif (ada selected-indicator di dalamnya)
  selectedIndicator: (planId: string) =>
    `label[data-uia="plan-selection+option+${planId}"] [data-uia="selected-indicator"]`,

  // Tombol Lanjutkan — coba beberapa kemungkinan data-uia
  continueButton: [
    'button[data-uia="plan-selection-continue"]',
    'button[data-uia="continue-button"]',
    'button[data-uia="action-next"]',
  ].join(', '),

  // Tombol Konfirmasi di halaman review perubahan plan
  // DOM aktual: <button data-uia="action-button">Confirm</button>
  confirmUpgradeButton: [
    'button[data-uia="action-button"]',
    'button[data-uia="action-confirm-plan-change"]',
    'button[data-uia="btn-confirm"]',
  ].join(', '),

  // Indikator sukses
  successMessage: '[data-uia="success-message"]',
  // Teks sukses dari DOM aktual setelah upgrade berhasil
  successText: 'text="You\'ve successfully changed your plan"',

  // Alert jika tidak bisa upgrade (kemungkinan sudah di plan target)
  alreadyOnPlanAlert: '[data-uia="plan-selection-already-on-plan"]',
};
