/**
 * Extracts balance from M-Money SMS message
 * Supports patterns like:
 * - "Your new balance: 21,705 RWF"
 * - "Balance: 21,705 RWF"
 * - "new balance: 21,705 RWF"
 */
export const extractBalance = (messageBody: string): number | null => {
  // Try different regex patterns for balance (order matters - most specific first)
  const patterns = [
    /Your new balance[:\s]+([\d,]+)\s*RWF/i,  // "Your new balance: 21,705 RWF"
    /new balance[:\s]+([\d,]+)\s*RWF/i,       // "new balance: 21,705 RWF"
    /Balance[:\s]+([\d,]+)\s*RWF/i,           // "Balance: 21,705 RWF"
    /balance[:\s]+([\d,]+)\s*RWF/i,           // "balance: 21,705 RWF" (case insensitive)
  ];

  for (const pattern of patterns) {
    const match = messageBody.match(pattern);
    if (match && match[1]) {
      const balanceStr = match[1].replace(/,/g, '');
      const balance = parseInt(balanceStr, 10);
      if (!isNaN(balance) && balance >= 0) {
        return balance;
      }
    }
  }

  return null;
};

