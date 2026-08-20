/**
 * Format currency with Naira symbol and thousand separators
 * Guaranteed non-negative display
 */
export function formatNaira(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₦0';
  }
  const safeVal = Math.max(0, Math.round(amount));
  return '₦' + safeVal.toLocaleString('en-NG');
}

/**
 * Format standard date string
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format standard date and time string
 */
export function formatDateTime(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Convert number to words in Nigerian Naira for official receipts
 */
export function numberToWordsNaira(num: number): string {
  const safe = Math.max(0, Math.round(num));
  if (safe === 0) return 'Zero Naira Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertHundreds(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
      if (n > 0) str += 'and ';
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const billion = Math.floor(safe / 1_000_000_000);
  const million = Math.floor((safe % 1_000_000_000) / 1_000_000);
  const thousand = Math.floor((safe % 1_000_000) / 1_000);
  const remainder = safe % 1_000;

  if (billion > 0) {
    words += convertHundreds(billion) + ' Billion ';
  }
  if (million > 0) {
    words += convertHundreds(million) + ' Million ';
  }
  if (thousand > 0) {
    words += convertHundreds(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertHundreds(remainder);
  }

  return `${words.trim()} Naira Only`;
}
