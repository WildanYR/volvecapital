export function formatDateIdStandard(date?: Date, hideTime?: boolean) {
  if (!date) return '';

  const dt = new Date(date);

  const tanggal = dt.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  const waktu = dt
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
    .replace('.', ':');
  let formatted = tanggal;
  if (!hideTime) {
    formatted += ` ${waktu} WIB`;
  }
  return formatted;
}
