import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOutlet } from '../contexts/OutletContext';
import apiService from '../api/apiService';
import QueryErrorBoundary from '../components/QueryErrorBoundary';
import TestCacheButton from '../components/TestCacheButton';

function Categories() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const { outletId } = useOutlet();
  const [searchTerm, setSearchTerm] = useState("");

  // Replace useEffect + useState with useQuery
  const { 
    data: categories = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['categories', outletId],
    queryFn: () => apiService.categories.getList({ outletId }),
    enabled: !!outletId,
  });

  const handleCategoryClick = (e, category) => {
    e.preventDefault();
    navigate(`/category-menu/${category.menu_cat_id}`, { 
      state: { 
        categoryName: category.category_name,
        menuCount: category.menu_count 
      } 
    });
  };

  // Error component
  const ErrorMessage = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-3" role="alert">
      <i className="fas fa-exclamation-circle mr-2"></i>
      {message}
    </div>
  );

  // Skeleton component for loading state
  const CategorySkeleton = ({ isList = false }) => {
    const skeletonCount = 8; // Number of skeleton cards to show
    const skeletons = Array(skeletonCount).fill(null);

    return (
      <>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .skeleton-shimmer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 1.5s infinite;
          }
        `}</style>
        {skeletons.map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className={`${isList ? 'w-full' : 'w-1/2 md:w-1/3 lg:w-1/4'} mb-3 px-2`}
            role="status" 
            aria-busy="true" 
            aria-label="Loading categories"
          >
            <div 
              className={`h-full border-0 rounded-2xl shadow-sm bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden ${
                isList ? 'min-h-[88px]' : 'min-h-[140px]'
              } mb-4`}
            >
              {/* Shimmer effect overlay */}
              <div className="skeleton-shimmer" />
              
              <div className={`p-3 md:p-4 flex ${isList ? 'items-center' : 'flex-col items-center text-center'}`}>
                {/* Icon skeleton */}
                <div 
                  className={`${isList ? 'mr-3' : 'mb-3'} ${isList ? 'w-8 h-8' : 'w-9 h-9'} rounded-full bg-gray-300`}
                  aria-hidden="true"
                />
                
                <div className={isList ? 'flex-grow' : ''}>
                  {/* Title skeleton */}
                  <div 
                    className={`mb-2 h-[18px] rounded bg-gray-300 ${isList ? 'w-[70%]' : 'w-[80%]'}`}
                    aria-hidden="true"
                  />
                  
                  {/* Count skeleton */}
                  <div 
                    className={`h-[22px] rounded-xl bg-gray-300 ${isList ? 'w-[72px]' : 'w-[88px]'}`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  // View toggle component
  const ViewToggle = () => (
    <div className="flex justify-end items-center mb-4">
      <div className="bg-gray-100 rounded-full p-1 shadow-sm" role="group" aria-label="View mode">
        <button
          type="button"
          className={`px-3 py-2 mr-1 rounded-full text-sm transition-all duration-300 focus:outline-none hover:-translate-y-px ${
            viewMode === 'grid' 
              ? 'text-white shadow-sm bg-gradient-to-br from-[#FF7043] to-[#F4511E]' 
              : 'text-gray-500 hover:bg-black/5'
          }`}
          onClick={() => setViewMode('grid')}
        >
          <i className="fas fa-th-large"></i>
        </button>
      </div>
    </div>
  );

  // Category Card Component
  const CategoryCard = ({ category, index, isList }) => {
    const gradients = [
      'bg-gradient-to-br from-[rgba(255,112,67,0.65)] to-[rgba(244,81,30,0.65)]', // Warm Orange
      'bg-gradient-to-br from-[rgba(38,166,154,0.65)] to-[rgba(0,121,107,0.65)]', // Teal
      'bg-gradient-to-br from-[rgba(92,107,192,0.65)] to-[rgba(57,73,171,0.65)]', // Indigo
      'bg-gradient-to-br from-[rgba(126,87,194,0.65)] to-[rgba(81,45,168,0.65)]', // Deep Purple
    ];

    const icons = [
      'fa-utensils',
      'fa-hamburger',
      'fa-pizza-slice',
      'fa-coffee',
    ];

    return (
      <div className={isList ? 'w-full px-2' : 'w-1/2 md:w-1/3 lg:w-1/4 px-2'}>
        <div 
          onClick={(e) => handleCategoryClick(e, category)}
          className={`border-0 rounded-2xl shadow-sm cursor-pointer mb-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${gradients[index % 4]}`}
        >
          <div className="p-4">
            <div className={`flex ${isList ? 'items-center' : 'flex-col items-center text-center'}`}>
              <div className={isList ? 'mr-3' : 'mb-3'}>
                <i className={`fas ${icons[index % 4]} ${isList ? 'text-xl' : 'text-3xl'} text-white opacity-90`}></i>
              </div>
              <div className={isList ? 'flex-grow' : ''}>
                <h6 className="text-white mb-2 text-base font-semibold shadow-text">
                  {category.category_name}
                </h6>
                <span className="inline-block bg-white/25 text-white px-2 py-1 rounded-full text-sm">
                  {category.menu_count} Items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter categories by search term
  const filteredCategories = Array.isArray(categories)
    ? categories.filter((c) =>
        (c?.category_name || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : [];

  return (
    <div>
      <style>{`
        .shadow-text {
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
      `}</style>
      <Header />
      <div className="page-content pb-16">
        <div className="container mx-auto px-4">
          {/* Test cache controls - Remove in production */}
          {/* <TestCacheButton /> */}
          
          <QueryErrorBoundary>
            {/* Optional: Add refresh button */}
            {/* <div className="flex justify-between items-center mb-4">
              <ViewToggle />
              {!isLoading && (
                <button 
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                  onClick={() => refetch()}
                >
                  <i className="fas fa-sync-alt mr-1"></i>
                  Refresh
                </button>
              )}
            </div> */}

            {/* Search bar */}
            <div className="flex mb-3">
              <div className="w-full">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <span className="flex items-center justify-center px-3 bg-white">
                    <i className="fas fa-search text-gray-500"></i>
                  </span>
                  <input
                    type="search"
                    className="flex-1 px-3 py-2 border-0 outline-none focus:ring-0"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            {/* Categories display */}
            <div className="flex flex-wrap -mx-2">
              {isLoading ? (
                <CategorySkeleton isList={viewMode === 'list'} />
              ) : error ? (
                <div className="w-full px-2">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error.message || 'Failed to load categories'}
                  </div>
                </div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((category, index) => (
                  <CategoryCard 
                    key={category.menu_cat_id}
                    category={category}
                    index={index}
                    isList={viewMode === 'list'}
                  />
                ))
              ) : (
                <div className="w-full text-center py-12">
                  <i className="fas fa-folder-open text-5xl text-gray-400 mb-3 block"></i>
                  <h5 className="text-gray-500 text-lg">No categories found</h5>
                </div>
              )}
            </div>
          </QueryErrorBoundary>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Categories;
