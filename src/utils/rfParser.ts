import type { USAEnrollmentForm, Subject } from '../types/rf';

export function parseRFText(text: string): Partial<USAEnrollmentForm> {
  const data: Partial<USAEnrollmentForm> = {
    institution: 'University of San Agustin, Inc.',
    subjects: [],
    installmentBreakdown: []
  };

  // Student Name
  const nameMatch = text.match(/Name\s*[:|]?\s*([A-Z,\s]+(?:[A-Z]))/i);
  if (nameMatch) data.studentName = nameMatch[1].trim();

  // Student ID
  const idMatch = text.match(/(\d{4}-\d{4}-\d{2})/);
  if (idMatch) data.studentId = idMatch[1];

  // Email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@usa\.edu\.ph)/i);
  if (emailMatch) data.email = emailMatch[1];

  // Program / Course
  const programMatch = text.match(/(?:Program|Course)\s*[:|]?\s*([A-Za-z\s]+)(?:\n|$)/i);
  if (programMatch) data.program = programMatch[1].trim();

  // Year Level
  const yearMatch = text.match(/(Y\d+S\d+)/i);
  if (yearMatch) data.yearLevel = yearMatch[1].toUpperCase();

  // Contact Number
  const contactMatch = text.match(/(09\d{9})/);
  if (contactMatch) data.contactNumber = contactMatch[1];

  // Financials
  const totalAmountMatch = text.match(/(?:Total Amount|Total Assessment)\s*[:|]?\s*[P|₱]?\s*([\d,.]+)/i);
  if (totalAmountMatch) {
    data.totalAmount = parseFloat(totalAmountMatch[1].replace(/,/g, ''));
  }

  // Subjects extraction heuristic
  // Looking for lines like: CS 411 Information Assurance & Security 3.0 0.0 3.0 1500.00 Wed 11:00 AM-02:00 PM
  const lines = text.split('\n');
  const subjects: Subject[] = [];
  
  for (const line of lines) {
    // Regex for subjects: (CS|CSIT|CSFE|CSME|MATH|ENG|PE|GE) \d{3,4} ...
    const subjectMatch = line.match(/^([A-Z]{2,5}\s*\d{1,4}[A-Z]?)\s+(.*?)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+([\d,.]+)\s+(.*)$/i);
    
    if (subjectMatch) {
      subjects.push({
        code: subjectMatch[1].trim(),
        title: subjectMatch[2].trim(),
        lecUnits: parseFloat(subjectMatch[3]),
        labUnits: parseFloat(subjectMatch[4]),
        totalCredits: parseFloat(subjectMatch[5]),
        fee: parseFloat(subjectMatch[6].replace(/,/g, '')),
        scheduleAndRoom: subjectMatch[7].trim()
      });
    } else {
      // Fallback simpler regex just for code and title
      const simpleSubjectMatch = line.match(/(?:^|\s)((?:CS|CSIT|CSFE|CSME|MATH|ENG|PE|GE)\s*\d{1,4}[A-Z]?)\s+([A-Za-z&.\-\s]+?)(?=\s\d|\s$)/i);
      if (simpleSubjectMatch && !line.toLowerCase().includes('total')) {
        // Prevent false positives by checking if it matches a valid subject code
        const code = simpleSubjectMatch[1].trim();
        if (code.length > 2) {
           subjects.push({
              code: code,
              title: simpleSubjectMatch[2].trim(),
              lecUnits: 0,
              labUnits: 0,
              totalCredits: 0,
              fee: 0,
              scheduleAndRoom: 'Unknown'
           });
        }
      }
    }
  }

  // Deduplicate subjects by code
  const uniqueSubjects = [];
  const seenCodes = new Set();
  for (const sub of subjects) {
    if (!seenCodes.has(sub.code)) {
      seenCodes.add(sub.code);
      uniqueSubjects.push(sub);
    }
  }
  data.subjects = uniqueSubjects;

  return data;
}

export function calculateCompleteness(data: Partial<USAEnrollmentForm>): { percentage: number, warnings: string[] } {
  const expectedKeys = [
    'studentName', 'studentId', 'email', 'yearLevel', 'totalAmount'
  ];
  
  let present = 0;
  const warnings: string[] = [];

  expectedKeys.forEach(key => {
    if (data[key as keyof USAEnrollmentForm]) {
      present++;
    } else {
      warnings.push(`Missing field: ${key}`);
    }
  });

  if (!data.subjects || data.subjects.length === 0) {
    warnings.push('No subjects extracted');
  } else {
    present++; // Count subjects array as 1 key
  }

  const totalKeys = expectedKeys.length + 1;
  const percentage = Math.round((present / totalKeys) * 100);

  return { percentage, warnings };
}
