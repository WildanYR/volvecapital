/**
 * Locators untuk Netflix Auto Reload Flow
 */

// Langkah 2: Cek tombol restart membership (ada = expired, tidak ada = perlu cancel dulu)
export const getRestartMembershipButton = (page: any) =>
  page.locator('[data-uia="restart-button"]');

// Langkah 2 (sub-alur cancel): Tombol expand "Tampilkan isi pilihan"
export const getExpandCancelButton = (page: any) =>
  page.locator('[data-uia="cancel-option-expand"] button, [data-uia="icon-button"][aria-label*="option"], [data-uia="icon-button"][aria-label*="pilihan"]');

// Langkah 2 (sub-alur cancel): Tombol "Selesaikan Pembatalan"
export const getFinishCancellationButton = (page: any) =>
  page.locator('[data-uia="action-finish-cancellation"]');

// Langkah 4: Tombol "Mulai Lagi Keanggotaanmu"
export const getRestartHeroButton = (page: any) =>
  page.locator('[data-uia="nmhp-card-cta+hero_card"]');

// Langkah 5: Halaman "Selamat datang kembali!" — deteksi dengan h1 (bilingual)
export const getWelcomeBackHeading = (page: any) =>
  page.locator('h1, h2, [data-uia="welcome-back-heading"]').filter({
    hasText: /Selamat datang kembali|Welcome back|Mulai Kembali|Restart your/i,
  });

// Langkah 5: Tombol "Berikutnya" (Next) di halaman welcome back
export const getNextButton = (page: any) =>
  page.locator('[data-uia="cta-button"]');

// Langkah 6: Label plan Ponsel/Mobile (Harian & Mingguan)
export const getMobilePlanLabel = (page: any) =>
  page.locator('[data-uia="plan-selection+option+4120"]');

// Langkah 6: Label plan Standar/Standard (Bulanan & Sharing Bulanan)
export const getStandardPlanLabel = (page: any) =>
  page.locator('[data-uia="plan-selection+option+3088"]');

// Langkah 6 (New UI): Link "Ubah" untuk mengubah plan
export const getChangePlanLink = (page: any) =>
  page.locator('[data-uia="change-plan-link"]');

// Langkah 7: Tombol "Berikutnya" setelah pilih plan
export const getNextPlanButton = (page: any) =>
  page.locator('[data-uia="cta-plan-selection"]');

// Langkah 8: Halaman "Yang terakhir" — deteksi (bilingual)
export const getLastStepHeading = (page: any) =>
  page.locator('h1').filter({
    hasText: /Yang terakhir|One last thing/i,
  });

// Langkah 8: Tombol "Berikutnya" di halaman terakhir sebelum checkout
export const getLastStepNextButton = (page: any) =>
  page.locator('[data-uia="cta-button"]');

// Langkah 9: Checkbox persetujuan hukum
export const getLegalCheckbox = (page: any) =>
  page.locator('[data-uia="legal-checkbox"]');

// Langkah 9: Teks plan saat ini di halaman checkout
export const getCurrentPlanText = (page: any) =>
  page.locator('p').filter({ hasText: /Ponsel|Mobile|Standar|Standard|Premium|Dasar|Basic/i });

// Langkah 9: Link "Ubah" plan di halaman checkout
export const getChangePlanCheckoutLink = (page: any) =>
  page.locator('a, p, [data-uia="change-plan-link"]').filter({ hasText: /^Ubah$|^Change$/i });


// Langkah 11: Tombol "Mulai Keanggotaan" (Confirm Start)
export const getConfirmStartButton = (page: any) =>
  page.locator('[data-uia="cta-confirm"], [data-uia="cta-confirm-membership"]');

// Langkah 12: Tombol "Berikutnya" di halaman orderfinal (Final Step)
export const getOrderFinalButton = (page: any) =>
  page.locator('[data-uia="cta-order-final"]');
