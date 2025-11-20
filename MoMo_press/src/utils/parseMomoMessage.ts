/**
 * Simple hash function for generating deterministic IDs from SMS message content.
 * Same SMS will always produce the same ID, enabling true deduplication.
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};

const generateIdFromMessage = (body: string, date: string | null, prefix: string): string => {
  const hashInput = `${body}|${date || ''}`;
  const hash = simpleHash(hashInput);
  return `${prefix}-${hash}`;
};

export const parseMomoMessage = (body: string, user_Number: string) => {

    // --- MONEY TRANSFERS (RECEIVED) ---
    if (body.includes("You have received")) {
        const name = body.match(/from (\w+\s\w+)/)?.[1] || null;
        const amount = parseInt(body.match(/received ([\d,]+) RWF/)?.[1].replace(/,/g, '') || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;
        const phone = body.match(/\((\**\d+)\)/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'M');

        return {
            table: 'Money_Transfers',
            data: {
            Transfer_Id: id,
            Phone_Number: user_Number,
            Recipient_Name: name,
            Recipient_Phone: phone,
            Amount: amount,
            Transaction_Type: 'received',
            Date: date
            }
        };
    }

    // --- MONEY TRANSFERS (SENT) ---
    else if (body.includes('*165*')) {
        const name = body.match(/to (\w+\s\w+)/)?.[1] || null;
        const amount = parseInt(body.match(/S\*(\d+)\s*RWF/)?.[1] || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;
        const fee = parseInt(body.match(/Fee was:? (\d+) RWF/)?.[1] || '0');
        const phone = body.match(/\((\**\d+)\)/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'M');

        return {
            table: 'Money_Transfers',
            data: {
            Transfer_Id: id,
            Phone_Number: user_Number,
            Recipient_Name: name,
            Recipient_Phone: phone,
            Amount: amount,
            Transaction_Type: 'sent',
            Fee: fee,
            Date: date
            }
        };
    }

    // --- MERCHANT TRANSFERS ---
    else if (/^TxId/.test(body)) {
        const name = body.match(/to (\w+\s\w+)/)?.[1] || null;
        const amount = parseInt(body.match(/of ([\d,]+) RWF/)?.[1]?.replace(/,/g, '') || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;
        const fee = parseInt(body.match(/Fee was:? (\d+) RWF/)?.[1] || '0');
        const code = body.match(/to [A-Za-z ]+ (\d+) has been completed/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'MD');

        return {
            table: 'Merchant_Payment',
            data: {
            Transfer_Id: id,
            Phone_Number: user_Number,
            Recipient_Name: name,
            Recipient_Code: code,
            Amount: amount,
            Fee: fee,
            Date: date
            }
        };
    }

    // --- AGENT WITHDRAWALS ---
    else if (body.includes('Agent')) {
        const agent_name = body.match(/Agent (\w+)/)?.[1] || null;
        const amount = parseInt(body.match(/withdrawn (\d+) RWF/)?.[1] || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;
        const fee = parseInt(body.match(/Fee paid: (\d+) RWF/)?.[1] || '0');

        const id = generateIdFromMessage(body, date, 'AG');

        return {
            table: 'Agent_Transactions',
            data: {
            Transaction_Id: id,
            Phone_Number: user_Number,
            Agent_Name: agent_name,
            Amount: amount,
            Fee: fee,
            Date: date
            }
        };
    }

    // --- BANK TRANSFERS ---
    else if (body.includes('*113*')) {
        const amount = parseInt(body.match(/deposit of (\d+) RWF/)?.[1] || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'BKD');

        return {
            table: 'Bank_Transfers',
            data: {
            Transfer_Id: id,
            Phone_Number: user_Number,
            Amount: amount,
            Transaction_Type: 'received',
            Fee: 0,
            Date: date
            }
        };
    }

    // --- BUNDLES ---
    else if (body.includes('Bundles and Packs') || body.includes('Airtime')) {
        const type = body.includes('Bundles and Packs') ? 'DATA' : 'AIRTIME';
        const amount = parseInt(body.match(/payment of (\d+) RWF/)?.[1] || '0');
        const fee = parseInt(body.match(/Fee was (\d+) RWF/)?.[1] || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'MTNB');

        return {
            table: 'Bundles',
            data: {
            Bundle_Id: id,
            Phone_Number: user_Number,
            Bundle_Type: type,
            Bundle_Amount: 0,
            Amount: amount,
            Date: date
            }
        };
    }

    // --- UTILITIES ---
    else if (body.includes('*162*') && !body.includes('Airtime') && !body.includes('Bundles and Packs')) {
        const name = body.match(/to (.+?) with/)?.[1] || null;
        const amount = parseInt(body.match(/payment of (\d+) RWF/)?.[1] || '0');
        const fee = parseInt(body.match(/Fee was (\d+) RWF/)?.[1] || '0');
        const date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;

        const id = generateIdFromMessage(body, date, 'UTL');

        return {
            table: 'Utilities',
            data: {
            Transaction_Id: id,
            Phone_Number: user_Number,
            Name: name,
            Amount: amount,
            Fee: fee,
            Date: date
            }
        };
        }

    // --- OTHERS ---
    else {
        let name = null;
        let amount = 0;
        let date = body.match(/at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/)?.[1] || null;;
        if (body.includes('*164')) {
            name = body.match(/by (.*?) on your MOMO/i)?.[1] || null;
            amount = parseInt(body.match(/A transaction of (\d+(?:,\d{3})?) RWF/i)?.[1] || '0');
        }

    const id = generateIdFromMessage(body, date, 'OTR');

    return {
        table: 'Others',
        data: {
        Other_Id: id,
        Phone_Number: user_Number,
        Name: name,
        Description: body,
        Amount: amount,
        Date: date
        }
    };
    }
};
