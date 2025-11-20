import RNFS from 'react-native-fs';
import { MomoMessage } from './utils';

// Escape XML special characters
const escapeXml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Save M-Money messages as XML
export const saveAsXML = async (messages: MomoMessage[]) => {
  try {
    const filePath = `${RNFS.DocumentDirectoryPath}/mmoney_messages.xml`;

    let xml = `<?xml version='1.0' encoding='utf-8'?>\n<smses>\n`;

    messages.forEach(msg => {
      const date = Date.now(); 
      xml += `  <sms address="M-Money" date="${date}" body="${escapeXml(msg.raw)}" />\n`;
    });

    xml += `</smses>`;

    await RNFS.writeFile(filePath, xml, 'utf8');

    console.log(`Saved ${messages.length} messages to ${filePath}`);
  } catch (err) {
    console.error(`Error saving XML: ${err}`);
  }
};
