import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { setRecoveryGrant } from '../services/recoveryGrant';
import AuthTurnstile from '../components/auth/AuthTurnstile';
import './Recovery.css';

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '');

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email');
  const [code, setCode] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function sendCode(event) {
    event.preventDefault();
    if (working) return;
    if (!captcha) { setError('Complete CAPTCHA verification first.'); return; }
    setWorking(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${apiBase}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), captchaToken: captcha }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) throw new Error(`Too many attempts. Try again in ${body.retryAfter || 60} seconds.`);
        throw new Error(body.error || 'Unable to request a recovery code.');
      }
      setStep('otp');
      setMessage('If this email is registered, a recovery code will arrive shortly.');
    } catch (err) {
      setError(err?.message || 'Could not request a recovery code.');
    } finally {
      setCaptcha(''); setCaptchaReset(n => n + 1); setWorking(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    if (working) return;
    if (!supabase) { setError('Supabase authentication unavailable.'); return; }
    if (!/^\d{6,10}$/.test(code)) { setError('Enter the numeric OTP from your email.'); return; }
    setWorking(true); setError('');
    try {
      const address = email.trim().toLowerCase();
      const { data, error: verificationError } = await supabase.auth.verifyOtp({
        email: address, token: code, type: 'recovery',
      });
      if (verificationError) throw verificationError;
      if (!data?.session || !data?.user || data.user.email?.toLowerCase() !== address) {
        throw new Error('Unable to establish a verified recovery session.');
      }
      const { data: verifiedUser, error: identityError } = await supabase.auth.getUser();
      if (identityError || verifiedUser?.user?.id !== data.user.id) {
        throw new Error('Could not validate recovery identity.');
      }
      setRecoveryGrant(data.user.id, address);
      navigate('/reset-password', { replace: true });
    } catch (err) {
      setError(err?.status === 429 ? 'Too many OTP attempts. Try later.' : 'Invalid, expired, or used code. Check the latest email.');
    } finally { setWorking(false); }
  }

  return <main className="tg-recovery-page"><section className="tg-recovery-card" aria-labelledby="tg-forgot-title">
    <div className="tg-recovery-logo">takegrid<span>.</span></div>
    <h1 id="tg-forgot-title">Forgot your password?</h1>
    <p>{step === 'email' ? 'Enter your email and complete verification to receive a code.' : 'Enter the code from your email to continue.'}</p>
    <form onSubmit={step === 'email' ? sendCode : verifyCode}>
      <label htmlFor="tg-forgot-email">Email address</label>
      <div className="tg-recovery-field"><Mail size={18}/><input id="tg-forgot-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" maxLength={254} required readOnly={step === 'otp'} disabled={working}/></div>
      {step === 'email' ? <AuthTurnstile onToken={setCaptcha} resetKey={captchaReset} /> : <>
        <label htmlFor="tg-forgot-code">Email verification code</label>
        <div className="tg-recovery-field"><ShieldCheck size={18}/><input id="tg-forgot-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g,'').slice(0,10))} minLength={6} maxLength={10} pattern="[0-9]{6,10}" placeholder="Enter OTP" required disabled={working}/></div>
      </>}
      {message && <p className="tg-recovery-success" role="status">{message}</p>}
      {error && <p className="tg-recovery-error" role="alert">{error}</p>}
      <button type="submit" className="tg-recovery-primary" disabled={working || (step === 'email' && !captcha)}>{working ? 'Please wait…' : step === 'email' ? 'Send OTP' : 'Verify OTP'}</button>
    </form>
    {step === 'otp' && <button type="button" className="tg-recovery-back" onClick={() => { setStep('email'); setCode(''); setError(''); setMessage(''); }}>Send a new code</button>}
    <Link className="tg-recovery-back" to="/login"><ArrowLeft size={16}/> Back to sign in</Link>
  </section></main>;
}
