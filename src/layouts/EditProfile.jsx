import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../components/Toast/useToast";
import {ENV} from "../config";
const API_BASE_URL = ENV.V2_COMMON_BASE;

function EditProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const handleNameChange = (e) => {
    // Allow only letters and spaces
    const next = e.target.value.replace(/[^A-Za-z\s]/g, "");
    setFormData(prev => ({ ...prev, name: next }));
  };

  useEffect(() => {
    // Load user data from localStorage on component mount
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setFormData({
          name: userData.name || '',
          phoneNumber: userData.mobile || ''
        });
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phoneNumber: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required', 'Validation');
      setIsLoading(false);
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number', 'Validation');
      setIsLoading(false);
      return;
    }

    try {
      const authData = localStorage.getItem('auth');
      if (!authData) {
        toast.error('Authentication data not found', 'Error');
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(authData);
      
      const response = await fetch(`${API_BASE_URL}/user/account_profile_update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${userData.accessToken}`
        },
        body: JSON.stringify({
          mobile: formData.phoneNumber,
          name: formData.name,
          user_id: userData.userId,
          app_source: "user_app",
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage with new values
        const updatedAuthData = {
          ...userData,
          name: data.customer_details.name,
          mobile: data.customer_details.mobile
        };
        localStorage.setItem('auth', JSON.stringify(updatedAuthData));

        toast.success('Profile updated successfully', 'Success');
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 800);
      } else {
        throw new Error(data.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.', 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Header />
      <div className="page-content">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="edit-profile">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-[var(--title)]">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleNameChange}
                  onBlur={(e) => setFormData(prev => ({ ...prev, name: (e.target.value || '').trim() }))}
                  inputMode="text"
                  pattern="[A-Za-z\s]+"
                  title="Only letters and spaces are allowed"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="block mb-2 text-sm font-medium text-[var(--title)]">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-[#495057] bg-[#e9ecef] border border-r-0 border-[var(--border-color)] rounded-l-lg">+91</span>
                  <input
                    type="tel"
                    className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-r-lg outline-none focus:border-[var(--primary)] transition-colors"
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    required
                  />
                </div>
                <small className="text-[#6c757d] text-xs">Enter 10 digit mobile number</small>
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 px-4 bg-[var(--primary)] text-white rounded-3xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" role="status" aria-hidden="true"></span>
                    Updating...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </form>
          </div>
          {/* <ul className="link-list">
            <li>
              <a href="javascript:void(0);">Add Link</a>
            </li>
            <li>
              <a href="javascript:void(0);">Switch to professional account</a>
            </li>
            <li>
              <a href="javascript:void(0);">Create avatar</a>
            </li>
            <li>
              <a href="javascript:void(0);">Personal information settings</a>
            </li>
          </ul> */}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default EditProfile;
