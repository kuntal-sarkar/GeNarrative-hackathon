import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, User, ShieldCheck } from 'lucide-react';
import AuthTurnstile from './AuthTurnstile';
import { BRAND_LOGO } from './loginBrand';
import './LoginVisual.css';

function Brand({ className = '' }) {
  return <div className={`tg-auth-brand ${className}`}>
    {BRAND_LOGO ? <img src={BRAND_LOGO} alt="TakeGrid logo" className="tg-auth-brand-image" /> : <span className="tg-auth-monogram" aria-hidden="true">TG</span>}
    <span className="tg-auth-brand-name">takegrid<span>.</span></span>
  </div>;
}

export default function LoginVisual({ onLogin, onGoogleLogin, onSkip, onBack, loading = false, error = '', notice = '', signup = false, signupStage = 'email', signupEmail = '', onRestartSignup, captchaReset = 0, switchTo = '/signup', authEnabled = true }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeFields, setActiveFields] = useState({});
  const activate = field => setActiveFields(old => old[field] ? old : { ...old, [field]: true });

  const emailStage = !signup || signupStage === 'email';
  const otpStage = signup && signupStage === 'otp';
  const setupStage = signup && signupStage === 'setup';
  const header = !signup ? 'Welcome back' : setupStage ? 'Finish your account' : otpStage ? 'Verify your email' : 'Create your account';

  function submit(event) {
    event.preventDefault();
    if (!loading && authEnabled) onLogin?.({
      name: name.trim(), email: email.trim(), password, confirmPassword,
      captchaToken, code: otp.trim(),
    });
  }

  return <main className="tg-login-page"><div className="tg-login-shell">
    <header className="tg-login-toolbar">
      <button className="tg-auth-plain" type="button" onClick={onBack}><ArrowLeft size={17}/> Back to dashboard</button>
      <button className="tg-auth-plain tg-auth-skip" type="button" onClick={onSkip}>Skip for now <ArrowRight size={17}/></button>
    </header>
    <section className="tg-login-layout" aria-label={signup ? 'Create a TakeGrid account' : 'Sign in to TakeGrid'}>
      <aside className="tg-login-intro">
        <Brand/>
        <div className="tg-login-intro-content">
          <div className="tg-auth-accent" aria-hidden="true"><span>STORY</span><span>SCENES</span><span>SHOTS</span></div>
          <h1>Every great story<br/>starts with <em>an idea.</em></h1>
          <p>Your creative workspace for shaping stories, planning scenes, and exploring new perspectives.</p>
        </div>
        <span className="tg-auth-intro-footer">TAKEGRID · CREATIVE STUDIO</span>
      </aside>
      <div className="tg-login-card"><div className="tg-login-card-inner">
        <Brand className="tg-auth-brand-mobile"/>
        <p className="tg-auth-overline">YOUR CREATIVE WORKSPACE</p>
        <h2>{header}<span>.</span></h2>
        <p className="tg-auth-description">{!signup ? 'Sign in to continue where you left off.' : otpStage ? `Enter the OTP sent to ${signupEmail}.` : setupStage ? 'Your email is verified. Choose your name and password.' : 'Verify your email first, then complete your account.'}</p>
        {onGoogleLogin && emailStage && <>
          <button type="button" className="tg-auth-google" onClick={onGoogleLogin} disabled={loading || !authEnabled}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.85 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.43 14.43 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6C30.03 37.64 27.31 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <div className="tg-auth-divider"><span/>or use email<span/></div>
        </>}
        <form className="tg-auth-form" onSubmit={submit} autoComplete="on">
          {emailStage && <>
            <label htmlFor="tg-login-email">Email address</label>
            <div className="tg-auth-field"><Mail size={17} aria-hidden="true"/><input id="tg-login-email" type="email" name="email" autoComplete="email" readOnly={!activeFields.email} onFocus={() => activate('email')} onPointerDown={() => activate('email')} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required disabled={loading || !authEnabled}/></div>
          </>}
          {otpStage && <>
            <label htmlFor="tg-signup-code">Email OTP</label>
            <div className="tg-auth-field"><ShieldCheck size={17}/><input id="tg-signup-code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit verification code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,10))} required disabled={loading || !authEnabled}/></div>
            <button type="button" className="tg-auth-plain" style={{ fontSize: 13, marginTop: 8 }} onClick={onRestartSignup}>Use a different email</button>
          </>}
          {setupStage && <>
            <label htmlFor="tg-login-name">Full name</label>
            <div className="tg-auth-field"><User size={17}/><input id="tg-login-name" type="text" autoComplete="name" name="name" readOnly={!activeFields.name} onFocus={() => activate('name')} onPointerDown={() => activate('name')} placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required disabled={loading || !authEnabled}/></div>
          </>}
          {(!signup || setupStage) && <>
            <label htmlFor="tg-login-password">{setupStage ? 'Create password' : 'Password'}</label>
            <div className="tg-auth-field"><LockKeyhole size={17}/><input id="tg-login-password" type={showPassword ? 'text' : 'password'} autoComplete={setupStage ? 'new-password' : 'current-password'} name="password" readOnly={!activeFields.password} onFocus={() => activate('password')} onPointerDown={() => activate('password')} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} minLength={setupStage ? 12 : 1} required disabled={loading || !authEnabled}/><button className="tg-auth-eye" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </>}
          {setupStage && <>
            <label htmlFor="tg-confirm-signup-password">Confirm password</label>
            <div className="tg-auth-field"><LockKeyhole size={17}/><input id="tg-confirm-signup-password" type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={12} required disabled={loading || !authEnabled}/></div>
          </>}
          {emailStage && <AuthTurnstile onToken={setCaptchaToken} resetKey={captchaReset}/>}
          {error && <p className="tg-auth-feedback tg-auth-error" role="alert">{error}</p>}
          {notice && <p className="tg-auth-feedback tg-auth-notice" role="status">{notice}</p>}
          {!signup && <div style={{ textAlign: 'right', marginTop: 7, marginBottom: 4 }}><Link to="/forgot-password" style={{ color: '#1B93F5', fontSize: 13, fontWeight: 750, textDecoration: 'none' }}>Forgot password?</Link></div>}
          <button type="submit" className="tg-auth-submit" disabled={loading || !authEnabled || (emailStage && !captchaToken)}>{loading ? 'Please wait…' : !signup ? 'Sign in' : otpStage ? 'Verify email OTP' : setupStage ? 'Create account' : 'Send email OTP'}</button>
        </form>
        <p className="tg-auth-switch">{signup ? 'Already have an account?' : 'New to TakeGrid?'} <Link to={switchTo}>{signup ? 'Sign in' : 'Create an account'}</Link></p>
      </div></div>
    </section>
    <footer className="tg-auth-bottom">© 2026 TakeGrid</footer>
  </div></main>;
}
