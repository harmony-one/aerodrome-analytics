import * as fs from "fs";

export const exportToJson = (
  filename: string,
  items: any[]
) => {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filename);
    for (const item of items) {
      stream.write(JSON.stringify(item) + '\n');
    }
    stream.on('error', reject);
    stream.end(resolve);
  });
}

function arrayToCSV(array: any[]) {
  const headers = Object.keys(array[0]);
  const rows = array.map(obj =>
    headers.map(header => `"${obj[header]}"`).join(',')
  );
  return [
    headers.join(','), // Header row
    ...rows            // Data rows
  ].join('\n');
}

export const exportArrayToCSV = (
  filename: string,
  items: any[]
) => {
  const csv = arrayToTSV(items)
  fs.writeFileSync(filename, csv, 'utf8');
}

export const arrayToTSV = <T extends Record<string, any>>(
  data: T[],
  columns?: string[]
) => {
  if (!data || data.length === 0) {
    return '';
  }
  const headers = columns || Object.keys(data[0]);
  const headerRow = headers.join('\t');

  const rows = data.map((item) => {
    return headers
      .map((key) => {
        const value = item[key] ?? '';
        let strValue = String(value)
          .replace(/\t/g, '\\t')
          .replace(/\n/g, '\\n');
        if (strValue.includes('"')) {
          strValue = `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      })
      .join('\t');
  });

  // Combine header and rows with newlines
  return headerRow + '\n' + rows.join('\n');
}
