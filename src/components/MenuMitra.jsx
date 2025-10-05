import React from 'react';
// Adjust the path below to where your logo is actually stored
import logo from '../assets/logo.png';
import logo2 from '../assets/mm-logo.png';


const SOCIAL_LINKS = [
  {
    platform: 'facebook',
    url: 'https://www.facebook.com/people/Menu-Mitra/61565082412478/',
    icon: 'ri-facebook-fill',
    color: '#3c74ee'
  },
  {
    platform: 'instagram',
    url: 'https://www.instagram.com/menumitra/',
    icon: 'ri-instagram-fill',
    color: '#E4405F'
  },
  {
    platform: 'youtube',
    url: 'https://www.youtube.com/@menumitra',
    icon: 'ri-youtube-fill',
    color: '#FF0000'
  },
  {
    platform: 'google',
    url: 'https://www.google.com/search?q=MenuMitra',
    icon: 'ri-google-fill',
    color: '#4285F4'
  }
];

const MenuMitra = () => {
  const renderLogo = () => (
    <div className="d-flex flex-column align-items-center mb-4">
      <a href="https://menumitra.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none d-flex align-items-center">
        <img 
          src={logo2} 
          alt="MenuMitra Logo" 
          width="32" 
          height="32"
          className="img-fluid" 
        />
        <div className="text-dark fw-semibold ms-2 fs-5">
          MenuMitra
        </div>
      </a>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="d-flex justify-content-center gap-3 mb-3">
      {SOCIAL_LINKS.map(({ platform, url, icon, color }) => (
        <a
          key={platform}
          href={url}
          className="text-decoration-none"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit MenuMitra on ${platform}`}
        >
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center border"
            style={{ 
              width: '40px', 
              height: '40px', 
              borderColor: '#ddd',
              backgroundColor: '#fff'
            }}
          >
            <i className={icon} style={{ fontSize: '20px', color: color }}></i>
          </div>
        </a>
      ))}
    </div>
  );

  const renderFooter = () => (
    <div className="text-center">
      <p className="text-muted mb-0 small">version 2.0</p>
      <p className="text-muted mb-0 small">13 Aug 2025</p>
    </div>
  );

  return (
    <div className="border-top py-3 px-3 bg-light rounded-4">
      {renderLogo()}
      {renderSocialLinks()}
      {renderFooter()}
    </div>
  );
};

export default MenuMitra;