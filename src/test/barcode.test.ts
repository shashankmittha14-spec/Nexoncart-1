import { describe, it, expect } from 'vitest';
import { findProductByBarcode } from '@/data/mockProducts';

describe('barcode lookup', () => {
  it('finds product for exact barcode', () => {
    const p = findProductByBarcode('8901234567890');
    expect(p).toBeDefined();
    expect(p?.name).toBe('Organic Milk');
  });

  it('finds product for formatted scanner output', () => {
    const raw = 'EAN: 8901234567891\n';
    const p = findProductByBarcode(raw);
    expect(p).toBeDefined();
    expect(p?.name).toBe('Whole Wheat Bread');
  });
});
