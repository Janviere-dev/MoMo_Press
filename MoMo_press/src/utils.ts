export interface MomoMessage {
  amount: string;
  sender: string;
  balance: string;
  raw: string;
}

export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  date: number;
  [key: string]: any; // for any extra fields
}

export function parseMomoMessage(text: string): MomoMessage {
  const amountMatch = text.match(/received\s([\d,]+)\sRWF/i);
  const balanceMatch = text.match(/balance[:\s]+([\d,]+)\sRWF/i);
  const senderMatch = text.match(/from\s([A-Za-z\s]+)/i);

  return {
    amount: amountMatch ? amountMatch[1].replace(/,/g, '') : '0',
    sender: senderMatch ? senderMatch[1].trim() : 'Unknown',
    balance: balanceMatch ? balanceMatch[1].replace(/,/g, '') : '0',
    raw: text,
  };
}