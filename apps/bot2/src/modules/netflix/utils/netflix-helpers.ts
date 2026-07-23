export function generateRandomPassword(length: number): string {
  const letters = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '0123456789';
  let result = '';
  
  // 3 Karakter pertama: Huruf
  for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 Karakter berikutnya: Angka
  for (let i = 0; i < 3; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return result;
}

export function calculateAccountState(subscriptionExpiry: string): { status: string; reason: string } {
  if (!subscriptionExpiry || subscriptionExpiry === '') {
      return { status: 'ready', reason: 'No expiry date provided' };
  }

  const now = new Date(); 
  const expiry = new Date(subscriptionExpiry);
  
  // Check for invalid date
  if (isNaN(expiry.getTime())) {
      return { status: 'ready', reason: 'Invalid expiry date format' };
  }

  // 1. Jika sudah lewat tanggal secara absolut
  if (now > expiry) {
      return { status: 'disable', reason: 'Sudah lewat tanggal (Kadaluarsa)' };
  }

  // Dapatkan representasi tanggal dalam timezone Asia/Jakarta
  const getWIBParts = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const partMap: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        partMap[part.type] = parseInt(part.value, 10);
      }
    }
    return partMap;
  };

  const nowParts = getWIBParts(now);
  const expiryParts = getWIBParts(expiry);

  // Hitung selisih hari berdasarkan kalender murni di WIB
  const nowDateOnly = new Date(nowParts.year, nowParts.month - 1, nowParts.day);
  const expiryDateOnly = new Date(expiryParts.year, expiryParts.month - 1, expiryParts.day);
  
  const diffTime = expiryDateOnly.getTime() - nowDateOnly.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Jika hari ini adalah hari H (hari kedaluwarsa kalender WIB) atau sesudahnya
  if (diffDays <= 0) {
      return { status: 'disable', reason: 'Sudah masuk hari kedaluwarsa' };
  }

  // Jika hari ini adalah H-1 (1 hari sebelum kalender WIB)
  if (diffDays === 1) {
      const hour = nowParts.hour;
      if (hour >= 15) {
          return { status: 'disable', reason: 'Sudah lewat jam 15:00 (Hari Terakhir H-1)' };
      }
  }

  return { status: 'ready', reason: 'Masih aktif' };
}

export function calculateReloadExpiry(variantName: string): Date {
  const now = new Date();
  const isHarianOrMingguan = /harian|mingguan/i.test(variantName);

  if (isHarianOrMingguan) {
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7
    const nowWIB = new Date(now.getTime() + WIB_OFFSET_MS);
    const hourWIB = nowWIB.getUTCHours();
    const daysToAdd = hourWIB >= 22 ? 10 : 9;
    const result = new Date(now);
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  const result = new Date(now);
  result.setMonth(result.getMonth() + 1);
  return result;
}
