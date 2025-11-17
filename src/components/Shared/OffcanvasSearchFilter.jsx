import React, { useState, useEffect } from 'react'

function OffcanvasSearchFilter({ onClose, onApplyFilter }) {
  const [foodTypes, setFoodTypes] = useState({});
  const [filters, setFilters] = useState({
    priceRange: {
      min: '',
      max: ''
    },
    starRating: 4,
    foodType: {},  // This will now be dynamically populated
    others: {
      discount: false,
      voucher: false,
      freeShipping: false,
      sameDayDelivery: false
    }
  });

  useEffect(() => {
    // Fetch food types when component mounts
    fetchFoodTypes();
  }, []);

  const fetchFoodTypes = async () => {
    try {
      const response = await fetch('https://ghanish.in/v2/user/get_food_type_list');
      const data = await response.json();
      const foodTypeList = data.detail.food_type_list;
      
      // Initialize foodType filters with all types set to false
      const initialFoodTypes = Object.keys(foodTypeList).reduce((acc, type) => {
        acc[type] = false;
        return acc;
      }, {});

      setFoodTypes(foodTypeList);
      setFilters(prev => ({
        ...prev,
        foodType: initialFoodTypes
      }));
    } catch (error) {
      console.error('Error fetching food types:', error);
    }
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: value
      }
    }));
  };

  const handleOthersChange = (type) => {
    setFilters(prev => ({
      ...prev,
      others: {
        ...prev.others,
        [type]: !prev.others[type]
      }
    }));
  };

  const handleFoodTypeChange = (type) => {
    setFilters(prev => ({
      ...prev,
      foodType: {
        ...prev.foodType,
        [type]: !prev.foodType[type]
      }
    }));
  };

  const handleApplyClick = () => {
    onApplyFilter(filters);
    onClose();
  };

  // Add reset handler
  const handleReset = () => {
    const initialState = {
      priceRange: {
        min: '',
        max: ''
      },
      starRating: 4,
      foodType: Object.keys(foodTypes).reduce((acc, type) => {
        acc[type] = false;
        return acc;
      }, {}),
      others: {
        discount: false,
        voucher: false,
        freeShipping: false,
        sameDayDelivery: false
      }
    };
    
    setFilters(initialState);
    onApplyFilter(initialState); // This will reset the filters and show all results
  };

  return (
    <div className="offcanvas-body container">
      <div className="filter-area">
        <div className="filter-head">
          <button 
            type="button" 
            className="me-2 btn-close p-0 text-reset" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.70632 20.9907C4.26501 21.0166 3.83099 20.8682 3.4958 20.5767C2.83473 19.904 2.83473 18.8175 3.4958 18.1447L17.971 3.50102C18.6586 2.85015 19.7375 2.88633 20.3809 3.5819C20.9627 4.2109 20.9966 5.17769 20.4603 5.84679L5.89977 20.5767C5.56889 20.864 5.14185 21.0121 4.70632 20.9907Z" fill="black"></path>
              <path d="M19.1645 20.9907C18.7173 20.9888 18.2886 20.8092 17.971 20.4905L3.49574 5.84675C2.8833 5.12323 2.96656 4.03438 3.68176 3.41475C4.32008 2.86175 5.26149 2.86175 5.89976 3.41475L20.4603 18.0585C21.1477 18.7095 21.1832 19.801 20.5397 20.4964C20.5141 20.5241 20.4876 20.5508 20.4603 20.5767C20.1037 20.8904 19.6345 21.0403 19.1645 20.9907Z" fill="black"></path>
            </svg>
          </button>
          <h2 className="mb-0 flex-1">Search Filters</h2>
          <h6 
            className="sub-title mb-0 text-accent" 
            style={{ cursor: 'pointer' }}
            onClick={handleReset}
          >
            Reset
          </h6>
        </div>
        <div className="filter-content">
          <div className="title-bar">
            <h5 className="sub-title mb-0">Food Type</h5>
          </div>
          <div className="border-bottom d-flex justify-content-between align-items-center pb-3">
            <ul className="d-flex align-items-center flex-wrap w-100">
              {Object.entries(foodTypes).map(([type, label]) => (
                <li key={type} className="w-50 pb-2 pe-2">
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      checked={filters.foodType[type] || false}
                      onChange={() => handleFoodTypeChange(type)}
                      id={`${type}Filter`} 
                    />
                    <label className="form-check-label" htmlFor={`${type}Filter`}>
                      {label.charAt(0).toUpperCase() + label.slice(1)} {/* Capitalize first letter */}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="title-bar">
            <h5 className="sub-title">Price Range</h5>
          </div>
          <div className="border-bottom d-flex justify-content-between align-items-center">
            <div className="mb-3 me-3 input-group input-group-icon">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Min"
                value={filters.priceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
              />
            </div>
            <div className="mb-3 input-group input-group-icon">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Max"
                value={filters.priceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
              />
            </div>
          </div>
          {/* <div className="title-bar">
            <h5 className="sub-title">Star Ratings</h5>
          </div>
          <div className="border-bottom d-flex align-items-center pb-3">
            <div className="rating-stars">
              <ul id="stars">
                <li className="star" title="Poor" data-value="1">
                  <i className="fa fa-star fa-fw"></i>
                </li>
                <li className="star" title="Fair" data-value="2">
                  <i className="fa fa-star fa-fw"></i>
                </li>
                <li className="star" title="Good" data-value="3">
                  <i className="fa fa-star fa-fw"></i>
                </li>
                <li className="star" title="Excellent" data-value="4">
                  <i className="fa fa-star fa-fw"></i>
                </li>
                <li className="star" title="WOW!!!" data-value="5">
                  <i className="fa fa-star fa-fw"></i>
                </li>
              </ul>
            </div>
            <h6 className="sub-title text-soft mb-0 ms-auto font-w500">4 Stars</h6>
          </div> */}
          <div className="title-bar">
            <h5 className="sub-title">Others</h5>
          </div>	
          <div className="border-bottom pb-3">
            <ul className="d-flex align-items-center flex-wrap">
              <li className="w-50 pb-2 pe-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={filters.others.discount}
                    onChange={() => handleOthersChange('discount')}
                    id="flexCheckChecked1" 
                  />
                  <label className="form-check-label" htmlFor="flexCheckChecked1">
                    Discount
                  </label>
                </div>
              </li>
              <li className="w-50 pb-2 pe-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={filters.others.voucher}
                    onChange={() => handleOthersChange('voucher')}
                    id="flexCheckChecked2"
                  />
                  <label className="form-check-label" htmlFor="flexCheckChecked2">
                    Voucher
                  </label>
                </div>
              </li>
              <li className="w-50 pb-2 pe-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={filters.others.freeShipping}
                    onChange={() => handleOthersChange('freeShipping')}
                    id="flexCheckChecked3"
                  />
                  <label className="form-check-label" htmlFor="flexCheckChecked3">
                    Free Shipping
                  </label>
                </div>
              </li>
              <li className="w-50 pb-2 pe-2">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    checked={filters.others.sameDayDelivery}
                    onChange={() => handleOthersChange('sameDayDelivery')}
                    id="flexCheckChecked4"
                  />
                  <label className="form-check-label" htmlFor="flexCheckChecked4">
                    Same Day Deliv.
                  </label>
                </div>
              </li>
            </ul>
          </div>
          <div className="title-bar">
            <h5 className="sub-title">Categories</h5>
          </div>
          <div className="pb-3">
            <ul className="Categories">
              <li className="d-flex align-items-center pb-3">
                <svg className="me-3" width="21" height="24" viewBox="0 0 21 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.4375 7.59375C20.4375 5.37085 18.6292 3.5625 16.4062 3.5625C15.1646 3.5625 14.0526 4.1272 13.3125 5.0127C12.7648 4.35736 12.0132 3.87872 11.1562 3.67365V3.60938C11.1562 2.65302 11.9343 1.875 12.8906 1.875C13.4084 1.875 13.8281 1.45532 13.8281 0.9375C13.8281 0.419678 13.4084 0 12.8906 0C10.9005 0 9.28125 1.6192 9.28125 3.60938V3.67365C8.42432 3.87872 7.67267 4.35736 7.125 5.0127C6.38489 4.1272 5.27289 3.5625 4.03125 3.5625C1.80835 3.5625 0 5.37085 0 7.59375C0 9.71503 1.64722 11.4575 3.72949 11.6125C3.32776 12.2393 3.09375 12.9833 3.09375 13.7812C3.09375 15.9025 4.74097 17.645 6.82324 17.8C6.42151 18.4268 6.1875 19.1708 6.1875 19.9688C6.1875 22.1917 7.99585 24 10.2188 24C12.4417 24 14.25 22.1917 14.25 19.9688C14.25 19.1708 14.016 18.4268 13.6143 17.8C15.6965 17.645 17.3438 15.9025 17.3438 13.7812C17.3438 12.9833 17.1097 12.2393 16.708 11.6125C18.7903 11.4575 20.4375 9.71503 20.4375 7.59375ZM10.2122 5.43768C10.2144 5.43768 10.2166 5.43805 10.2188 5.43805C10.2209 5.43805 10.2231 5.43768 10.2253 5.43768C11.4113 5.44135 12.375 6.40704 12.375 7.59375C12.375 8.78265 11.4077 9.75 10.2188 9.75C9.02985 9.75 8.0625 8.78265 8.0625 7.59375C8.0625 6.40704 9.02618 5.44135 10.2122 5.43768ZM4.03125 9.75C2.84235 9.75 1.875 8.78265 1.875 7.59375C1.875 6.40485 2.84235 5.4375 4.03125 5.4375C5.22015 5.4375 6.1875 6.40485 6.1875 7.59375C6.1875 8.78265 5.22015 9.75 4.03125 9.75ZM7.125 15.9375C5.9361 15.9375 4.96875 14.9702 4.96875 13.7812C4.96875 12.5923 5.9361 11.625 7.125 11.625C8.3139 11.625 9.28125 12.5923 9.28125 13.7812C9.28125 14.9702 8.3139 15.9375 7.125 15.9375ZM10.2188 22.125C9.02985 22.125 8.0625 21.1577 8.0625 19.9688C8.0625 18.7798 9.02985 17.8125 10.2188 17.8125C11.4077 17.8125 12.375 18.7798 12.375 19.9688C12.375 21.1577 11.4077 22.125 10.2188 22.125ZM13.3125 15.9375C12.1236 15.9375 11.1562 14.9702 11.1562 13.7812C11.1562 12.5923 12.1236 11.625 13.3125 11.625C14.5014 11.625 15.4688 12.5923 15.4688 13.7812C15.4688 14.9702 14.5014 15.9375 13.3125 15.9375ZM16.4062 9.75C15.2173 9.75 14.25 8.78265 14.25 7.59375C14.25 6.40485 15.2173 5.4375 16.4062 5.4375C17.5952 5.4375 18.5625 6.40485 18.5625 7.59375C18.5625 8.78265 17.5952 9.75 16.4062 9.75Z" fill="var(--primary)"></path>
                </svg>
                <h6 className="sub-title mb-0 flex-1 font-w700">Fresh Fruits</h6>
                <h6 className="sub-title text-soft mb-0 ms-auto font-w500">4 Stars</h6>
                <svg className="ms-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.25005 20.25C8.05823 20.25 7.86623 20.1767 7.7198 20.0303C7.42673 19.7372 7.42673 19.2626 7.7198 18.9698L14.6895 12L7.7198 5.03026C7.42673 4.7372 7.42673 4.26263 7.7198 3.96976C8.01286 3.67688 8.48742 3.67669 8.7803 3.96976L16.2803 11.4698C16.5734 11.7628 16.5734 12.2374 16.2803 12.5303L8.7803 20.0303C8.63386 20.1767 8.44186 20.25 8.25005 20.25Z" fill="#7D8FAB"></path>
                </svg>
              </li>
              <li className="d-flex align-items-center pb-3">
                <svg className="me-3" width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.7503 9.55885C23.6609 9.24995 23.4192 9.00825 23.1103 8.91889C22.9371 8.86872 18.8331 7.72651 15.7764 10.7836C14.2333 12.3272 13.9651 14.6464 15.0101 16.335L12.9373 18.4082V11.0907C14.8702 10.6359 16.32 8.80518 16.32 6.6222C16.32 2.29834 12.6105 0.20343 12.4525 0.116455C12.1708 -0.0388184 11.8292 -0.0388184 11.5475 0.116455C11.3895 0.20343 7.67999 2.29834 7.67999 6.6222C7.67999 8.80518 9.12982 10.6359 11.0627 11.0907V18.4082L8.99157 16.3367C10.0062 14.7063 9.81756 12.3779 8.22345 10.7836C5.16686 7.72651 1.06292 8.8689 0.889699 8.91889C0.580799 9.00825 0.339283 9.24995 0.249744 9.55885C0.199757 9.73225 -0.942456 13.8371 2.11413 16.8942C3.68096 18.4613 5.99963 18.6912 7.66424 17.6607L11.3315 21.3285C11.7008 21.705 12.3032 21.7011 12.6689 21.3283L16.3347 17.6618C17.9744 18.6826 20.2989 18.4814 21.8859 16.8942C24.9425 13.8369 23.8002 9.73206 23.7503 9.55885ZM7.59631 14.9409L6.45098 13.7954C6.08496 13.4293 5.49151 13.4293 5.1253 13.7954C4.75927 14.1616 4.75927 14.7552 5.1253 15.1212L6.27026 16.2664C5.35693 16.6038 4.23376 16.3625 3.43963 15.5684C2.11413 14.2425 1.68694 12.4206 1.94677 10.6163C3.73937 10.3579 5.56329 10.7747 6.89794 12.1095C7.71624 12.928 7.92443 14.0548 7.59631 14.9409ZM12 6.56067C11.4824 6.56067 11.0627 6.98054 11.0627 7.49817V9.11774C10.1783 8.71052 9.55462 7.74537 9.55462 6.6222C9.55462 4.74537 10.543 3.15399 12.0016 2.06305C12.8174 2.67114 14.4454 4.19001 14.4454 6.6222C14.4454 7.74537 13.8219 8.71052 12.9373 9.11774V7.49817C12.9373 6.98054 12.5176 6.56067 12 6.56067ZM20.5602 15.5684C19.7419 16.3869 18.6152 16.595 17.7294 16.2667L18.8747 15.1214C19.2405 14.7552 19.2405 14.1616 18.8747 13.7955C18.5087 13.4295 17.9152 13.4295 17.549 13.7955L16.4042 14.9405C16.0666 14.027 16.3079 12.9038 17.1021 12.1095C18.4387 10.7727 20.2723 10.3592 22.0552 10.6166C22.2021 11.6234 22.2796 13.8486 20.5602 15.5684Z" fill="var(--primary)"></path>
                </svg>
                <h6 className="sub-title mb-0 flex-1 font-w700">Fresh Vegetables</h6>
                <h6 className="sub-title text-soft mb-0 ms-auto font-w500">68 Items</h6>
                <svg className="ms-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.25005 20.25C8.05823 20.25 7.86623 20.1767 7.7198 20.0303C7.42673 19.7372 7.42673 19.2626 7.7198 18.9698L14.6895 12L7.7198 5.03026C7.42673 4.7372 7.42673 4.26263 7.7198 3.96976C8.01286 3.67688 8.48742 3.67669 8.7803 3.96976L16.2803 11.4698C16.5734 11.7628 16.5734 12.2374 16.2803 12.5303L8.7803 20.0303C8.63386 20.1767 8.44186 20.25 8.25005 20.25Z" fill="#7D8FAB"></path>
                </svg>
              </li>
              <li className="d-flex align-items-center pb-3">
                <svg className="me-3" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.36792 0 0 5.367 0 12C0 12.5178 0.419678 12.9375 0.9375 12.9375H7.97021L6.867 17.4664C6.05713 20.7913 8.57281 24 12 24C15.4219 24 17.9442 20.7962 17.133 17.4664L16.0298 12.9375H23.0625C23.5803 12.9375 24 12.5178 24 12C24 5.36792 18.633 0 12 0ZM12 22.125C9.79266 22.125 8.16559 20.0583 8.68872 17.9103L9.89996 12.9375H14.1L15.3113 17.9103C15.8337 20.055 14.2108 22.125 12 22.125ZM1.91748 11.0625C2.38458 5.94122 6.68939 1.875 12 1.875C17.3088 1.875 21.6151 5.93939 22.0825 11.0625C21.0262 11.0625 3.03149 11.0625 1.91748 11.0625ZM13.1719 5.0625C13.1719 5.70978 12.6473 6.23438 12 6.23438C11.3527 6.23438 10.8281 5.70978 10.8281 5.0625C10.8281 4.41522 11.3527 3.89062 12 3.89062C12.6473 3.89062 13.1719 4.41522 13.1719 5.0625ZM8.25 8.29688C8.25 8.94415 7.7254 9.46875 7.07812 9.46875C6.43085 9.46875 5.90625 8.94415 5.90625 8.29688C5.90625 7.6496 6.43085 7.125 7.07812 7.125C7.7254 7.125 8.25 7.6496 8.25 8.29688ZM17.625 8.29688C17.625 8.94415 17.1004 9.46875 16.4531 9.46875C15.8058 9.46875 15.2812 8.94415 15.2812 8.29688C15.2812 7.6496 15.8058 7.125 16.4531 7.125C17.1004 7.125 17.625 7.6496 17.625 8.29688Z" fill="var(--primary)"></path>
                </svg>
                <h6 className="sub-title mb-0 flex-1 font-w700">Mushrooms</h6>
                <h6 className="sub-title text-soft mb-0 ms-auto font-w500">17 Items</h6>
                <svg className="ms-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.25005 20.25C8.05823 20.25 7.86623 20.1767 7.7198 20.0303C7.42673 19.7372 7.42673 19.2626 7.7198 18.9698L14.6895 12L7.7198 5.03026C7.42673 4.7372 7.42673 4.26263 7.7198 3.96976C8.01286 3.67688 8.48742 3.67669 8.7803 3.96976L16.2803 11.4698C16.5734 11.7628 16.5734 12.2374 16.2803 12.5303L8.7803 20.0303C8.63386 20.1767 8.44186 20.25 8.25005 20.25Z" fill="#7D8FAB"></path>
                </svg>
              </li>
              <li className="d-flex align-items-center pb-3">
                <svg className="me-3" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 10.0761C24 8.11541 22.7548 6.2785 20.8546 5.80517C20.0473 5.60412 19.2108 5.62976 18.4477 5.87274C17.5468 4.8858 16.2508 4.26562 14.8125 4.26562C13.7955 4.26562 12.8126 4.57965 11.9892 5.15716C11.182 4.59576 10.1995 4.26562 9.14058 4.26562C7.7519 4.26562 6.4275 4.85944 5.50025 5.87585C4.90076 5.68378 4.24982 5.62115 3.58661 5.7182C1.47724 6.02655 -0.031006 7.8977 0.000488173 10.1678C0.0147704 11.1815 0.404786 12.0742 1.04859 12.7637C0.37677 13.5621 -0.0158083 14.6243 0.000488173 15.7928C0.0323485 18.0383 1.96631 19.7344 4.15772 19.7344H19.7915C20.8742 19.7344 21.9093 19.3334 22.706 18.6052C23.5316 17.8504 23.9912 16.8402 23.9998 15.7612L24 15.7011C24 14.7484 23.7017 13.8017 23.1602 13.0356C23.0905 12.9369 23.0169 12.8417 22.9398 12.7504C23.6132 12.0324 23.9919 11.1134 23.9998 10.1362L24 10.0761ZM3.79004 7.10962C5.27943 6.8919 6.67835 7.86602 6.97498 9.32739L8.35304 9.0476C8.14521 8.02349 7.57777 7.15905 6.80488 6.56122C7.443 5.9956 8.27449 5.67187 9.14058 5.67187C11.1049 5.67187 12.7031 7.24896 12.7031 9.1875H14.1093C14.1093 8.04144 13.7118 6.98565 13.0462 6.14831C13.5789 5.8385 14.1866 5.67187 14.8125 5.67187C16.751 5.67187 18.3281 7.24896 18.3281 9.1875H19.7343C19.7343 8.44903 19.5705 7.7481 19.2779 7.11877C19.682 7.05304 20.1079 7.06842 20.5146 7.16986C21.7194 7.46997 22.5937 8.6922 22.5937 10.0761L22.5935 10.1243C22.5884 10.7651 22.3266 11.3707 21.8622 11.8412C21.5465 11.6576 21.208 11.5182 20.8546 11.4304C20.0473 11.2291 19.2108 11.2549 18.4477 11.4977C17.5468 10.5108 16.2508 9.89062 14.8125 9.89062C13.7955 9.89062 12.8126 10.2046 11.9892 10.7822C11.182 10.2208 10.1995 9.89062 9.14058 9.89062C7.7519 9.89062 6.42731 10.4844 5.50025 11.501C4.90076 11.3088 4.24982 11.2461 3.58661 11.3432C3.05634 11.4206 2.56433 11.597 2.12506 11.8535C1.68543 11.4051 1.41608 10.8224 1.40656 10.1481C1.38495 8.5924 2.38745 7.31469 3.79004 7.10962ZM22.5935 15.7493C22.5824 17.1471 21.2992 18.3281 19.7915 18.3281H4.15772C2.7013 18.3281 1.42706 17.2297 1.40656 15.7731C1.38513 14.2176 2.38745 12.9397 3.79004 12.7346C5.27943 12.5171 6.67835 13.491 6.97498 14.9524L8.35304 14.6726C8.14521 13.6487 7.57758 12.7842 6.80488 12.1864C7.443 11.6206 8.2743 11.2969 9.14058 11.2969C11.1049 11.2969 12.7031 12.874 12.7031 14.8125H14.1093C14.1093 13.6664 13.7118 12.6106 13.0462 11.7733C13.5789 11.4635 14.1866 11.2969 14.8125 11.2969C16.751 11.2969 18.3281 12.874 18.3281 14.8125H19.7343C19.7343 14.074 19.5705 13.3731 19.2779 12.7438C19.682 12.678 20.1079 12.6934 20.5146 12.7949C21.7194 13.095 22.5937 14.3172 22.5937 15.7011L22.5935 15.7493Z" fill="var(--primary)"></path>
                  <path d="M17.4574 11.985C18.1043 11.985 18.6288 11.4606 18.6288 10.8137C18.6288 10.1668 18.1043 9.64236 17.4574 9.64236C16.8105 9.64236 16.2861 10.1668 16.2861 10.8137C16.2861 11.4606 16.8105 11.985 17.4574 11.985Z" fill="var(--primary)"></path>
                </svg>
                <h6 className="sub-title mb-0 flex-1 font-w700">Fresh Fishes</h6>
                <h6 className="sub-title text-soft mb-0 ms-auto font-w500">36 Items</h6>
                <svg className="ms-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.25005 20.25C8.05823 20.25 7.86623 20.1767 7.7198 20.0303C7.42673 19.7372 7.42673 19.2626 7.7198 18.9698L14.6895 12L7.7198 5.03026C7.42673 4.7372 7.42673 4.26263 7.7198 3.96976C8.01286 3.67688 8.48742 3.67669 8.7803 3.96976L16.2803 11.4698C16.5734 11.7628 16.5734 12.2374 16.2803 12.5303L8.7803 20.0303C8.63386 20.1767 8.44186 20.25 8.25005 20.25Z" fill="#7D8FAB"></path>
                </svg>
              </li>
            </ul>
          </div>
          <a 
            href="javascript:void(0);" 
            className="btn btn-primary w-100"
            onClick={handleApplyClick}
          >
            APPLY FILTER
          </a>
        </div>
      </div>
    </div>
  )
}

export default OffcanvasSearchFilter