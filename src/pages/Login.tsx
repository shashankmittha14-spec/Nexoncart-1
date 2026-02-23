import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ProfileType = {
  name: string;
  email: string;
  phone: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || '';
  const { t } = useTranslation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState<ProfileType | null>(null);

  const [mode, setMode] = useState<'password' | 'otp' | 'reset'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('nexoncart_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'admin') return navigate('/admin');
    if (role === 'guard') return navigate('/guard');

    const id = identifier.trim();
    if (!id) return;

    const raw = localStorage.getItem('nexoncart_users');
    const users = raw ? JSON.parse(raw) : {};
    const user = users[id];

    if (!user) return alert(t('login.noAccount'));

    if (user.password !== password) {
      return alert(t('login.incorrectPassword'));
    }

    const profileObj: ProfileType = {
      name: user.name || '',
      email: id.includes('@') ? id : '',
      phone: id.includes('@') ? '' : id,
    };

    localStorage.setItem('nexoncart_profile', JSON.stringify(profileObj));
    setProfile(profileObj);
    navigate('/shop');
  };

  const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = (to: string) => {
    const code = generateOtp();
    const mapRaw = sessionStorage.getItem('nexoncart_otps');
    const map = mapRaw ? JSON.parse(mapRaw) : {};

    map[to] = {
      code,
      expires: Date.now() + 5 * 60 * 1000,
    };

    sessionStorage.setItem('nexoncart_otps', JSON.stringify(map));
    alert(`${t('login.sendOtp')} (dev mode): ${code}`);
  };

  const verifyOtp = (to: string, value: string) => {
    const raw = sessionStorage.getItem('nexoncart_otps');
    if (!raw) return false;

    const map = JSON.parse(raw);
    const rec = map[to];

    if (!rec) return false;
    if (Date.now() > rec.expires) return false;

    return rec.code === value;
  };

  const handleVerifyOtp = () => {
    const id = identifier.trim();
    if (!verifyOtp(id, otp)) return alert(t('login.invalidOtp'));

    const raw = localStorage.getItem('nexoncart_users');
    const users = raw ? JSON.parse(raw) : {};
    const user = users[id];

    if (!user) return alert(t('login.noAccount'));

    const profileObj: ProfileType = {
      name: user.name || '',
      email: id.includes('@') ? id : '',
      phone: id.includes('@') ? '' : id,
    };

    localStorage.setItem('nexoncart_profile', JSON.stringify(profileObj));
    setProfile(profileObj);
    navigate('/shop');
  };

  const handleResetPassword = () => {
    const id = identifier.trim();

    if (!verifyOtp(id, resetOtp)) return alert(t('login.invalidOtp'));
    if (!newPassword) return alert(t('login.newPassword'));

    const raw = localStorage.getItem('nexoncart_users');
    const users = raw ? JSON.parse(raw) : {};

    if (!users[id]) return alert(t('login.noAccount'));

    users[id].password = newPassword;
    localStorage.setItem('nexoncart_users', JSON.stringify(users));

    alert(t('login.passwordUpdated'));
    setMode('password');
  };

  const handleSignOut = () => {
    localStorage.removeItem('nexoncart_profile');
    setProfile(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent px-4 relative">
      
      

      <div className="glass-card max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">Q</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {role === 'admin'
                ? t('login.adminSignIn')
                : role === 'guard'
                ? t('login.guardSignIn')
                : t('login.welcomeBack')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('login.signinPrompt')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <input
            required
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder={t('login.emailOrPhone')}
          />

          {mode === 'password' && (
              <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder={t('login.password')}
            />
          )}

          <div className="flex justify-between text-sm">
              <button
              type="button"
              onClick={() =>
                setMode(mode === 'otp' ? 'password' : 'otp')
              }
              className="text-primary"
            >
              {mode === 'otp' ? t('login.usePassword') : t('login.loginWithOtp')}
            </button>

            <button
              type="button"
              onClick={() => setMode('reset')}
              className="text-muted-foreground"
            >
              {t('login.forgotPassword')}
            </button>
          </div>

          {mode === 'otp' && (
            <div className="space-y-2">
                <button
                type="button"
                onClick={() => {
                  sendOtp(identifier.trim());
                  setOtpSent(true);
                }}
                className="btn-secondary w-full py-2"
              >
                {t('login.sendOtp')}
              </button>

              {otpSent && (
                <>
                    <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={t('login.enterOtp')} className="w-full border rounded-lg px-3 py-2" />
                  <button type="button" onClick={handleVerifyOtp} className="btn-primary w-full py-2">{t('login.verifyOtp')}</button>
                </>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  sendOtp(identifier.trim());
                  setResetOtpSent(true);
                }}
                className="btn-secondary w-full py-2"
              >
                {t('login.sendResetOtp')}
              </button>

              {resetOtpSent && (
                <>
                  <input value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} placeholder={t('login.enterOtp')} className="w-full border rounded-lg px-3 py-2" />

                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('login.newPassword')} className="w-full border rounded-lg px-3 py-2" />

                  <button type="button" onClick={handleResetPassword} className="btn-primary w-full py-2">{t('login.resetPassword')}</button>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-2 flex items-center justify-center"
          >
            <Lock className="w-4 h-4 mr-2" /> Sign In
          </button>

          <div className="flex gap-3">
            <Link to="/" className="btn-secondary flex-1 py-2 text-center">{t('login.back')}</Link>

            {profile && (
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-ghost flex-1 py-2"
              >
                {t('login.signOut')}
              </button>
            )}
          </div>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          {t('login.newHere')}{' '}
          <Link to="/signup" className="text-primary font-medium">{t('login.createAccount')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;