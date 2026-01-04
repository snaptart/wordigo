import React, { useState, useEffect } from 'react';
import './Menu.css';

interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  profilePicture?: string;
}

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isGuest: boolean;
  onProfile?: () => void;
  onSettings?: () => void;
  onHistory?: () => void;
  onWordLookup?: () => void;
  onAbout?: () => void;
  onHelp?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

const Menu: React.FC<MenuProps> = ({
  isOpen,
  onClose,
  user,
  isGuest,
  onProfile,
  onSettings,
  onHistory,
  onWordLookup,
  onAbout,
  onHelp,
  onLogout,
  onLogin
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to let the browser render the closed state before opening
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for slide-up animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Menu Panel */}
      <div
        className={`menu-panel ${isAnimating ? 'is-open' : ''}`}
      >
        <div className="menu-header">
          <h2 className="menu-title">me·nu</h2>
          <button className="menu-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="menu-content">
          {/* User Info Section */}
          {user && (
            <div className="menu-user-section">
              <div className="menu-user-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} />
                ) : (
                  <div className="menu-user-initials">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="menu-user-info">
                <div className="menu-user-name">{user.name || user.username}</div>
                <div className="menu-user-email">@{user.username}</div>
              </div>
            </div>
          )}

          {isGuest && (
            <div className="menu-guest-section">
              <div className="menu-guest-text">Playing as Guest</div>
              <button className="menu-guest-login" onClick={onLogin}>
                Log In to Save Progress
              </button>
            </div>
          )}

          {/* Menu Items */}
          <nav className="menu-nav">
            {user && onProfile && (
              <button className="menu-item" onClick={() => { onProfile(); onClose(); }}>
                <span className="menu-item-text">pro·file</span>
              </button>
            )}

            {user && onHistory && (
              <button className="menu-item" onClick={() => { onHistory(); onClose(); }}>
                <span className="menu-item-text">game his·to·ry</span>
              </button>
            )}

            {user && onWordLookup && (
              <button className="menu-item" onClick={() => { onWordLookup(); onClose(); }}>
                <span className="menu-item-text">word look·up</span>
              </button>
            )}

            {onSettings && (
              <button className="menu-item" onClick={() => { onSettings(); onClose(); }}>
                <span className="menu-item-text">set·tings</span>
              </button>
            )}

            <button className="menu-item" onClick={() => { onHelp?.(); onClose(); }}>
              <span className="menu-item-text">help & tu·to·ri·al</span>
            </button>

            <button className="menu-item" onClick={() => { onAbout?.(); onClose(); }}>
              <span className="menu-item-text">a·bout de·find·able</span>
            </button>
          </nav>

          {/* Logout Button */}
          {user && onLogout && (
            <div className="menu-footer">
              <button
                className="menu-logout"
                onClick={() => { onLogout(); onClose(); }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Menu;
