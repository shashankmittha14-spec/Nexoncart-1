import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  CreditCard, 
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockProducts } from '@/data/mockProducts';
import { Product } from '@/types';

type Tab = 'dashboard' | 'products' | 'sessions' | 'transactions' | 'alerts';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    barcode: '',
    category: '',
    stock: '',
    image: '',
  });

  // Mock data for dashboard
  const stats = {
    totalSales: 284560,
    activeCustomers: 23,
    todayTransactions: 156,
    flaggedSessions: 3,
  };

  const recentSessions = [
    { id: 'S001', customer: 'Customer 1', items: 12, amount: 1250, status: 'active' },
    { id: 'S002', customer: 'Customer 2', items: 5, amount: 680, status: 'paid' },
    { id: 'S003', customer: 'Customer 3', items: 8, amount: 920, status: 'verified' },
    { id: 'S004', customer: 'Customer 4', items: 15, amount: 2100, status: 'flagged' },
  ];

  const recentTransactions = [
    { id: 'TXN001', sessionId: 'S002', amount: 680, time: '10:30 AM', status: 'completed' },
    { id: 'TXN002', sessionId: 'S003', amount: 920, time: '10:15 AM', status: 'completed' },
    { id: 'TXN003', sessionId: 'S005', amount: 450, time: '09:45 AM', status: 'completed' },
    { id: 'TXN004', sessionId: 'S006', amount: 1200, time: '09:30 AM', status: 'completed' },
  ];

  const handleAddProduct = () => {
    const product: Product = {
      id: String(products.length + 1),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      barcode: newProduct.barcode,
      category: newProduct.category,
      stock: parseInt(newProduct.stock),
      image: newProduct.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    };
    setProducts([...products, product]);
    setShowAddProduct(false);
    setNewProduct({ name: '', price: '', barcode: '', category: '', stock: '', image: '' });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground">₹{(stats.totalSales / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <span className="badge-success text-xs">Live</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.activeCustomers}</p>
                <p className="text-sm text-muted-foreground">Active Customers</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-accent" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.todayTransactions}</p>
                <p className="text-sm text-muted-foreground">Today's Transactions</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.flaggedSessions}</p>
                <p className="text-sm text-muted-foreground">Flagged Sessions</p>
              </motion.div>
            </div>

            {/* Charts Placeholder */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Sales Overview</h3>
                <select className="px-3 py-1 rounded-lg bg-muted text-sm">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                </select>
              </div>
              <div className="h-48 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-primary/30 mx-auto mb-2" />
                  <p className="text-muted-foreground">Sales chart visualization</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-background">
                      <div>
                        <p className="font-medium text-foreground">{session.customer}</p>
                        <p className="text-sm text-muted-foreground">{session.items} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{session.amount}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          session.status === 'active' ? 'bg-success-light text-success' :
                          session.status === 'paid' ? 'bg-primary-light text-primary' :
                          session.status === 'flagged' ? 'bg-warning-light text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentTransactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-xl bg-background">
                      <div>
                        <p className="font-medium text-foreground">{txn.id}</p>
                        <p className="text-sm text-muted-foreground">{txn.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success">₹{txn.amount}</p>
                        <span className="text-xs text-muted-foreground">{txn.sessionId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="input-premium pl-10"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddProduct(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </motion.button>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Barcode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Stock</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                            <span className="font-medium text-foreground">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{product.barcode}</td>
                        <td className="px-4 py-3 text-muted-foreground">{product.category}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">₹{product.price}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.stock > 50 ? 'bg-success-light text-success' :
                            product.stock > 20 ? 'bg-warning-light text-warning' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {product.stock} units
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'sessions':
        return (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Live Customer Sessions</h3>
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="p-4 rounded-xl bg-background flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{session.customer}</p>
                      <p className="text-sm text-muted-foreground">Session: {session.id} • {session.items} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{session.amount}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        session.status === 'active' ? 'bg-success-light text-success' :
                        session.status === 'paid' ? 'bg-primary-light text-primary' :
                        session.status === 'flagged' ? 'bg-warning-light text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <button className="p-2 rounded-lg bg-muted hover:bg-primary/10 transition-colors">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Session</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-mono text-sm text-foreground">{txn.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">{txn.sessionId}</td>
                      <td className="px-4 py-3 font-semibold text-success">₹{txn.amount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{txn.time}</td>
                      <td className="px-4 py-3">
                        <span className="badge-success">{txn.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-4">
            <div className="glass-card p-6 border-l-4 border-warning">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Unpaid Cart Alert</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Session S004 has items worth ₹2,100 but payment not completed for over 30 minutes.
                  </p>
                  <p className="text-xs text-muted-foreground">10 minutes ago</p>
                </div>
                <button className="btn-secondary text-sm">Review</button>
              </div>
            </div>
            
            <div className="glass-card p-6 border-l-4 border-destructive">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">Suspicious Activity</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Multiple cart modifications detected in Session S007 without scanning.
                  </p>
                  <p className="text-xs text-muted-foreground">25 minutes ago</p>
                </div>
                <button className="btn-secondary text-sm">Investigate</button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <div className="glass-card mx-4 mt-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-foreground">Admin</span>
            </div>
            <Link to="/" className="text-sm text-muted-foreground">Exit</Link>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/20 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 glass-card z-50 transform transition-transform duration-300
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Q</span>
              </div>
              <div>
                <p className="font-bold text-foreground">Qzero</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
                {tab.id === 'alerts' && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-warning text-warning-foreground text-xs flex items-center justify-center">
                    2
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Link to="/">
            <button className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
              Exit Admin
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-24 lg:pt-8 px-4 lg:px-8 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground capitalize">{activeTab}</h1>
          <p className="text-muted-foreground">
            {activeTab === 'dashboard' && 'Overview of your store performance'}
            {activeTab === 'products' && 'Manage your product inventory'}
            {activeTab === 'sessions' && 'View active customer sessions'}
            {activeTab === 'transactions' && 'View all payment transactions'}
            {activeTab === 'alerts' && 'Fraud alerts and notifications'}
          </p>
        </div>

        {renderContent()}
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <>
          <div 
            className="fixed inset-0 bg-foreground/20 z-50"
            onClick={() => setShowAddProduct(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Add New Product</h3>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="input-premium"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="input-premium"
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="input-premium"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Barcode"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  className="input-premium"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="input-premium"
                />
                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="input-premium"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddProduct}
                  className="flex-1 btn-primary"
                >
                  Add Product
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Admin;
