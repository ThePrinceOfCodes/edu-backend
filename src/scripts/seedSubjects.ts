import mongoose from 'mongoose';
import config from '../config/config';
import Subject from '../modules/subject/subject.model';

const SUBJECTS: Array<{ name: string; code: string }> = [
  { name: 'English Language', code: 'ENG' },
  { name: 'Mathematics', code: 'MTH' },
  { name: 'Basic Science', code: 'BSC' },
  { name: 'Basic Technology', code: 'BTE' },
  { name: 'National Values', code: 'NAV' },
  { name: 'Civic Education', code: 'CVE' },
  { name: 'Social Studies', code: 'SOS' },
  { name: 'Cultural and Creative Arts', code: 'CCA' },
  { name: 'Computer Studies', code: 'CMP' },
  { name: 'Agricultural Science', code: 'AGR' },
  { name: 'Home Economics', code: 'HEC' },
  { name: 'Business Studies', code: 'BST' },
  { name: 'Physical and Health Education', code: 'PHE' },
  { name: 'French', code: 'FRE' },
  { name: 'Yoruba', code: 'YOR' },
  { name: 'Igbo', code: 'IGB' },
  { name: 'Hausa', code: 'HAU' },
  { name: 'Islamic Religious Studies', code: 'IRS' },
  { name: 'Christian Religious Studies', code: 'CRS' },
  { name: 'Further Mathematics', code: 'FMTH' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Chemistry', code: 'CHM' },
  { name: 'Biology', code: 'BIO' },
  { name: 'Economics', code: 'ECO' },
  { name: 'Government', code: 'GOV' },
  { name: 'Literature in English', code: 'LIT' },
  { name: 'Geography', code: 'GEO' },
  { name: 'Commerce', code: 'COM' },
  { name: 'Accounting', code: 'ACC' },
  { name: 'Financial Accounting', code: 'FAC' },
  { name: 'Technical Drawing', code: 'TDR' },
  { name: 'Data Processing', code: 'DTP' },
  { name: 'Food and Nutrition', code: 'FON' },
  { name: 'Animal Husbandry', code: 'ANH' },
  { name: 'Visual Arts', code: 'VIA' },
  { name: 'Music', code: 'MUS' },
  { name: 'History', code: 'HIS' },
];

async function run() {
  await mongoose.connect(config.mongoose.url);

  let created = 0;
  let updated = 0;

  for (const subject of SUBJECTS) {
    const existingByCode = await Subject.findOne({ code: subject.code });
    if (!existingByCode) {
      await Subject.create(subject);
      created += 1;
      continue;
    }

    if (existingByCode.name !== subject.name) {
      existingByCode.name = subject.name;
      await existingByCode.save();
      updated += 1;
    }
  }

  // Also align code if a subject with same name was created manually with another code.
  for (const subject of SUBJECTS) {
    await Subject.updateMany({ name: subject.name, code: { $ne: subject.code } }, { $set: { code: subject.code } });
  }

  console.log(`Seeded subjects. Created: ${created}, Updated: ${updated}, Total Source: ${SUBJECTS.length}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
