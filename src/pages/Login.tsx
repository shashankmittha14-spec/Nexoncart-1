import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || '';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<null | { name: string; email: string; phone: string }>(null);
  const [mode, setMode] = useState<'password' | 'otp' | 'reset'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up real auth; navigate based on role for now
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'guard') {
      navigate('/guard');
    } else {
      // password-based login for customers
      const id = identifier.trim();
      if (!id) return;

      try {
        const raw = localStorage.getItem('qzero_users');
        const users = raw ? JSON.parse(raw) : {};
        const user = users[id];
        if (!user) {
          window.alert('No account found for this email/phone. Please sign up.');
          return;
        }

        if (user.password === password) {
          const profileObj = { name: user.name || '', email: id.includes('@') ? id : '', phone: id.includes('@') ? '' : id };
          localStorage.setItem('qzero_profile', JSON.stringify(profileObj));
          setProfile(profileObj);
          navigate('/shop');
        } else {
          window.alert('Incorrect password');
        }
      } catch (e) {
        window.alert('Login error');
      }
    }
  };

  // OTP helpers (simulate send/verify)
  const sendOtp = (to: string) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const raw = sessionStorage.getItem('qzero_otps');
      const map = raw ? JSON.parse(raw) : {};
      map[to] = { code, expires: Date.now() + 5 * 60 * 1000 };
      sessionStorage.setItem('qzero_otps', JSON.stringify(map));
      // in real app send SMS/email; here we show an alert for dev
      // eslint-disable-next-line no-alert
      window.alert(`OTP for ${to}: ${code}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const verifyOtp = (to: string, value: string) => {
    try {
      const raw = sessionStorage.getItem('qzero_otps');
      const map = raw ? JSON.parse(raw) : {};
      const rec = map[to];
      if (!rec) return false;
      if (Date.now() > rec.expires) return false;
      return rec.code === value;
    } catch (e) {
      return false;
    }
  };

  const handleSendOtp = () => {
    const id = identifier.trim();
    if (!id) return window.alert('Enter email or phone');
    const ok = sendOtp(id);
    if (ok) setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    const id = identifier.trim();
    if (!id) return;
    if (verifyOtp(id, otp)) {
      // create profile if user exists
      try {
        const raw = localStorage.getItem('qzero_users');
        const users = raw ? JSON.parse(raw) : {};
        const user = users[id];
        if (user) {
          const profileObj = { name: user.name || '', email: id.includes('@') ? id : '', phone: id.includes('@') ? '' : id };
          localStorage.setItem('qzero_profile', JSON.stringify(profileObj));
          setProfile(profileObj);
        }
      } catch (e) {
        // ignore
      }
      navigate('/shop');
    } else {
      window.alert('Invalid or expired OTP');
    }
  };

  // Forgot password / reset flow
  const handleSendResetOtp = () => {
    const id = identifier.trim();
    if (!id) return window.alert('Enter email or phone');
    const ok = sendOtp(id);
    if (ok) setResetOtpSent(true);
  };

  const handleResetPassword = () => {
    const id = identifier.trim();
    if (!id) return;
    if (!resetOtpSent) return window.alert('Send OTP first');
    if (!verifyOtp(id, resetOtp)) return window.alert('Invalid or expired OTP');
    try {
      const raw = localStorage.getItem('qzero_users');
      const users = raw ? JSON.parse(raw) : {};
      if (!users[id]) return window.alert('No account found');
      users[id].password = newPassword;
      localStorage.setItem('qzero_users', JSON.stringify(users));
      window.alert('Password reset. You can now login with the new password.');
      setMode('password');
    } catch (e) {
      window.alert('Reset failed');
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qzero_profile');
      if (stored) setProfile(JSON.parse(stored));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem('qzero_profile');
      setProfile(null);
    } catch (e) {
      // ignore
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent px-4">
      <div className="glass-card max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">Q</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {role === 'admin' ? 'Admin Sign in' : role === 'guard' ? 'Guard Sign in' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {role === 'admin'
                ? 'Sign in with your admin account'
                : role === 'guard'
                ? 'Sign in to access the guard portal'
                : 'Sign in to continue shopping'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <label className="block">
            <span className="text-sm text-muted-foreground">
              {role === 'admin' ? 'Admin ID' : role === 'guard' ? 'Guard ID' : 'Email'}
            </span>
            <input
              required
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={role === 'admin' ? 'Admin ID' : role === 'guard' ? 'Guard ID' : 'you@company.com'}
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
              placeholder="Your password"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <button type="button" className="text-primary" onClick={() => setMode(mode === 'otp' ? 'password' : 'otp')}>
              {mode === 'otp' ? 'Use password' : 'Login with OTP'}
            </button>
            <button type="button" className="text-muted-foreground" onClick={() => setMode('reset')}>
              Forgot password?
            </button>
          </div>

          {mode === 'otp' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={handleSendOtp} className="btn-secondary flex-1 py-2">
                  Send OTP
                </button>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="mt-1 block w-40 rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="text-sm text-muted-foreground">{otpSent ? 'OTP sent — check alert (dev)' : ''}</div>
              <div className="flex gap-2">
                <button type="button" onClick={handleVerifyOtp} className="btn-primary flex-1 py-2">
                  Verify OTP
                </button>
                <button type="button" onClick={() => setMode('password')} className="btn-ghost flex-1 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Enter your email or phone to reset password</div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSendResetOtp} className="btn-secondary flex-1 py-2">
                  Send Reset OTP
                </button>
                <input
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Enter reset OTP"
                  className="mt-1 block w-40 rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <label className="block">
                <span className="text-sm text-muted-foreground">New Password</span>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="mt-1 block w-full rounded-lg border border-border bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="New password"
                />
              </label>

              <div className="flex gap-2">
                <button type="button" onClick={handleResetPassword} className="btn-primary flex-1 py-2">
                  Reset Password
                </button>
                <button type="button" onClick={() => setMode('password')} className="btn-ghost flex-1 py-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button type="submit" className="btn-primary w-full py-2 flex items-center justify-center">
              <Lock className="w-4 h-4 mr-2" /> Sign in
            </button>

            <div className="flex gap-3">
              <Link to="/" className="btn-secondary flex-1 py-2 text-center">
                Back to Landing
              </Link>

              {profile && (
                <button type="button" onClick={handleSignOut} className="btn-ghost flex-1 py-2">
                  Sign out
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          New here? <Link to="/signup" className="text-primary font-medium">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
