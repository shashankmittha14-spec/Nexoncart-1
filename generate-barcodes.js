import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple barcode generator for EAN-13 format

const barcodes = [
  {
    id: 'notebook-200',
    name: 'Notebook 200 Pages',
    barcode: '8901234567901',
    price: 150,
    category: 'Stationery',
    stock: 25
  },
  {
    id: 'bottle-1l',
    name: 'Water Bottle 1L',
    barcode: '8901234567918',
    price: 250,
    category: 'Beverages',
    stock: 40
  }
];

// Generate EAN-13 barcode SVG
function generateEAN13SVG(barcodeNumber) {
  const digits = barcodeNumber.split('');
  const width = 95 + (12 * digits.length);
  const height = 100;
  
  // Simplified barcode pattern (left guard, digits, right guard)
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="white"/>
    <text x="${width/2}" y="${height - 5}" font-size="14" font-family="Arial" text-anchor="middle">${barcodeNumber}</text>
    <g transform="translate(10, 10)">`;
  
  // Add bars (simplified pattern - each digit gets represented)
  let barX = 0;
  digits.forEach((digit, index) => {
    const barWidth = index < 6 ? 10 : 12;
    const barHeight = 60;
    svg += `<rect x="${barX}" y="0" width="${barWidth}" height="${barHeight}" fill="black"/>`;
    barX += barWidth + 5;
  });
  
  svg += `</g></svg>`;
  return svg;
}

// Generate barcode images
barcodes.forEach(item => {
  const svgContent = generateEAN13SVG(item.barcode);
  const filePath = path.join(__dirname, 'public', `barcode-${item.id}.svg`);
  
  // Ensure public directory exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, svgContent, 'utf-8');
  console.log(`✅ Generated barcode: ${filePath}`);
});

console.log('\n📊 Barcode Data:');
console.log(JSON.stringify(barcodes, null, 2));

// Output for use in mockProducts
console.log('\n📝 Add this to src/data/mockProducts.ts:\n');
barcodes.forEach(item => {
  console.log(`{
  id: ${Math.max(...barcodes.map(b => b.id.charCodeAt(0))) + Math.random()},
  name: '${item.name}',
  price: ${item.price},
  barcode: '${item.barcode}',
  image: '/barcode-${item.id}.svg',
  category: '${item.category}',
  stock: ${item.stock}
},`);
});
