import { useState } from 'react';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import toast from 'react-hot-toast';

export default function AccountSettings({ onClose, user }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const saveProfileToFirestore = async (u) => {
    await setDoc(
      doc(db, 'users', u.uid),
      {
        displayName: u.displayName || displayName || 'Anonymous',
        displayNameLower: (u.displayName || displayName || 'Anonymous').toLowerCase(),
        email: u.email,
      },
      { merge: true }
    );
  };

  const reauth = async () => {
    if (!currentPassword) throw new Error('Re-authentication required');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    return reauthenticateWithCredential(auth.currentUser, credential);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update display name locally and in profile
      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }

      // Update email if changed (requires recent auth)
      if (email !== user.email) {
        try {
          await updateEmail(auth.currentUser, email);
        } catch (err) {
          // Try reauth path
          await reauth();
          await updateEmail(auth.currentUser, email);
        }
      }

      // Update password if provided
      if (newPassword) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (err) {
          await reauth();
          await updatePassword(auth.currentUser, newPassword);
        }
      }

      await saveProfileToFirestore(auth.currentUser);
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete your account?')) return;
    if (!currentPassword) {
      toast.error('Enter your current password to delete account');
      return;
    }
    setLoading(true);
    try {
      await reauth();
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      toast.success('Account deleted');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          width: '460px',
          maxWidth: '94vw',
          color: '#e2e8f0',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Account Settings</h3>
        <form onSubmit={handleSave}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '6px' }}
              required
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={{ width: '100%', padding: '8px', marginTop: '6px' }}
              required
            />
          </label>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            New password (leave blank to keep current)
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              minLength={6}
              style={{ width: '100%', padding: '8px', marginTop: '6px' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: '8px' }}>
            Current password (required to change email/password or delete account)
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              style={{ width: '100%', padding: '8px', marginTop: '6px' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 12px', background: '#4ec9b0', color: '#000', border: 'none' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut(auth);
                onClose();
              }}
              style={{ padding: '8px 12px' }}
            >
              Log out
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              style={{
                marginLeft: 'auto',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
              }}
            >
              Delete account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
