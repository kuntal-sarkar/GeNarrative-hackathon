import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import LoginVisual from '../components/auth/LoginVisual';

const RETURN_KEY = 'takegrid:auth-return';
const safeReturn = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') &&
  !value.includes('\\') && !value.startsWith('/login') && !value.startsWith('/signup')
    ? value : '/';

function getSameOriginReferrerPath() {
  if (typeof window === 'undefined' || !document.referrer) return '';
  try { const ref = new URL(document.referrer); return ref.origin === window.location.origin ? ref.pathname : ''; }
  catch { return ''; }
}

function temporaryPassword() {
  const random = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(random, b => b.toString(16).padStart(2, '0')).join('');
}

export default function Login({ signup = false }) {
  const { user, loading: sessionLoading, error: configError } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => location.state?.recoverySuccess
    ? 'Password updated successfully. Sign in with your new password.'
    : location.state?.signupSuccess ? 'Email verified and account ready. Please sign in.' : '');
  const [signupStage, setSignupStage] = useState('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [verifiedSignupId, setVerifiedSignupId] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);

  const target = useMemo(
    () => safeReturn(params.get('next') || sessionStorage.getItem(RETURN_KEY)),
    [params]
  );
  const referrerPath = useMemo(() => getSameOriginReferrerPath(), []);
  const arrivedFromDashboard = useMemo(() => {
    const source = (params.get('source') || params.get('from') || '').toLowerCase();
    if (['dashboard', 'home', 'landing'].includes(source)) return true;
    if (location.state?.fromDashboard || location.state?.from === 'dashboard') return true;
    return referrerPath === '/' || referrerPath === '/dashboard';
  }, [params, location.state, referrerPath]);

  useEffect(() => {
    // Signup OTP validation itself creates a temporary authenticated session.
    // Never redirect it away from the account-setup step.
    if (!signup && !sessionLoading && user) {
      if (user.user_metadata?.takegrid_onboarding_required === true) {
        navigate('/signup', { replace: true });
        return;
      }
      sessionStorage.removeItem(RETURN_KEY);
      navigate(target, { replace: true });
    }
  }, [sessionLoading, user, navigate, target, signup]);

  useEffect(() => {
    if (!signup || sessionLoading || !user) return;
    // Supabase automatically signs the user in when signup OTP is verified.
    // Reconstruct setup state after React re-mounts (instead of returning to email).
    const incomplete = user.user_metadata?.takegrid_onboarding_required === true;
    const hasName = Boolean(user.user_metadata?.full_name || user.user_metadata?.name);
    if (incomplete || (!hasName && user.email_confirmed_at)) {
      setVerifiedSignupId(user.id);
      setSignupEmail(user.email?.toLowerCase() || '');
      setSignupStage('setup');
    }
  }, [signup, sessionLoading, user?.id, user?.email, user?.email_confirmed_at, user?.user_metadata?.takegrid_onboarding_required, user?.user_metadata?.full_name, user?.user_metadata?.name]);

  async function submitEmail({ email, password, captchaToken, code, name, confirmPassword }) {
    setError(''); setNotice(''); setBusy(true);
    try {
      if (!supabase) throw new Error('Supabase client not configured.');
      if (signup && signupStage === 'email') {
        if (!captchaToken) throw new Error('Complete CAPTCHA verification first.');
        const address = email.trim().toLowerCase();
        // Creates an unconfirmed provisional user. The user chooses their real
        // password only AFTER verifying the signup email OTP.
        const { data, error: authError } = await supabase.auth.signUp({
          email: address,
          password: temporaryPassword(),
          options: { captchaToken, emailRedirectTo: `${window.location.origin}/login`, data: { takegrid_onboarding_required: true } },
        });
        if (authError) throw authError;
        if (data?.session) throw new Error('Enable Confirm Email in Supabase Auth before using email-first signup.');
        setSignupEmail(address);
        setSignupStage('otp');
        setNotice('If this email can register, a verification code will arrive shortly.');
      } else if (signup && signupStage === 'otp') {
        if (!/^\d{6,10}$/.test(code || '')) throw new Error('Enter the numeric email OTP.');
        const { data, error: authError } = await supabase.auth.verifyOtp({
          email: signupEmail, token: code, type: 'signup',
        });
        if (authError) throw authError;
        if (!data?.session || !data?.user || data.user.email?.toLowerCase() !== signupEmail) {
          throw new Error('Could not validate your email.');
        }
        const { data: verified, error: identityError } = await supabase.auth.getUser();
        if (identityError || verified?.user?.id !== data.user.id) throw new Error('Email verification session could not be confirmed.');
        setVerifiedSignupId(data.user.id);
        setSignupStage('setup');
        setNotice('Email verified. Complete your TakeGrid account.');
      } else if (signup && signupStage === 'setup') {
        const fullName = name?.trim();
        if (!fullName || fullName.length > 120) throw new Error('Enter your full name (up to 120 characters).');
        if (!password || password.length < 12) throw new Error('Use a password with at least 12 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        const { data: verified, error: identityError } = await supabase.auth.getUser();
        if (identityError || !verifiedSignupId || verified?.user?.id !== verifiedSignupId || verified.user.email?.toLowerCase() !== signupEmail) {
          throw new Error('Verification session expired. Start signup again.');
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password,
          data: { full_name: fullName, name: fullName, display_name: fullName, takegrid_onboarding_required: false, takegrid_onboarding_complete: true },
        });
        if (updateError) throw updateError;
        await supabase.auth.signOut({ scope: 'local' });
        navigate('/login', { replace: true, state: { signupSuccess: true } });
      } else {
        if (!captchaToken) throw new Error('Complete CAPTCHA verification first.');
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(), password, options: { captchaToken },
        });
        if (authError) throw authError;
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
      // Tokens are short-lived and single-use; do not allow the same one twice.
      if (!signup || signupStage === 'email') setCaptchaReset(x => x + 1);
    }
  }

  async function googleSignIn() {
    setError(''); setNotice(''); setBusy(true);
    try {
      if (!supabase) throw new Error('Supabase client not configured.');
      sessionStorage.setItem(RETURN_KEY, target);
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google', options: { redirectTo: `${window.location.origin}/login` },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err?.message || 'Could not start Google sign-in.');
      setBusy(false);
    }
  }

  if (sessionLoading) return <div role="status" className="tg-auth-loading">Checking your session...</div>;
  return <LoginVisual
    key={signup ? 'signup' : 'login'}
    signup={signup}
    signupStage={signupStage}
    signupEmail={signupEmail}
    captchaReset={captchaReset}
    onRestartSignup={() => { if (user?.user_metadata?.takegrid_onboarding_required) return; setSignupStage('email'); setVerifiedSignupId(''); setError(''); setNotice(''); }}
    switchTo={`${signup ? '/login' : '/signup'}?next=${encodeURIComponent(target)}`}
    onLogin={submitEmail}
    onGoogleLogin={googleSignIn}
    onSkip={() => navigate('/')}
    onBack={() => navigate(-1)}
    showBack={arrivedFromDashboard}
    showSkip={!arrivedFromDashboard}
    loading={busy}
    authEnabled={Boolean(supabase)}
    error={error || configError || ''}
    notice={notice}
  />;
}
