import { useCacheData } from '../contexts/CacheDataContext';
import { useOutlet } from '../contexts/OutletContext';

/**
 * A test component that provides controls to test cache functionality
 */
const TestCacheButton = () => {
  const { fetchData, clearCache, dataSource } = useCacheData();
  const { outletId } = useOutlet();

  const handleForceFetch = async () => {
    try {
      // Get auth data
      const authData = localStorage.getItem('auth');
      const userData = authData ? JSON.parse(authData) : null;
      
      if (!userData?.accessToken || !outletId) {
        alert('Authentication or outlet ID required');
        return;
      }

      console.log('Forcing a fresh fetch from API...');
      
      // Force refresh with forceRefresh: true
      const response = await fetchData('get_category_list', {
        outlet_id: outletId,
        app_source: "user_app"
      }, { forceRefresh: true });
      
      console.log('Fresh data fetched:', response);
      
      // Reload the page to see the updated data
      window.location.reload();
    } catch (error) {
      console.error('Error fetching fresh data:', error);
      alert('Error fetching fresh data');
    }
  };

  const handleClearCache = () => {
    clearCache();
    alert('Cache cleared. The next request will fetch fresh data.');
  };

  // Get gradient class based on data source
  const getGradientClass = () => {
    if (dataSource === 'cache') {
      return 'bg-gradient-to-br from-[#26A69A] to-[#00796B]';
    } else if (dataSource === 'fresh') {
      return 'bg-gradient-to-br from-[#5C6BC0] to-[#3949AB]';
    } else {
      return 'bg-gradient-to-br from-[#9E9E9E] to-[#616161]';
    }
  };

  const getIconClass = () => {
    if (dataSource === 'cache') {
      return 'fa-database';
    } else if (dataSource === 'fresh') {
      return 'fa-cloud-download-alt';
    } else {
      return 'fa-question-circle';
    }
  };

  return (
    <div className="flex flex-col items-center my-3">
      {/* Data source indicator */}
      <div className="mb-2">
        <span className={`inline-flex items-center rounded-full px-3 py-2 mr-2 text-white ${getGradientClass()}`}>
          <i className={`fas mr-1 ${getIconClass()}`}></i>
          Data Source: {dataSource === 'cache' ? 'Cache' : dataSource === 'fresh' ? 'Fresh API' : 'Unknown'}
        </span>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={handleForceFetch}
          className="bg-gradient-to-br from-[#FF7043] to-[#F4511E] text-white border-0 rounded-full px-4 py-2 text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Force Refresh Data
        </button>
        <button 
          onClick={handleClearCache}
          className="border border-gray-400 text-gray-700 bg-white rounded-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
        >
          <i className="fas fa-trash-alt mr-2"></i>
          Clear Cache
        </button>
      </div>
    </div>
  );
};

export default TestCacheButton; 