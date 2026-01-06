import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the Excel file
const filePath = path.join(__dirname, '../public/students.xls');
const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);
console.log('Total sheets:', workbook.SheetNames.length);

// Parse students from all sheets
const students = [];
const classMap = {
  'KELAS 1': 'K1',
  'KELAS 2': 'K2',
  'KELAS 3': 'K3',
  'KELAS 4': 'K4',
  'KELAS 5': 'K5',
  'KELAS 6': 'K6'
};

let studentCounter = 1;

// Process each sheet
workbook.SheetNames.forEach(sheetName => {
  console.log(`\nProcessing sheet: ${sheetName}`);
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const studentClass = classMap[sheetName] || 'K1';
  console.log(`  Class: ${studentClass}, Rows: ${data.length}`);

  // Parse students (data starts from row 1, row 0 is headers)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Skip empty rows
    if (!row || row.length === 0 || !row[1]) continue;

    const name = row[1]?.toString().trim();
    const gender = row[3]?.toString().trim();
    const nis = row[4]?.toString().trim();
    const dateOfBirth = row[6]; // Excel date or string
    const religion = row[8]?.toString().trim();

    if (!name || !nis) continue;

    // Generate QR code
    const qrCode = `STD${String(studentCounter).padStart(3, '0')}-${nis}`;

    // Format date of birth
    let formattedDob = null;
    if (dateOfBirth) {
      if (typeof dateOfBirth === 'number') {
        // Excel date number
        const date = XLSX.SSF.parse_date_code(dateOfBirth);
        formattedDob = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      } else {
        formattedDob = dateOfBirth.toString();
      }
    }

    students.push({
      id: `std${String(studentCounter).padStart(3, '0')}`,
      nis,
      name,
      class: studentClass,
      gender,
      dateOfBirth: formattedDob,
      religion,
      qrCode,
      active: 1,
      createdAt: new Date().toISOString()
    });

    studentCounter++;
  }

  console.log(`  Students parsed: ${studentCounter - 1}`);
});

console.log('\n=== Parsed Students ===');
console.log('Total students:', students.length);
console.log('\nFirst 5 students:');
console.log(JSON.stringify(students.slice(0, 5), null, 2));

console.log('\nClass distribution:');
const classCounts = students.reduce((acc, s) => {
  acc[s.class] = (acc[s.class] || 0) + 1;
  return acc;
}, {});
console.log(classCounts);

console.log('\nGender distribution:');
const genderCounts = students.reduce((acc, s) => {
  acc[s.gender || 'Unknown'] = (acc[s.gender || 'Unknown'] || 0) + 1;
  return acc;
}, {});
console.log(genderCounts);

// Save to JSON file
const outputPath = path.join(__dirname, '../api/lib/students-data.json');
fs.writeFileSync(outputPath, JSON.stringify(students, null, 2));
console.log(`\n✓ Saved ${students.length} students to: ${outputPath}`);
