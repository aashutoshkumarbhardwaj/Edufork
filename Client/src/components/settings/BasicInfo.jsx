import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { Camera, User, Trash2 } from "lucide-react";
import UpdateButton from "./UpdateButton";
const backendUrl = import.meta.env.VITE_API_URL;

export default function BasicInfo() {
  const { user, setUser, fetchUserDetails } = useUserProfile();
  const [profileData, setProfileData] = useState({
    FirstName: "",
    LastName: "",
    ProfilePicture: null,
    Bio: "",
    Country: "",
    Gender: "",
  });
  const [profilePic, setProfilePic] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isProfilePicLoading, setIsProfilePicLoading] = useState(false);
  const [isProfileUpdateLoading, setIsProfileUpdateLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [initialProfileData, setInitialProfileData] = useState(null);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.id);

        if (!user) {
          fetchUserDetails(decoded.id);
        } else {
          const userData = {
            FirstName: user.FirstName || "",
            LastName: user.LastName || "",
            ProfilePicture: user.ProfilePicture || null,
            Bio: user.Bio || "",
            Country: user.Country || "",
            Gender: user.Gender || "",
          };
          setProfileData(userData);
          setInitialProfileData(userData);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [user, fetchUserDetails]);

  useEffect(() => {
    if (!initialProfileData) return;

    const isChanged =
      Object.keys(profileData).some(
        (key) => profileData[key] !== initialProfileData[key]
      ) || profilePic !== null;

    setHasChanged(isChanged);
  }, [profileData, profilePic, initialProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClearField = (fieldName) => {
    setProfileData((prev) => ({
      ...prev,
      [fieldName]: "",
    }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData((prev) => ({
        ...prev,
        ProfilePicture: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async () => {
    if (!profilePic) {
      toast.error("No image selected");
      return null;
    }

    setIsProfilePicLoading(true);
    const formData = new FormData();
    formData.append("profilePicture", profilePic);

    try {
      const response = await axios.post(
        `${backendUrl}/user/upload-profile-picture`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return response.data.profilePictureUrl;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      toast.error(
        error.response?.data?.error || "Failed to upload profile picture"
      );
      return null;
    } finally {
      setIsProfilePicLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    setIsProfileUpdateLoading(true);
    try {
      let profilePictureUrl = profileData.ProfilePicture;
      if (profilePic) {
        const uploadedUrl = await uploadProfilePicture();
        if (uploadedUrl) {
          profilePictureUrl = uploadedUrl;
        } else {
          return;
        }
      }

      // Send all fields including empty ones to allow clearing
      const updateData = {
        ...profileData,
        ProfilePicture: profilePictureUrl,
      };

      const response = await axios.put(
        `${backendUrl}/user/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Profile updated successfully");
      setProfileData(response.data);
      setUser(response.data);
      setInitialProfileData(response.data);
      setProfilePic(null);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsProfileUpdateLoading(false);
      setHasChanged(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto ">
      <h1 className="text-2xl pb-4 font-semibold text-[var(--txt)] mb-2">
        Basic Information
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Picture Section */}
        <div className="rounded-2xl px-6">
          <div className="flex items-center px-4 gap-14">
            <input
              id="profile-pic"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleProfilePicChange}
              className="hidden"
              disabled={isProfilePicLoading || isProfileUpdateLoading}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <div className="w-h-32 h-32 rounded-full overflow-hidden border-2 border-[var(--bg-primary)] shadow-lg">
                {profileData.ProfilePicture ? (
                  <img
                    src={profileData.ProfilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full h-full flex items-center justify-center bg-[var(--bg-sec)]">
                    <User className="w-14 h-14 text-[var(--txt-dim)]" />
                  </div>
                )}
              </div>

              <div className="absolute rounded-full inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>

              {isProfilePicLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-sec hover:bg-[var(--btn-hover)] px-4 py-2 rounded-lg shadow-sm transition-colors"
              disabled={isProfilePicLoading || isProfileUpdateLoading}
            >
              Change image
            </button>
          </div>
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-2">
          <div className="space-y-2">
            <label className="block text-md font-medium text-[var(--txt-dim)]">
              First Name *
            </label>
            <input
              type="text"
              name="FirstName"
              value={profileData.FirstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
              className="w-full px-4 py-3 bg-[var(--bg-sec)] border border-transparent rounded-lg text-[var(--txt)] placeholder-[var(--txt-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--btn)] focus:border-transparent transition-all"
              required
              disabled={isProfileUpdateLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-md font-medium text-[var(--txt-dim)]">
              Last Name *
            </label>
            <input
              type="text"
              name="LastName"
              value={profileData.LastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              className="w-full px-4 py-3 bg-[var(--bg-sec)] border border-transparent rounded-lg text-[var(--txt)] placeholder-[var(--txt-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--btn)] focus:border-transparent transition-all"
              required
              disabled={isProfileUpdateLoading}
            />
          </div>
        </div>

        {/* Bio Section */}
        <div className="space-y-2 p-6 py-2">
          <label className="block text-md font-medium text-[var(--txt-dim)]">
            Bio
          </label>
          <div className="relative">
            <textarea
              name="Bio"
              value={profileData.Bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself, your interests, and what makes you unique..."
              className="w-full px-4 py-3 bg-[var(--bg-sec)] border border-transparent rounded-lg text-[var(--txt)] placeholder-[var(--txt-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--btn)] focus:border-transparent transition-all resize-none pr-10"
              rows="4"
              maxLength="500"
              disabled={isProfileUpdateLoading}
            />
            {profileData.Bio && (
              <button
                type="button"
                onClick={() => handleClearField("Bio")}
                className="absolute right-3 top-3 text-[var(--txt-dim)] hover:text-red-500 transition-colors"
                disabled={isProfileUpdateLoading}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="ml-auto w-fit text-xs text-[var(--txt-dim)]">
              <span>{profileData.Bio.length}/500</span>
            </div>
          </div>
        </div>

        {/* Location & Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 py-2">
          <div className="space-y-2">
            <label className="block text-md font-medium text-[var(--txt-dim)]">
              Country
            </label>
            <div className="relative">
              <input
                type="text"
                name="Country"
                value={profileData.Country}
                onChange={handleInputChange}
                placeholder="Select your country"
                className="w-full px-4 py-3 bg-[var(--bg-sec)] border border-transparent rounded-lg text-[var(--txt)] placeholder-[var(--txt-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--btn)] focus:border-transparent transition-all pr-10"
                disabled={isProfileUpdateLoading}
              />
              {profileData.Country && (
                <button
                  type="button"
                  onClick={() => handleClearField("Country")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--txt-dim)] hover:text-red-500 transition-colors"
                  disabled={isProfileUpdateLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-md font-medium text-[var(--txt-dim)]">
              Gender
            </label>
            <div className="relative">
              <select
                name="Gender"
                value={profileData.Gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-[var(--bg-sec)] border border-transparent rounded-lg text-[var(--txt)] focus:outline-none focus:ring-2 focus:ring-[var(--btn)] focus:border-transparent transition-all pr-10"
                disabled={isProfileUpdateLoading}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {profileData.Gender && (
                <button
                  type="button"
                  onClick={() => handleClearField("Gender")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--txt-dim)] hover:text-red-500 transition-colors"
                  disabled={isProfileUpdateLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <UpdateButton
            label="Update Profile"
            isLoading={isProfileUpdateLoading}
            isDisabled={!hasChanged}
          />
        </div>
      </form>
    </div>
  );
}
