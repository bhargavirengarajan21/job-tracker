// Integration check: does modifyDocxInPlace apply a verbatim replacement whose text Word has
// SPLIT across runs, and still emit a valid docx (sectPr last)? This is the reliability crux.
process.env.NODE_ENV = 'test';
const { Document, Packer, Paragraph, TextRun } = require('docx');
const PizZip = require('pizzip');
const mammoth = require('mammoth');
const { __test } = require('./ats');

(async () => {
  // A bullet deliberately split into multiple runs (as Word does).
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Skills: Python, ', bold: false }), new TextRun('Excel')] }),
        new Paragraph({ children: [
          new TextRun('Responsible for '), new TextRun('managing'), new TextRun(' the databse and reports'),
        ] }),
        new Paragraph({ children: [new TextRun('Volunteered at local animal shelter on weekends')] }),
      ],
    }],
  });
  const buf = await Packer.toBuffer(doc);

  // Text as the AI would see it (same extractor path as the route).
  const { value: text } = await mammoth.extractRawText({ buffer: buf });
  console.log('--- extracted text ---\n' + text + '\n----------------------');

  // Simulate the plan: a verbatim rewrite (fixing typo + strengthening) and a removal.
  const grammarFixes = [{
    original: 'Responsible for managing the databse and reports',
    corrected: 'Administered production databases and automated reporting, cutting manual effort 40%',
  }];
  const linesToRemove = ['Volunteered at local animal shelter on weekends'];
  const missingRequired = ['AWS'];

  const { buffer, changeLog } = await __test.modifyDocxInPlace(
    buf, missingRequired, [], linesToRemove, grammarFixes, []
  );

  const xml = new PizZip(buffer).file('word/document.xml').asText();
  const has = s => xml.includes(s);
  console.log('\nchangeLog:', changeLog);
  console.log('replacement applied (run-split):', has('Administered production databases'));
  console.log('typo bullet gone:', !has('databse'));
  console.log('irrelevant line removed:', !has('animal shelter'));
  console.log('skill AWS added:', has('AWS'));
  console.log('sectPr still last:', xml.indexOf('<w:sectPr') > xml.lastIndexOf('</w:p>') &&
    xml.trimEnd().endsWith('</w:document>'));
})();
