import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Organic Milk',
    price: 65,
    barcode: '8901234567890',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
    category: 'Dairy',
    stock: 50,
  },
  {
    id: '2',
    name: 'Whole Wheat Bread',
    price: 45,
    barcode: '8901234567891',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    category: 'Bakery',
    stock: 30,
  },
  {
    id: '3',
    name: 'Fresh Apples (1kg)',
    price: 180,
    barcode: '8901234567892',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
    category: 'Fruits',
    stock: 100,
  },
  {
    id: '4',
    name: 'Basmati Rice (5kg)',
    price: 450,
    barcode: '8901234567893',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop',
    category: 'Grains',
    stock: 40,
  },
  {
    id: '5',
    name: 'Sunflower Oil (1L)',
    price: 165,
    barcode: '8901234567894',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop',
    category: 'Oils',
    stock: 60,
  },
  {
    id: '6',
    name: 'Green Tea (25 bags)',
    price: 125,
    barcode: '8901234567895',
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200&h=200&fit=crop',
    category: 'Beverages',
    stock: 80,
  },
  {
    id: '7',
    name: 'Greek Yogurt',
    price: 85,
    barcode: '8901234567896',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop',
    category: 'Dairy',
    stock: 45,
  },
  {
    id: '9',
    name: 'Ballpoint Pen Pack (10pcs)',
    price: 120,
    barcode: '8901234567898',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=200&h=200&fit=crop',
    category: 'Stationery',
    stock: 200,
  },
  {
    id: '10',
    name: 'A4 Notebook (200 pages)',
    price: 85,
    barcode: '8901234567899',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop',
    category: 'Stationery',
    stock: 150,
  },
  {
    id: '18',
    name: 'Notebook 200 Pages',
    price: 150,
    barcode: '8901234567901',
    image: '/barcode-notebook-200.svg',
    category: 'Stationery',
    stock: 25,
  },
  {
    id: '19',
    name: 'Water Bottle 1L',
    price: 250,
    barcode: '8901234567918',
    image: '/barcode-bottle-1l.svg',
    category: 'Beverages',
    stock: 40,
  },
  {
    id: '20',
    name: 'DOMS Pencil Box',
    price: 50,
    barcode: '8908004279403',
    image: 'https://images.unsplash.com/photo-1595054170884-21eb7981541f?w=200&h=200&fit=crop',
    category: 'Stationery',
    stock: 100,
  },
  {
    id: '21',
    name: 'DOMS Pencil Box',
    price: 50,
    barcode: '948244279403', // Webcam misread variant
    image: 'https://images.unsplash.com/photo-1595054170884-21eb7981541f?w=200&h=200&fit=crop',
    category: 'Stationery',
    stock: 100,
  },
  {
    id: '22',
    name: 'A4 ClassMate Notebook',
    price: 80,
    barcode: '8902519009807',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop',
    category: 'Stationery',
    stock: 150,
  },
];

const normalizeBarcode = (b: string) => {
  if (!b) return '';
  // remove whitespace and non-digit characters
  return String(b).replace(/\s+/g, '').replace(/\D/g, '');
};

export const findProductByBarcode = (barcode: string): Product | undefined => {
  const clean = normalizeBarcode(barcode);
  if (!clean) return undefined;

  // Try exact match first
  let found = mockProducts.find((p) => p.barcode === clean);
  if (found) return found;

  // Some scanners may return extra leading/trailing digits or prefixes — try suffix match
  found = mockProducts.find((p) => clean.endsWith(p.barcode) || p.barcode.endsWith(clean));
  if (found) return found;

  // As a last resort, try matching by removing leading zeros from both
  const strip = (s: string) => s.replace(/^0+/, '');
  found = mockProducts.find((p) => strip(p.barcode) === strip(clean));
  return found;
};
