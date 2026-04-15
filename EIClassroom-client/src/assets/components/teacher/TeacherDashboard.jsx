import React, { useEffect, useState } from 'react'
// import GradientButton from '../ui/gradientbutton';
// import { LayoutDashboard } from 'lucide-react';
import SubCard  from '../ui/subcard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../../../lib/api';

const Loading = () => {
    return (
      <div className="flex justify-center items-center h-screen text-black dark:text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black dark:border-white"></div>
      </div>
    )
  }
  
  const Error = ({ error }) => {
    const navigate = useNavigate();
    return (
      <div className="flex justify-center flex-col items-center h-screen text-black dark:text-white text-2xl ">
        <div>{error}</div>
        <div>
          <button 
          onClick={() => {
            localStorage.clear();
            navigate("/signin")
          }}
          className="bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl my-5"
          >Re-Login</button>
        </div>
      </div>
    )
  }
  
const TeacherDashbard = () => {
    const [create, setCreate] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSubjects = async () => {
          try {
            const response = await axios.get(`${API_BASE}/api/subjects/subjects`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            });
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
    
      if (loading) {
        return <Loading/>;
      }
    
      if (error) {
        return <Error error={error}/>;
      }


  return (
        <div className=" w-full md:mr-16 pb-16 ">
            <div className='flex justify-between mb-4'>
            <p className="text-4xl font-semibold md:m-10 m-5 ">Courses</p>
            {create && <CreateSubject create={create} setCreate={setCreate} />}
                <button
                onClick={() => setCreate(!create)}
                className="md:m-10 mt-5 mr-5 px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-colors duration-800"
                >
                Create New Course
                </button>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:mx-10 mx-5">
                {subjects.map((sub) => (
                    <SubCard key={sub.id} id={sub.id} code={sub.code} name={sub.name} session={sub.session} semester={sub.semester}/>
                ))}
            </div>
        </div>
  )
}

const CreateSubject = ({create, setCreate}) => {
    const [formData, setFormData] = useState({
      name: '',
      code: '',
      session: '',
      semester: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
  
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if (e.target.name === 'code' && e.target.value.includes('/')) {
        setError('Subject code cannot contain "/"');
      } else {
        setError('');
      }
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
  
      const payload = {
        name: formData.name,
        code: formData.code,
        session: formData.session,
        semester: parseInt(formData.semester, 10),
      };

      try {
        const response = await axios.post(`${API_BASE}/api/subjects/newsubject`, payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming you store the token in localStorage
          }
        });
  
        console.log('Subject created:', response.data);
        setSuccess("Subject added Successfully")
        setTimeout(() => {
          
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('Error:', error);
        setError(error.response?.data?.error || 'Failed to create subject. Please try again.');
      }
    };
  
    return (
      <div className="fixed h-full w-full flex items-center justify-center rounded-tl-2xl z-50 poppins-regular backdrop-brightness-50 dark:backdrop-brightness-50 backdrop-blur-sm">
        <form className="max-w-md mx-auto bg-white dark:bg-neutral-950 rounded-xl p-2 w-1/3 h-auto border-2 border-neutral-300 dark:border-neutral-700 " onSubmit={handleSubmit}>
          <div className="p-4">
            <div 
              className="flex justify-end text-white cursor-pointer"
              onClick={() => setCreate(false)}
            >❌</div>
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="name"
                id="subject_name"
                className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text:white dark:border-gray-600 dark:focus:border-purple-500 focus:outline-none focus:ring-0 focus:border-purple-600 peer"
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="subject_name"
                className="peer-focus:font-medium absolute text-lg text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-purple-600 peer-focus:dark:text-purple-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Subject Name
              </label>
            </div>
  
            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="code"
                id="subject_code"
                className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text:white dark:border-gray-600 dark:focus:border-purple-500 focus:outline-none focus:ring-0 focus:border-purple-600 peer"
                placeholder=" "
                value={formData.code}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="subject_code"
                className="peer-focus:font-medium absolute text-lg text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-purple-600 peer-focus:dark:text-purple-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Subject Code
              </label>
            </div>

            <div className="relative z-0 w-full mb-5 group">
              <input
                type="text"
                name="session"
                id="subject_session"
                className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text:white dark:border-gray-600 dark:focus:border-purple-500 focus:outline-none focus:ring-0 focus:border-purple-600 peer"
                placeholder=" "
                value={formData.session}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="subject_session"
                className="peer-focus:font-medium absolute text-lg text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-purple-600 peer-focus:dark:text-purple-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Session (e.g. 2025-26)
              </label>
            </div>

            <div className="relative z-0 w-full mb-5 group">
              <input
                type="number"
                name="semester"
                id="subject_semester"
                min="1"
                max="8"
                className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text:white dark:border-gray-600 dark:focus:border-purple-500 focus:outline-none focus:ring-0 focus:border-purple-600 peer"
                placeholder=" "
                value={formData.semester}
                onChange={handleChange}
                required
              />
              <label
                htmlFor="subject_semester"
                className="peer-focus:font-medium absolute text-lg text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-purple-600 peer-focus:dark:text-purple-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Semester (1-8)
              </label>
            </div>
            {error && <div className="text-red-500 mb-3">{error}</div>}
            {success && <div className="text-green-500 mb-3">{success}</div>}
            <button
              type="submit"
              className="text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-lg w-full sm:w-auto px-5 py-2.5 mt-5 text-center dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800"
              disabled={formData.code.includes('/')}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    );
  };

export default TeacherDashbard