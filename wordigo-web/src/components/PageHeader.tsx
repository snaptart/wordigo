import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  onMenuClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, onBack, onMenuClick }) => {
  return (
    <header className="page-header">
      <div className="header-left">
        <button
          className="back-button"
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>
      </div>

      <h1 className="page-title">{title}</h1>

      <div className="header-right">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Menu"
        >
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
          <div className="hamburger-line"></div>
        </button>
      </div>
    </header>
  );
};

export default PageHeader;
