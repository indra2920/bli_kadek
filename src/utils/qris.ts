/**
 * QRIS Utility to generate dynamic amount
 * QRIS (Quick Response Code Indonesian Standard) follows EMVCo standard.
 */

// CRC16-CCITT implementation for QRIS (Polynomial: 0x1021, Initial: 0xFFFF)
function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Modifies a static QRIS payload to include a specific amount.
 * @param payload The raw QRIS string (e.g., 000201...)
 * @param amount The amount to be paid
 * @returns Modified QRIS string with amount and updated CRC
 */
export function generateDynamicQRIS(payload: string, amount: number): string {
  if (!payload || payload.length < 10) return payload;

  // 1. Parse tags to safely find/replace Tag 54
  // Format QRIS: Tag (2) + Length (2) + Value (Length)
  let tags: Record<string, string> = {};
  let i = 0;
  
  try {
    while (i < payload.length) {
      const tag = payload.substring(i, i + 2);
      if (tag === '63') break; // CRC is always the last tag
      
      const lengthStr = payload.substring(i + 2, i + 4);
      const length = parseInt(lengthStr);
      if (isNaN(length)) break;
      
      const value = payload.substring(i + 4, i + 4 + length);
      tags[tag] = value;
      i += 4 + length;
    }
  } catch (e) {
    console.error("QRIS Parsing Error:", e);
    return payload; // Fallback to original
  }

  // 2. Add or Update Tag 54 (Transaction Amount)
  tags['54'] = amount.toString();

  // 3. Set Tag 53 to 360 (IDR) if not present
  if (!tags['53']) tags['53'] = '360';

  // 4. Rebuild Payload (excluding Tag 63)
  let newPayload = '';
  const sortedTags = Object.keys(tags).sort();
  
  for (const tag of sortedTags) {
    const val = tags[tag];
    const len = val.length.toString().padStart(2, '0');
    newPayload += `${tag}${len}${val}`;
  }

  // 5. Add Tag 63 (CRC) holder
  newPayload += '6304';

  // 6. Calculate and append new CRC
  const newCRC = calculateCRC16(newPayload);
  return newPayload + newCRC;
}
