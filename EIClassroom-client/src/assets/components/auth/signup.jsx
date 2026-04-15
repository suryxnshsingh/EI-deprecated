import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios for HTTP requests
import Label from "../ui/label";
import Input from "../ui/input";
import { cn } from "../../../../lib/utils";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import Lucide React icons
import { API_BASE } from "../../../../lib/api";

const Signup = () => {
  const [theme, setTheme] = useState(
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [buttonLoading, setButtonLoading] = useState(false); // Button loading state
  const navigate = useNavigate();

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    setTimeout(() => {
      setLoading(false);
    }, 200);
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setButtonLoading(true); // Set button loading state to true

    try {
      // Send the signup request to the backend
      const response = await axios.post(`${API_BASE}/api/auth/signup`, formData);

      
      setSuccess("Signup successful!");
      localStorage.setItem('firstName', response.data.firstName);
      localStorage.setItem('lastName', response.data.lastName);
      navigate("/signin");

    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError("User with this email already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setButtonLoading(false); // Set button loading state to false
    }
  };

  // If loading, display skeleton
  if (loading) {
    return <SkeletonSignup />;
  }

  return (
    <div className="bg-white dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] h-screen flex items-center justify-center">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 max-md:border-0 border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black">
        {/* Theme Toggle Button */}
        <div className="flex items-center justify-center mb-6">
          <label className="relative inline-flex items-center cursor-pointer mr-2">
            <input
              type="checkbox"
              className="sr-only"
              checked={theme === "dark"}
              onChange={handleThemeToggle}
            />
            <div className="w-12 h-6 bg-gray-200 dark:bg-gray-800 rounded-full shadow-inner"></div>
            <div
              className={`absolute w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${
                theme === "dark" ? "translate-x-6" : "translate-x-0"
              }`}
            ></div>
          </label>
          <span className="text-xl">{theme === "dark" ? "🌙" : "☀️"}</span>
        </div>

        <h2 className="font-bold text-center text-xl text-neutral-800 dark:text-neutral-200">
          EI Classroom
        </h2>
        <form className="my-8" onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <LabelInputContainer>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Tyler"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Durden"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </LabelInputContainer>
          </div>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="projectmayhem@fc.com"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </LabelInputContainer>

          {error && <p className="text-red-500 text-center pb-2">{error}</p>}
          {success && <p className="text-green-500 text-center pb-2">{success}</p>}

          <button
            className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            type="submit"
            disabled={buttonLoading} // Disable button when loading
          >
            {buttonLoading ? (
              <Loader /> // Loader component
            ) : (
              "Sign up →"
            )}
            <BottomGradient />
          </button>

          <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
          <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300 text-center">
            Already have an account? <a href="/signin" className="text-blue-500 underline">Sign In</a>
          </p>
        </form>
      </div>
    </div>
  );
};

// Skeleton Loader for the Signup component
const SkeletonSignup = () => {
  return (
    <div className="bg-white dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] h-screen flex items-center justify-center">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black h-auto">
        <div className="animate-pulse">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
            <div className="w-6 h-6 ml-1 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-700 mb-6 w-32 mx-auto rounded-md"></div>
          <div className="flex justify-center">
            <div>
              <div className="flex items-center justify-start mb-4">
                <div className="w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
              </div>
              <div className="w-48 h-[42px] bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            </div>
            <div>
              <div className="flex items-center justify-start mb-4">
                <div className="ml-3 w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
              </div>
              <div className="ml-3 w-44 h-[42px] bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            </div>
          </div>
          <div className="flex items-center justify-start mb-4">
            <div className=" w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
          </div>
          <div className="w-full h-[42px] bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="flex items-center justify-start mb-4">
            <div className="w-24 h-6 bg-gray-300 dark:bg-gray-700 rounded-full shadow-inner"></div>
          </div>
          <div className="w-full h-[42px] bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          <div className="w-full h-[32px] bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
          <div className="bg-gray-300 dark:bg-gray-700 h-[1px] w-full mb-8"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 w-48 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

// Loader component
const Loader = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
    </div>
  );
};

const LabelInputContainer = ({ children, className }) => {
  return <div className={cn("flex flex-col space-y-2 w-full", className)}>{children}</div>;
};

export default Signup;
