const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Add the two new fields after sequence
const oldContent = `  // Product Details (for peptides)
  chemicalName    String?
  casNumber       String?
  purity          String?
  molecularFormula String?
  sequence        String?  @db.Text

  // Relations`;

const newContent = `  // Product Details (for peptides)
  chemicalName    String?
  casNumber       String?
  purity          String?
  molecularFormula String?
  sequence        String?  @db.Text
  productForm     String?  @default("Lyophilized Powder")
  researchNotice  String?  @db.Text

  // Relations`;

content = content.replace(oldContent, newContent);
fs.writeFileSync(schemaPath, content, 'utf8');

console.log('Schema updated successfully!');
