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
  onAbout,
  onHelp,
  onLogout,
  onLogin
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div className={`menu-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}></div>

      {/* Menu Panel */}
      <div className={`menu-panel ${isClosing ? 'closing' : ''}`}>
        <div className="menu-header">
          <h2 className="menu-title">Menu</h2>
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
                <span className="menu-item-text">Profile</span>
              </button>
            )}

            {onSettings && (
              <button className="menu-item" onClick={() => { onSettings(); onClose(); }}>
                <span className="menu-item-text">Settings</span>
              </button>
            )}

            <button className="menu-item" onClick={() => { onHelp?.(); onClose(); }}>
              <span className="menu-item-text">Help & Tutorial</span>
            </button>

            <button className="menu-item" onClick={() => { onAbout?.(); onClose(); }}>
              <span className="menu-item-text">About Wordigo</span>
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
