import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // basic client-side simulation of signup
    const id = identifier.trim();
    if (!id) return;

    try {
      const raw = localStorage.getItem('qzero_users');
      const users = raw ? JSON.parse(raw) : {};
      users[id] = { name, identifier: id, password };
      localStorage.setItem('qzero_users', JSON.stringify(users));

      // also set active profile
      const profileObj = { name, email: id.includes('@') ? id : '', phone: id.includes('@') ? '' : id };
      localStorage.setItem('qzero_profile', JSON.stringify(profileObj));
    } catch (err) {
      // ignore storage errors
    }

    navigate('/shop');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent px-4">
      <div className="glass-card max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">Q</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground">Get started with Qzero in seconds</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted-foreground">Full name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jane Doe"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted-foreground">Email or Phone</span>
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@company.com or +91 98765 43210"
            />
          </label>

          <label className="block">
            <span className="text-sm text-muted-foreground">Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Create a password"
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <button type="submit" className="btn-primary flex-1 py-2">
              <Zap className="w-4 h-4 mr-2" /> Create account
            </button>
          </div>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
