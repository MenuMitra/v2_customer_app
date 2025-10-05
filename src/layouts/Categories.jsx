import React, { useState } from "react";
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
    <div className="alert alert-danger mx-3" role="alert">
      <i className="fas fa-exclamation-circle me-2"></i>
      {message}
    </div>
  );

  // Skeleton component for loading state
  const CategorySkeleton = ({ isList = false }) => {
    const skeletonCount = 8; // Number of skeleton cards to show
    const skeletons = Array(skeletonCount).fill(null);

    return (
      <>
        {skeletons.map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className={`${isList ? 'col-12' : 'col-6 col-md-4 col-lg-3'} mb-3`}
            role="status" 
            aria-busy="true" 
            aria-label="Loading categories"
          >
            <div 
              className="card h-100 border-0 rounded-4 shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: isList ? '88px' : '140px',
                marginBottom: '1rem',
              }}
            >
              {/* Shimmer effect overlay */}
              <div className="skeleton-shimmer" />
              
              <div className={`card-body d-flex ${isList ? 'align-items-center' : 'flex-column align-items-center text-center'} p-3 p-md-4`}>
                {/* Icon skeleton */}
                <div 
                  className={isList ? 'me-3' : 'mb-3'} 
                  style={{
                    width: isList ? '32px' : '36px',
                    height: isList ? '32px' : '36px',
                    borderRadius: '50%',
                    background: '#e0e0e0',
                  }} 
                  aria-hidden="true"
                />
                
                <div className={isList ? 'flex-grow-1' : ''}>
                  {/* Title skeleton */}
                  <div 
                    className="mb-2" 
                    style={{
                      width: isList ? '70%' : '80%',
                      height: '18px',
                      borderRadius: '4px',
                      background: '#e0e0e0',
                    }} 
                    aria-hidden="true"
                  />
                  
                  {/* Count skeleton */}
                  <div 
                    style={{
                      width: isList ? '72px' : '88px',
                      height: '22px',
                      borderRadius: '12px',
                      background: '#e0e0e0',
                    }} 
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
    <div className="d-flex justify-content-end align-items-center mb-4">
      <div className="bg-light rounded-pill p-1 shadow-sm" role="group" aria-label="View mode">
        <button
          type="button"
          className={`btn btn-sm rounded-pill px-3 py-2 me-1 ${
            viewMode === 'grid' 
              ? 'text-white shadow-sm' 
              : 'text-muted'
          }`}
          onClick={() => setViewMode('grid')}
          style={{
            background: viewMode === 'grid' 
              ? 'linear-gradient(135deg, #FF7043 0%, #F4511E 100%)' 
              : 'transparent',
            border: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          <i className="fas fa-th-large"></i>
        </button>
      </div>
      <style>
        {`
          .btn:focus {
            box-shadow: none !important;
          }
          .btn:hover {
            transform: translateY(-1px);
          }
          .btn:not(.text-white):hover {
            background: rgba(0,0,0,0.05) !important;
          }
        `}
      </style>
    </div>
  );

  // Category Card Component
  const CategoryCard = ({ category, index, isList }) => {
    const gradients = {
      0: 'linear-gradient(135deg, rgba(255, 112, 67, 0.65) 0%, rgba(244, 81, 30, 0.65) 100%)', // Warm Orange
      1: 'linear-gradient(135deg, rgba(38, 166, 154, 0.65) 0%, rgba(0, 121, 107, 0.65) 100%)', // Teal
      2: 'linear-gradient(135deg, rgba(92, 107, 192, 0.65) 0%, rgba(57, 73, 171, 0.65) 100%)', // Indigo
      3: 'linear-gradient(135deg, rgba(126, 87, 194, 0.65) 0%, rgba(81, 45, 168, 0.65) 100%)', // Deep Purple
    };

    const icons = {
      0: 'fa-utensils',
      1: 'fa-hamburger',
      2: 'fa-pizza-slice',
      3: 'fa-coffee',
    };

    return (
      <div className={isList ? 'col-12' : 'col-6 col-md-4 col-lg-3'}>
        <div 
          onClick={(e) => handleCategoryClick(e, category)}
          className="card border-0 rounded-4 shadow-sm cursor-pointer mb-3"
          style={{
            background: gradients[index % 4],
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
          }}
        >
          <div className="card-body">
            <div className={`d-flex ${isList ? 'align-items-center' : 'flex-column align-items-center text-center'}`}>
              <div className={`icon-wrapper ${isList ? 'me-3' : 'mb-3'}`}>
                <i className={`fas ${icons[index % 4]} fa-${isList ? '1x' : '2x'} text-white opacity-90`}></i>
              </div>
              <div className={isList ? 'flex-grow-1' : ''}>
                <h6 className="text-white mb-2"
                  style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                  {category.category_name}
                </h6>
                <span className="badge bg-white bg-opacity-25 text-white px-2 py-1 rounded-pill">
                  {category.menu_count} Items
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Header />
      <div className="page-content p-b60">
        <div className="container">
          {/* Test cache controls - Remove in production */}
          {/* <TestCacheButton /> */}
          
          <QueryErrorBoundary>
            {/* Optional: Add refresh button */}
            {/* <div className="d-flex justify-content-between align-items-center mb-4">
              <ViewToggle />
              {!isLoading && (
                <button 
                  className="btn btn-light btn-sm"
                  onClick={() => refetch()}
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  Refresh
                </button>
              )}
            </div> */}

            {/* Categories display */}
            <div className="row">
              {isLoading ? (
                <CategorySkeleton isList={viewMode === 'list'} />
              ) : error ? (
                <div className="col-12">
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error.message || 'Failed to load categories'}
                  </div>
                </div>
              ) : categories.length > 0 ? (
                categories.map((category, index) => (
                  <CategoryCard 
                    key={category.menu_cat_id}
                    category={category}
                    index={index}
                    isList={viewMode === 'list'}
                  />
                ))
              ) : (
                <div className="col-12 text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3 d-block"></i>
                  <h5 className="text-muted">No categories found</h5>
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
