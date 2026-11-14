import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getRecoveryGrant, clearRecoveryGrant } from '../services/recoveryGrant';
import './Recovery.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [grant] = useState(() => getRecoveryGrant());
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!grant || !supabase) { setChecking(false); return; }
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setValid(!authError && data?.user?.id === grant.userId && data.user.email?.toLowerCase() === grant.email);
      setChecking(false);
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [grant]);

  async function updatePassword(event) {
    event.preventDefault();
    if (!valid || busy) return;
    if (password.length < 12) { setError('Use at least 12 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || data?.user?.id !== grant.userId) throw new Error('Recovery session expired. Request a new code.');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut({ scope: 'local' });
      clearRecoveryGrant();
      navigate('/login', { replace: true, state: { recoverySuccess: true } });
    } catch (err) { setError(err?.message || 'Unable to update password.'); }
    finally { setBusy(false); }
  }

  return <main className="tg-recovery-page"><section className="tg-recovery-card" aria-labelledby="tg-reset-title">
    <div className="tg-recovery-logo">takegrid<span>.</span></div>
    <h1 id="tg-reset-title">Choose a new password</h1>
    {checking ? <p>Verifying recovery session…</p> : !valid ? <>
      <p className="tg-recovery-error">Recovery verification missing or expired. Request a new OTP.</p>
      <Link to="/forgot-password" className="tg-recovery-back">Request a new code</Link>
    </> : <>
      <p>OTP verified. Create a new password (minimum 12 characters).</p>
      <form onSubmit={updatePassword}>
        <label htmlFor="tg-new-password">New password</label>
        <div className="tg-recovery-field"><LockKeyhole size={18}/><input id="tg-new-password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy}/><button type="button" className="tg-recovery-eye" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        <label htmlFor="tg-confirm-password">Confirm password</label>
        <div className="tg-recovery-field"><LockKeyhole size={18}/><input id="tg-confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} disabled={busy}/></div>
        {error && <p className="tg-recovery-error" role="alert">{error}</p>}
        <button type="submit" className="tg-recovery-primary" disabled={busy}>{busy ? 'Updating…' : 'Save new password'}</button>
      </form>
    </>}
  </section></main>;
}
