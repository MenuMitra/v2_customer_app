import { useState, useEffect } from 'react';
import { useCacheData } from '../contexts/CacheDataContext';

/**
 * A component that displays cache status and debugging information
 */
const CacheStatus = () => {
  const { dataSource } = useCacheData();
  const [timestamp, setTimestamp] = useState(new Date());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Update timestamp whenever data source changes
    if (dataSource === 'fresh' || dataSource === 'cache') {
      setTimestamp(new Date());
    }
  }, [dataSource]);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (!dataSource || dataSource === 'unknown') {
    return null;
  }

  const gradientClass = dataSource === 'cache' 
    ? 'bg-gradient-to-br from-[#26A69A] to-[#00796B]' 
    : 'bg-gradient-to-br from-[#5C6BC0] to-[#3949AB]';

  return (
    <div className="fixed bottom-0 right-0 m-3 z-[1050]">
      <div 
        className={`bg-white border-0 shadow-sm rounded-xl overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-w-[300px]' : 'max-w-[180px]'
        }`}
      >
        <div 
          className={`py-2 px-3 flex justify-between items-center cursor-pointer text-white text-[0.8rem] ${gradientClass}`}
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            <i className={`fas ${dataSource === 'cache' ? 'fa-database' : 'fa-cloud-download-alt'} mr-2`}></i>
            <span>{dataSource === 'cache' ? 'Cached Data' : 'Fresh Data'}</span>
          </div>
          <i className={`fas ${expanded ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
        </div>
        
        {expanded && (
          <div className="p-2 text-[0.8rem]">
            <div className="mb-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span>{formatTime(timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cache Duration:</span>
                <span>5 minutes</span>
              </div>
            </div>
            
            <div className="grid">
              <button 
                className="w-full py-1.5 px-3 text-sm border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.reload();
                }}
              >
                <i className="fas fa-sync-alt mr-1"></i> Manual Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheStatus; 