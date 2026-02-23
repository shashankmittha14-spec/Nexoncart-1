// Core Types for NexonCart

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  image: string;
  category: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Session {
  id: string;
  customerId: string;
  cart: CartItem[];
  totalAmount: number;
  budgetLimit: number | null;
  status: 'active' | 'paid' | 'verified' | 'flagged';
  startTime: Date;
  endTime?: Date;
  paymentId?: string;
}

export interface Transaction {
  id: string;
  sessionId: string;
  amount: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cash';
  paymentId: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}

export interface ExitPass {
  sessionId: string;
  transactionId: string;
  qrCode: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface AdminStats {
  totalSales: number;
  activeCustomers: number;
  todayTransactions: number;
  flaggedSessions: number;
}
