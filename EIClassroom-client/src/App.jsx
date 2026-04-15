import {BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './assets/components/land/home'
import Signin from './assets/components/auth/signin'
import Signup from './assets/components/auth/signup'
import Dashbard from './assets/components/dashboard'
import SubDash from './assets/components/subDash'
import HOD from './assets/components/HOD'
import StudentSidebar from './assets/components/student/StudentSidebar'
import TeacherSidebar from './assets/components/teacher/TeacherSidebar'
import POGenerator from './assets/components/teacher/POGenerator'

function App() {

  return (
      <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/signin" element={<Signin/>}/>
            <Route path="/signup" element={<Signup/>}/>
            <Route path="/dashboard" element={<Dashbard/>}/>
            <Route path="/subject/:subjectId" element={<SubDash />} />
            {/* <Route path="/teachers/subjects/:subjectId" element={<SubDash />} /> */}
            <Route path='/allsubs' element={<HOD />} />
            <Route path="/allsubs/:subjectId" element={<SubDash />} />
            <Route path="/teacers/po-generator" element={<POGenerator />} /> 
            <Route path='/students/*' element={<StudentSidebar />} />
            <Route path='/teachers/*' element={<TeacherSidebar />} />
          </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App
