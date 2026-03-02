// Adjust the path below to where your logo is actually stored
import logo2 from '../assets/mm-logo.png';


const SOCIAL_LINKS = [
  {
    platform: 'google',
    url: 'https://menumitra.com/',
    icon: 'ri-google-fill',
    color: '#4285F4'
  },
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
  }
];

const MenuMitra = () => {
  const renderLogo = () => (
    <div className="flex flex-col items-center mb-2 pb-2">
      <a href="https://menumitra.com" target="_blank" rel="noopener noreferrer" className="no-underline flex items-center">
        <img
          src={logo2}
          alt="MenuMitra Logo"
          className="w-8 h-8 max-w-full"
        />
        <div className="text-gray-900 font-semibold ml-2 text-xl">
          MenuMitra
        </div>
      </a>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="flex justify-center gap-3 mb-3">
      {SOCIAL_LINKS.map(({ platform, url, icon }) => (
        <a
          key={platform}
          href={url}
          className="no-underline"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit MenuMitra on ${platform}`}
        >
          <div className="rounded-full flex items-center justify-center border border-[#ddd] bg-white w-10 h-10 hover:shadow-md transition-shadow duration-200">
            <i className={`${icon} text-xl social-icon-${platform}`}></i>
          </div>
        </a>
      ))}
    </div>
  );

  const renderFooter = () => (
    <div className="text-center">
      <p className="text-gray-500 mb-0 text-sm">version 2.2.0</p>
      <p className="text-gray-500 mb-0 text-sm">13 Aug 2025</p>
    </div>
  );

  return (
    <>
      <style>{`
        .social-icon-google { color: #4285F4; }
        .social-icon-facebook { color: #3c74ee; }
        .social-icon-instagram { color: #E4405F; }
        .social-icon-youtube { color: #FF0000; }
      `}</style>
      <div className="border-t border-gray-200  py-3 px-3 pb-3 bg-gray-100 rounded-2xl">
        {renderLogo()}
        {renderSocialLinks()}
        {renderFooter()}
      </div>
    </>
  );
};

export default MenuMitra;