import React, { useState, useEffect } from 'react';
import './Profile.css';

interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  profilePicture?: string;
  emailVerified?: boolean;
  createdAt?: string;
}

interface ProfileProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, isOpen, onClose, onLogout, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      // Small delay to trigger the slide animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else if (shouldRender) {
      setIsAnimating(false);
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleSaveProfile = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      // Update basic profile info
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wordigo_access_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update local user data
      const updatedUser = { ...user, name, email };
      onUpdateProfile(updatedUser);
      localStorage.setItem('wordigo_user', JSON.stringify(updatedUser));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wordigo_access_token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!shouldRender || !user) {
    return null;
  }

  return (
    <div className={`profile-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}>
      <div className={`profile-container ${isAnimating && !isClosing ? 'open' : ''} ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            {success}
          </div>
        )}

        <div className="profile-content">
          {/* Profile Picture */}
          <div className="profile-picture-section">
            <div className="profile-picture-large">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.username} />
              ) : (
                <div className="profile-initials">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-username">@{user.username}</div>
            {user.emailVerified && (
              <div className="verified-badge">✓ Verified</div>
            )}
          </div>

          {/* Account Information */}
          <div className="profile-section">
            <h2 className="section-title">Account Information</h2>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={user.username}
                disabled
              />
              <p className="input-help">Username cannot be changed</p>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing || isLoading}
                placeholder="Enter your display name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing || isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Member Since</label>
              <input
                type="text"
                className="form-input"
                value={formatDate(user.createdAt)}
                disabled
              />
            </div>

            {!isEditing ? (
              <button
                className="primary-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <div className="button-group">
                <button
                  className="primary-button"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user.name || '');
                    setEmail(user.email);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="profile-section">
            <h2 className="section-title">Security</h2>

            {!showPasswordChange ? (
              <button
                className="secondary-button"
                onClick={() => setShowPasswordChange(true)}
              >
                Change Password
              </button>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="button-group">
                  <button
                    className="primary-button"
                    onClick={handleChangePassword}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Logout Section */}
          <div className="profile-section">
            <button
              className="logout-button"
              onClick={onLogout}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
