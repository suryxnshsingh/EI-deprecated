import SubCard  from './ui/subcard';
import { useState, useEffect } from "react"
import axios from 'axios';
import Label from "./ui/label";
import Input from "./ui/input";
import Navbar from "./auth/navbar";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";
import { API_BASE } from "../../../lib/api";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
    </div>
  )
}

const HOD = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creds,setCreds] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/subjects/allsubjects`);
        setSubjects(response.data);
      } catch (err) {
        setError("Failed to fetch subjects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const isHOD = localStorage.getItem("HOD");
    if (isHOD) {
      setCreds(false);
    }
  }, []);

  if (loading) {
    return <Loading/>;
  }

  if (error) {
    return <Error error={error}/>;
  }

  return (
    <>

    {creds && <Credentials creds={creds} setCreds={setCreds} />}

    {
        !creds &&


    <div className="bg-white dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] min-h-screen h-full pb-20 poppins">
      <Navbar/>
      <div className=" text-5xl flex justify-center items-center poppins-semibold pt-28 pb-3 dark:text-white">
        HOD Dashboard
      </div>
      <div className="grid justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {subjects.map((subject) => (
            <SubCard
              key={subject.id}
              id={subject.id}
              name={subject.name}
              code={subject.code}
              session={subject.session}
              semester={subject.semester}
            />
          ))}
        </div>
      </div>
    </div>

}
    </>
  );
};

const Credentials = ({creds,setCreds}) => {
    const [theme, setTheme] = useState(
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    );
    const [formData, setFormData] = useState({
      email: "",
      password: "",
    });
    const [error, setError] = useState(null); // Error state
    const [success, setSuccess] = useState(null); // Success state
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

    }, []);
  
  
    const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
  
      if(formData.email=='rajeshkhatri1@rediffmail.com' && formData.password=='EIServerHOD@27'){
          console.log(formData)
          setSuccess("Sign-in successful!");
          localStorage.setItem("HOD",true);
          setCreds(false)
      }else{
          setError("Invalid email or password.");
      }
      
    };
  
    return (
      <div className="bg-white dark:bg-black dark:bg-dot-white/[0.2] bg-dot-black/[0.2] h-screen flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 border-0 md:border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black">
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
            Enter HOD Credentials
          </h2>
  
          <form className="my-8" onSubmit={handleSubmit}>
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
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </LabelInputContainer>
  
            {error && <p className="text-red-500 text-center pb-2">{error}</p>}
            {success && <p className="text-green-500 text-center pb-2">{success}</p>}
  
            <button
              className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
              type="submit"
            >
              Go ahead &rarr;
              <BottomGradient />
            </button>
  
            <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />
  
          </form>

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
  
  const LabelInputContainer = ({ children, className }) => {
    return <div className={cn("flex flex-col space-y-2 w-full", className)}>{children}</div>;
  };

export default HOD