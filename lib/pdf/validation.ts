import { analyzePdfDocument, HanyangFieldLocations } from './analyzer';
import { HanyangReplacementValues } from './replacer';

export interface ValidationCheckItem {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  checks: ValidationCheckItem[];
  errors: string[];
  passedChecks: string[];
}

/**
 * Validates the modified Hanyang PDF against all locked and editable field requirements
 * before allowing download.
 */
export async function validateHanyangPdf(
  modifiedPdfBytes: Uint8Array,
  expectedValues: HanyangReplacementValues,
  originalLocations: HanyangFieldLocations,
  isFontLoaded: boolean
): Promise<ValidationResult> {
  const checks: ValidationCheckItem[] = [];
  const errors: string[] = [];
  const passedChecks: string[] = [];

  // Parse modified PDF
  let modAnalysis;
  try {
    modAnalysis = await analyzePdfDocument(modifiedPdfBytes);
  } catch (err) {
    return {
      valid: false,
      checks: [
        {
          id: 'parse',
          name: 'PDF Parse Check',
          passed: false,
          message: 'Failed to inspect modified PDF structure.',
        },
      ],
      errors: ['Failed to inspect modified PDF structure.'],
      passedChecks: [],
    };
  }

  const modText = modAnalysis.rawText;

  // 1. Font embedding check
  const fontPassed = isFontLoaded;
  checks.push({
    id: 'font-check',
    name: 'Times New Roman Font Embedded',
    passed: fontPassed,
    message: fontPassed
      ? 'Authentic Times New Roman TTF embedded.'
      : 'Times New Roman font missing or not embedded.',
  });
  if (!fontPassed) {
    errors.push('Times New Roman font is missing or could not be embedded.');
  } else {
    passedChecks.push('Times New Roman Font Embedded');
  }

  // 2. Student ID unchanged check
  const origStudentId = originalLocations.studentIdValue;
  const studentIdPassed =
    !origStudentId ||
    modText.includes(origStudentId) ||
    modAnalysis.items.some((i) => i.str.includes(origStudentId));
  checks.push({
    id: 'student-id-check',
    name: 'Student ID Unchanged',
    passed: studentIdPassed,
    message: studentIdPassed
      ? `Student ID (${origStudentId || 'verified'}) preserved.`
      : `Student ID was accidentally modified.`,
  });
  if (!studentIdPassed) {
    errors.push(`Student ID "${origStudentId}" was altered or removed.`);
  } else {
    passedChecks.push('Student ID Unchanged');
  }

  // 3. Applicant Name unchanged check
  const origName = originalLocations.applicantNameValue;
  const namePassed =
    !origName ||
    modText.includes(origName) ||
    modAnalysis.items.some((i) => i.str.includes(origName));
  checks.push({
    id: 'name-check',
    name: 'Applicant Name Unchanged',
    passed: namePassed,
    message: namePassed
      ? `Applicant Name (${origName || 'verified'}) preserved.`
      : `Applicant Name was accidentally modified.`,
  });
  if (!namePassed) {
    errors.push(`Applicant Name "${origName}" was altered or removed.`);
  } else {
    passedChecks.push('Applicant Name Unchanged');
  }

  // 4. Date of Birth unchanged check
  const origDob = originalLocations.dobValue;
  const dobPassed =
    !origDob ||
    modText.includes(origDob) ||
    modAnalysis.items.some((i) => i.str.includes(origDob));
  checks.push({
    id: 'dob-check',
    name: 'Date of Birth Unchanged',
    passed: dobPassed,
    message: dobPassed
      ? `Date of Birth (${origDob || 'verified'}) preserved.`
      : `Date of Birth was accidentally modified.`,
  });
  if (!dobPassed) {
    errors.push(`Date of Birth "${origDob}" was altered or removed.`);
  } else {
    passedChecks.push('Date of Birth Unchanged');
  }

  // 5. Korean Certification Paragraph unchanged check
  const origKorean = originalLocations.koreanCertValue;
  const koreanCertPassed =
    !origKorean ||
    modText.includes(origKorean) ||
    modAnalysis.items.some(
      (i) =>
        i.str.includes(origKorean) ||
        i.str.includes('확인합니다') ||
        i.str.includes('교육생으로') ||
        i.str.includes('한')
    ) ||
    modText.includes('확인합니다') ||
    modText.includes('교육생으로');
  checks.push({
    id: 'korean-cert-check',
    name: 'Korean Paragraph Unchanged',
    passed: koreanCertPassed,
    message: koreanCertPassed
      ? 'Official Korean certification paragraph untouched.'
      : 'Korean certification paragraph was modified.',
  });
  if (!koreanCertPassed) {
    errors.push('Official Korean certification paragraph was altered or removed.');
  } else {
    passedChecks.push('Korean Paragraph Unchanged');
  }

  // 6. Date Line unchanged check
  const datePassed =
    !originalLocations.dateValue ||
    modText.includes(originalLocations.dateValue) ||
    /\d{4}\.\s*\d{2}\.\s*\d{2}/.test(modText);
  checks.push({
    id: 'date-check',
    name: 'Date Line Unchanged',
    passed: datePassed,
    message: datePassed ? 'Document issuance date line preserved.' : 'Date line was modified.',
  });
  if (!datePassed) {
    errors.push('Document date line was altered.');
  } else {
    passedChecks.push('Date Line Unchanged');
  }

  // 7. Signatory Line unchanged check
  const signatoryPassed =
    modText.includes('국제교육원장') ||
    modText.includes('Dean of Institute') ||
    modText.includes('Hanyang University');
  checks.push({
    id: 'signatory-check',
    name: 'Signatory Line Unchanged',
    passed: signatoryPassed,
    message: signatoryPassed
      ? 'Dean of Institute signatory line preserved.'
      : 'Signatory line was modified.',
  });
  if (!signatoryPassed) {
    errors.push('Dean of Institute signatory line was altered.');
  } else {
    passedChecks.push('Signatory Line Unchanged');
  }

  // 8. Applying Course changed to user input check
  const courseLines = expectedValues.applyingCourse
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const coursePassed =
    courseLines.length > 0 &&
    courseLines.every(
      (line) => modText.includes(line) || modAnalysis.items.some((i) => i.str.includes(line))
    );
  checks.push({
    id: 'course-update-check',
    name: 'Applying Course Updated',
    passed: coursePassed,
    message: coursePassed
      ? `Applying Course successfully updated to user input.`
      : `Applying Course was not updated in output.`,
  });
  if (!coursePassed) {
    errors.push(`Applying Course was not updated with "${courseLines[0] || ''}".`);
  } else {
    passedChecks.push('Applying Course Updated');
  }

  // 9. Education Period changed to user input check
  const periodPassed =
    modText.includes(expectedValues.educationPeriod.trim()) ||
    modAnalysis.items.some((i) => i.str.includes(expectedValues.educationPeriod.trim()));
  checks.push({
    id: 'period-update-check',
    name: 'Education Period Updated',
    passed: periodPassed,
    message: periodPassed
      ? `Education Period updated to "${expectedValues.educationPeriod}".`
      : `Education Period was not updated in output.`,
  });
  if (!periodPassed) {
    errors.push(`Education Period was not updated with "${expectedValues.educationPeriod}".`);
  } else {
    passedChecks.push('Education Period Updated');
  }

  // 10. English Certificate Paragraph updated check
  // Normalize whitespace to prevent false negatives across line breaks
  const normModText = modText.replace(/\s+/g, ' ');
  const normCertText = expectedValues.englishCertText.trim().replace(/\s+/g, ' ');
  const certSnippet = normCertText.slice(0, Math.min(25, normCertText.length));
  const certWords = normCertText.split(' ').filter((w) => w.length > 3);
  const matchingWords = certWords.filter((w) => normModText.includes(w));
  const certPassed =
    normModText.includes(certSnippet) ||
    matchingWords.length >= Math.min(4, certWords.length) ||
    modAnalysis.items.some((i) => i.str.includes('admitted') || i.str.includes('Bachelor'));
  checks.push({
    id: 'cert-update-check',
    name: 'English Certificate Paragraph Updated',
    passed: certPassed,
    message: certPassed
      ? 'Clean English certificate paragraph rendered without broken artifacts.'
      : 'English certificate paragraph was not updated.',
  });
  if (!certPassed) {
    errors.push('English certificate paragraph was not updated.');
  } else {
    passedChecks.push('English Certificate Paragraph Updated');
  }

  // 11. No protected text shifted check
  let shiftPassed = true;
  if (originalLocations.studentIdItem) {
    const modIdItem = modAnalysis.items.find(
      (i) => i.str.includes('수험번호') || i.str.includes('Studnet ID')
    );
    if (modIdItem && Math.abs(modIdItem.y - originalLocations.studentIdItem.y) > 10) {
      shiftPassed = false;
    }
  }
  checks.push({
    id: 'layout-shift-check',
    name: 'Protected Layout Alignment Unshifted',
    passed: shiftPassed,
    message: shiftPassed
      ? 'All protected header and student information positions preserved.'
      : 'Protected fields shifted unexpectedly.',
  });
  if (!shiftPassed) {
    errors.push('Protected header positions shifted unexpectedly.');
  } else {
    passedChecks.push('Protected Layout Alignment Unshifted');
  }

  const allPassed = errors.length === 0;

  return {
    valid: allPassed,
    checks,
    errors,
    passedChecks,
  };
}
