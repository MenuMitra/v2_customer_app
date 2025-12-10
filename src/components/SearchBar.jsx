import { useState } from 'react';
import PropTypes from 'prop-types';

function SearchBar({ onSearch, menuItems = [] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase().trim();
    setSearchQuery(e.target.value);

    // Only filter if we have a query and menuItems
    if (!Array.isArray(menuItems)) {
      console.warn('menuItems is not an array');
      return;
    }

    const filteredResults = query === '' ? [] : menuItems.filter((item) => {
      if (!item) return false;

      // Check menu name
      const nameMatch = item.menuName?.toLowerCase().includes(query);
      if (nameMatch) return true;

      // Check description
      const descriptionMatch = item.description?.toLowerCase().includes(query);
      if (descriptionMatch) return true;

      // Check portions
      if (Array.isArray(item.portions)) {
        const portionMatch = item.portions.some(portion => 
          portion?.portionName?.toLowerCase().includes(query)
        );
        if (portionMatch) return true;
      }

      // Check category name if exists
      const categoryMatch = item.categoryName?.toLowerCase().includes(query);
      if (categoryMatch) return true;

      return false;
    });

    onSearch(filteredResults);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch([]); // Reset search results
  };

  return (
    <div className="mb-4">
      <style>{`
        .search-container:focus-within {
          border-color: #66ccd4 !important;
        }
      `}</style>
      <div className="search-container mb-3 flex items-center border-2 border-gray-300 rounded-lg bg-white overflow-hidden transition-colors duration-200">
        <span className="flex items-center justify-center px-3 py-2 bg-gray-50 border-r-2 border-gray-300">
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10.9395 1.9313C5.98074 1.9313 1.94141 5.97063 1.94141 10.9294C1.94141 15.8881 5.98074 19.9353 10.9395 19.9353C13.0575 19.9353 15.0054 19.193 16.5449 17.9606L20.293 21.7067C20.4821 21.888 20.7347 21.988 20.9967 21.9854C21.2587 21.9827 21.5093 21.8775 21.6947 21.6924C21.8801 21.5073 21.9856 21.2569 21.9886 20.9949C21.9917 20.7329 21.892 20.4802 21.7109 20.2908L17.9629 16.5427C19.1963 15.0008 19.9395 13.0498 19.9395 10.9294C19.9395 5.97063 15.8982 1.9313 10.9395 1.9313ZM10.9395 3.93134C14.8173 3.93134 17.9375 7.05153 17.9375 10.9294C17.9375 14.8072 14.8173 17.9352 10.9395 17.9352C7.06162 17.9352 3.94141 14.8072 3.94141 10.9294C3.94141 7.05153 7.06162 3.93134 10.9395 3.93134Z"
              fill="#7D8FAB"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search beverages or foods"
          className="flex-1 px-3 py-2 border-0 outline-none focus:ring-0"
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchQuery && (
          <span 
            className="flex items-center justify-center px-3 py-2 bg-gray-50 border-l-2 border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors" 
            onClick={handleClear}
            title="Clear search"
          >
            <i className="fa-regular fa-circle-xmark text-red-500"></i>
          </span>
        )}
      </div>
    </div>
  );
}

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  menuItems: PropTypes.array,
};

export default SearchBar;