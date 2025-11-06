
import { Species } from '../types';

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

export const parseCSV = (csvString: string): Species[] => {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  const headerLine = lines.shift() as string;
  const headers = headerLine.split(',').map(h => toCamelCase(h.trim().replace(/"/g, '')));

  const data: Species[] = lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ? values[index].replace(/"/g, '') : '';
    });
    return entry as Species;
  });

  return data;
};
