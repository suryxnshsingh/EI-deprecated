import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaTrash, FaEdit, FaFileUpload, FaFileDownload } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { IoMdPersonAdd } from "react-icons/io";
import { useDropzone } from 'react-dropzone';
import POGenerator from './teacher/POGenerator';
import { API_BASE } from '../../../lib/api';

const SubDash = () => {
  const { subjectId } = useParams();
  const sid = parseInt(subjectId, 10);
  const [create, setCreate] = useState(false);
  const [schema, setSchema] = useState(false);
  const [edit, setEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coData, setCoData] = useState(null);
  const [upload, setUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [activeTab, setActiveTab] = useState('co');
  const [subjectMeta, setSubjectMeta] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/operation/sheets?subjectId=${sid}`);
      setSheets(response.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sheets:', err);
      setError(err.response?.data?.error || 'Failed to fetch sheets');
    }
  };

  const fetchCOData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/operation/co-form/${sid}`);
      console.log('CO Data:', response.data);
      setCoData(response.data);
    } catch (err) {
      console.error('Error fetching CO data:', err);
    }
  };

  const fetchSubjectMeta = async () => {
    try {
      const isHODLocal = localStorage.getItem("HOD");
      const url = isHODLocal
        ? `${API_BASE}/api/subjects/allsubjects`
        : `${API_BASE}/api/subjects/subjects`;
      const headers = isHODLocal
        ? {}
        : { Authorization: `Bearer ${localStorage.getItem("token")}` };
      const response = await axios.get(url, { headers });
      const found = (response.data || []).find((s) => s.id === sid);
      if (found) setSubjectMeta(found);
    } catch (err) {
      console.error('Error fetching subject metadata:', err);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(sid)) {
      fetchData();
      fetchCOData();
      fetchSubjectMeta();
    }
  }, [sid]);

  const isHOD = localStorage.getItem("HOD");

  return (
    <div className="w-[calc(100vw-120px)] max-w-[calc(100vw-120px)] min-w-0 min-h-screen h-full pb-12 poppins overflow-x-hidden">
      {create && <AddStudentPopup setCreate={setCreate} subjectId={sid} fetchData={fetchData} />}
      {schema && <AddExamSchema setSchema={setSchema} subjectId={sid} fetchData={fetchData} fetchCOData={fetchCOData} />}
      {edit && <EditStudentPopup setEdit={setEdit} subjectId={sid} editData={editData} fetchData={fetchData} />}
      {upload && <UploadExcelPopup setUpload={setUpload} subjectId={sid} setUploadSuccess={setUploadSuccess} setUploadError={setUploadError} fetchData={fetchData} />}
      <div>
      {isHOD && (
        <button
          className="bg-gray-200 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded"
          onClick={() => navigate(-1)}
        >
          Back
        </button>)}
        {subjectMeta && (
          <div className='pt-6 flex flex-col items-center gap-3'>
            <h1 className='text-3xl font-bold dark:text-white text-center'>
              <span className='capitalize'>{subjectMeta.name}</span>
              <span className='text-slate-400 dark:text-slate-500 font-normal mx-2'>:</span>
              <span>{subjectMeta.code}</span>
            </h1>
            {(subjectMeta.session || subjectMeta.semester) && (
              <div className='flex flex-wrap justify-center gap-2'>
                {subjectMeta.session && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800'>
                    {subjectMeta.session}
                  </span>
                )}
                {subjectMeta.semester && (
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'>
                    Semester {subjectMeta.semester}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* CO / PO Tabs */}
        <div className="mt-4 mx-6 border-b border-neutral-300 dark:border-neutral-700 flex gap-2">
          {[
            { key: 'co', label: 'CO' },
            { key: 'po-direct', label: 'PO Direct' },
            { key: 'po-indirect', label: 'PO Indirect' },
            { key: 'po-overall', label: 'PO Overall' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'po-direct' || activeTab === 'po-indirect' || activeTab === 'po-overall') && (
          <POGenerator
            subjectId={sid}
            poTab={activeTab === 'po-direct' ? 'direct' : activeTab === 'po-indirect' ? 'indirect' : 'overall'}
          />
        )}

        <div className={activeTab === 'co' ? '' : 'hidden'}>

        {!coData && (
          <div className="text-center mx-10 w-[90%] mt-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 border border-red-800 dark:text-red-200 dark:border-red-200 rounded-lg">
            Please define exam schema first
          </div>
        )}

        {/* Add Data Section */}

          <div className='mb-4 mt-4 px-4 mx-2'>
            <h2 className='text-lg font-semibold dark:text-white mb-2 flex items-center'>
            <IoMdPersonAdd className='mr-2 text-violet-600'/>
              <span className='bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text'>Add Data</span>
            </h2>
            <div className='flex justify-start gap-4'>
              <button 
                className='w-48 px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
                onClick={() => setSchema(true)}
              >
                Define Exam Schema
              </button>
              <button
                className='w-48 px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
                onClick={() => setCreate(true)}
              >
                Add Student
              </button>
              <button
                className='w-48 px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
                onClick={() => setUpload(true)}
              >
                <FaFileUpload className="inline-block mr-2" />
                Upload Excel
              </button>
            </div>
          </div>

        {/* Excel Sheets Section */}
        <div className='px-4 pt-4 mx-2 w-11/12'>
          <h2 className='text-lg font-semibold dark:text-white mb-2 flex items-center'>
          <IoStatsChart className='mr-2 text-violet-600'/>
            <span className='bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text'>Excel Sheets</span>
          </h2>
          <div className='grid lg:grid-cols-8 md:grid-cols-4 grid-cols-2 gap-4'>
            <button className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => overallSheet(sid)}>
              Export All
            </button>
            <button className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadMST1(sid)}>
              MST1
            </button>
            <button className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadMST2(sid)}>
              MST2
            </button>
            <button className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadAssignment(sid)}>
              Assignment
            </button>
            <button className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadEndSem(sid)}>
              EndSem
            </button>
            <button
              className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadCOMatrix(sid)}
            >
              Direct CO
            </button>
            <button
              className='px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20'
              onClick={() => downloadOverallCO(sid)}
            >
              Overall CO
            </button>
          </div>
        </div>
        <List subjectId={sid} setEdit={setEdit} setEditData={setEditData} sheets={sheets} loading={loading} error={error} coData={coData} />
        </div>
      </div>
    </div>
  )
}

const UploadExcelPopup = ({ setUpload, subjectId, setUploadSuccess, setUploadError, fetchData }) => {
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const response = await axios.post(`${API_BASE}/api/operation/upload-excel/${subjectId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
      setUploadSuccess(`File uploaded successfully! Created: ${response.data.results.created}, Updated: ${response.data.results.updated}`);
      setUploadError(null);
      fetchData();
    } catch (err) {
      console.error('Error uploading file:', err);
      setUploadError('Failed to upload file. Please try again.');
      setUploadSuccess(null);
    } finally {
      setUploading(false);
    }
  }, [subjectId, fetchData, setUploadSuccess, setUploadError]);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const response = await axios.get(`${API_BASE}/api/operation/excel-template/${subjectId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_data_template_${subjectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading template:', err);
      setUploadError('Failed to download template. Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    } 
  });

  return (
    <div className="fixed h-full w-full flex items-center justify-center rounded-tl-2xl z-50 poppins-regular backdrop-brightness-50 dark:backdrop-brightness-50 backdrop-blur-sm">
      <div className="max-w-md w-1/3 mx-auto bg-white dark:bg-black rounded-xl p-2 border-2 border-neutral-300 dark:border-neutral-700">
        <div className="p-4">
          <div className="flex justify-end text-white cursor-pointer" onClick={() => setUpload(false)}>
            ❌
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Upload Student Data</h3>
          
          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="w-full px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-300 shadow-md"
            >
              <FaFileDownload className="inline-block mr-2" />
              {downloadingTemplate ? 'Downloading...' : 'Download Excel Template'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Use this template to ensure proper data formatting
            </p>
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed ${isDragActive ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-300 dark:border-gray-600'} p-6 rounded-lg text-center cursor-pointer transition-all duration-200 hover:border-violet-400`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>
              </div>
            ) : isDragActive ? (
              <p className="text-violet-600 dark:text-violet-400">Drop the file here...</p>
            ) : (
              <div>
                <FaFileUpload className="text-3xl mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Drag and drop an Excel file here, or click to select</p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Accepts .xlsx and .xls files</p>
              </div>
            )}
          </div>
          
          {setUploadSuccess && <div className="text-green-500 mt-3 text-center">{setUploadSuccess}</div>}
          {setUploadError && <div className="text-red-500 mt-3 text-center">{setUploadError}</div>}
        </div>
      </div>
    </div>
  );
};

// Separate List component with its own state management
const List = ({ subjectId, setEdit, setEditData, sheets, loading, error, coData }) => {
  // Declare all state variables at the beginning of the component
  console.log(sheets);

  if (loading) {
    return (
      <div className="m-4 p-3 bg-[#F5F5F5] dark:bg-neutral-800 rounded-lg mt-8 flex justify-center items-center">
        <div className="dark:text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 p-3 bg-[#F5F5F5] dark:bg-neutral-800 rounded-lg mt-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="m-4 md:mr-20 p-3 bg-[#F5F5F5] dark:bg-neutral-900 rounded-lg mt-8 border-[1px] dark:border-neutral-700">
      <div className="relative overflow-x-auto mx-2">
      <table className="w-full text-sm text-left rtl:text-right text-neutral-900 ">
        <thead className="text-gray-700 dark:text-white uppercase bg-grey-500 ">
          <tr className="rounded-lg">
            <th scope="col" className="px-6 py-3 text-lg">Enrollment No.</th>
            <th scope="col" className="px-6 py-3 text-lg">Name</th>

            {/* Main columns for MST1 and MST2 with sub-columns */}
            <th scope="col" colSpan="3" className="px-6 py-3 text-lg">MST1</th>
            <th scope="col" colSpan="3" className="px-6 py-3 text-lg">MST2</th>

            {/* Main column for Assignment with sub-columns */}
            <th scope="col" colSpan="5" className="px-6 py-3 text-lg">Assignment</th>
            
            {/* Main column for Endsem with sub-columns */}
            <th scope="col" colSpan="5" className="px-6 py-3 text-lg">Endsem</th>

            {/* Main column for Indirect COs with sub-columns */}
            <th scope="col" colSpan="5" className="px-6 py-3 text-lg">Indirect COs</th>

            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
          <tr className="rounded-lg">
            {/* Empty cells for Enrollment and Name */}
            <th scope="col" className="px-6 py-3"></th>
            <th scope="col" className="px-6 py-3"></th>
            
            {/* Sub-columns for MST1 */}
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST1_Q1 ? `Q1-${coData.MST1_Q1}` : "Q1"}
            </th>
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST1_Q2 ? `Q2-${coData.MST1_Q2}` : "Q2"}
            </th>
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST1_Q3 ? `Q3-${coData.MST1_Q3}` : "Q3"}
            </th>

            {/* Sub-columns for MST2 */}
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST2_Q1 ? `Q1-${coData.MST2_Q1}` : "Q1"}
            </th>
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST2_Q2 ? `Q2-${coData.MST2_Q2}` : "Q2"}
            </th>
            <th scope="col" className="px-6 py-3">
              {coData && coData.MST2_Q3 ? `Q3-${coData.MST2_Q3}` : "Q3"}
            </th>

            {/* Sub-columns for Assignment */}
            <th scope="col" className="px-6 py-3">CO1</th>
            <th scope="col" className="px-6 py-3">CO2</th>
            <th scope="col" className="px-6 py-3">CO3</th>
            <th scope="col" className="px-6 py-3">CO4</th>
            <th scope="col" className="px-6 py-3">CO5</th>

            {/* Sub-columns for Endsem */}
            <th scope="col" className="px-6 py-3">Q1</th>
            <th scope="col" className="px-6 py-3">Q2</th>
            <th scope="col" className="px-6 py-3">Q3</th>
            <th scope="col" className="px-6 py-3">Q4</th>
            <th scope="col" className="px-6 py-3">Q5</th>

            {/* Sub-columns for Indirect COs */}
            <th scope="col" className="px-6 py-3">CO1</th>
            <th scope="col" className="px-6 py-3">CO2</th>
            <th scope="col" className="px-6 py-3">CO3</th>
            <th scope="col" className="px-6 py-3">CO4</th>
            <th scope="col" className="px-6 py-3">CO5</th>

            <th scope="col" className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {sheets.length === 0 ? (
            <tr className="bg-white border-[1px] dark:bg-black dark:text-gray-300">
              <td colSpan="24" className="px-6 py-4 text-center">
                No students found
              </td>
            </tr>
          ) : (
            [...sheets]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((sheet) => (
                <tr key={sheet.id} className="bg-white border-[1px] dark:border-neutral-700 dark:bg-black dark:text-gray-300">
                  <td className="px-6 py-3">{sheet.id}</td>
                  <td className="px-6 py-3">{sheet.name}</td>

                  {/* MST1 Sub-columns */}
                  <td className="px-6 py-3">{sheet.MST1_Q1 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.MST1_Q2 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.MST1_Q3 ?? '-'}</td>

                  {/* MST2 Sub-columns */}
                  <td className="px-6 py-3">{sheet.MST2_Q1 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.MST2_Q2 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.MST2_Q3 ?? '-'}</td>

                  {/* Assignment Sub-columns */}
                  <td className="px-6 py-3">{sheet.Assignment_CO1 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Assignment_CO2 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Assignment_CO3 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Assignment_CO4 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Assignment_CO5 ?? '-'}</td>

                  {/* Endsem Sub-columns */}
                  <td className="px-6 py-3">{sheet.EndSem_Q1 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.EndSem_Q2 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.EndSem_Q3 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.EndSem_Q4 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.EndSem_Q5 ?? '-'}</td>

                  {/* Indirect COs Sub-columns */}
                  <td className="px-6 py-3">{sheet.Indirect_CO1 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Indirect_CO2 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Indirect_CO3 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Indirect_CO4 ?? '-'}</td>
                  <td className="px-6 py-3">{sheet.Indirect_CO5 ?? '-'}</td>

                  <td className="px-6 py-3 flex gap-2">
                    <button className='text-blue-500' onClick={() => { setEdit(true); setEditData(sheet); }}>
                      <FaEdit />
                    </button>
                    <button className='text-red-500' onClick={() => deleteStudent(sheet.id, subjectId)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const deleteStudent = async (id, subjectId) => {
  if(window.confirm('Are you sure you want to delete this student?')){
    const response = await axios.delete(`${API_BASE}/api/operation/sheets/${id}/${subjectId}`);
    console.log(response.data);
    window.location.reload();
  }
}

const validateMidSemester = (value) => {
  if (value === '' || value === null || isNaN(value)) return true;
  const numValue = parseFloat(value);
  return numValue >= 0 && numValue <= 5;
};

const validateEndSemester = (value) => {
  if (value === '' || value === null || isNaN(value)) return true;
  const numValue = parseFloat(value);
  return numValue >= 0 && numValue <= 14;
};

const validateAssignment = (value) => {
  if (value === '' || value === null || isNaN(value)) return true;
  const numValue = parseFloat(value);
  return numValue >= 0 && numValue <= 10;
};

const validateIndirectCO = (value) => {
  if (value === '' || value === null || isNaN(value)) return true;
  const numValue = parseFloat(value);
  return numValue >= 0 && numValue <= 3;
};

const AddExamSchema = ({ setSchema, subjectId, fetchCOData }) => {
  const [formData, setFormData] = useState({
    subjectId,
    mst1: { Q1: '', Q2: '', Q3: '' },
    mst2: { Q1: '', Q2: '', Q3: '' },
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('MST1_')) {
      const question = name.split('_')[1];
      setFormData((prevData) => ({
        ...prevData,
        mst1: { ...prevData.mst1, [question]: value },
      }));
    } else if (name.startsWith('MST2_')) {
      const question = name.split('_')[1];
      setFormData((prevData) => ({
        ...prevData,
        mst2: { ...prevData.mst2, [question]: value },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      subjectId: formData.subjectId,
      mst1: {
        Q1: formData.mst1.Q1,
        Q2: formData.mst1.Q2,
        Q3: formData.mst1.Q3,
      },
      mst2: {
        Q1: formData.mst2.Q1,
        Q2: formData.mst2.Q2,
        Q3: formData.mst2.Q3,
      }
    };

    console.log('Data to Submit:', dataToSubmit);

    try {
      const response = await axios.post(`${API_BASE}/api/operation/co-form`, dataToSubmit);
      alert('Form submitted successfully!');
      console.log(response.data);
      setSchema(false);
      fetchCOData();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit the form. Please try again.');
    }
  };

  return (
    <div className="fixed h-full w-full flex items-center justify-center rounded-tl-2xl z-50 poppins-regular backdrop-brightness-50 dark:backdrop-brightness-50 backdrop-blur-sm">
      <form className="max-w-md w-1/3 mx-auto bg-white dark:bg-black rounded-xl p-2 border-2 border-neutral-300 dark:border-neutral-700" onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex justify-end text-white cursor-pointer" onClick={() => setSchema(false)}>
            ❌
          </div>

          {/* MST1 Schema */}
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">MST 1 Schema</h3>
          <div className="mb-4 flex gap-4">
            {['Q1', 'Q2', 'Q3'].map((question, index) => (
              <div key={index} className="mb-3">
                <label htmlFor={`MST1_${question}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white ml-2">
                  {question}
                </label>
                <select
                  id={`MST1_${question}`}
                  name={`MST1_${question}`}
                  value={formData.mst1[question]}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select CO</option>
                  {['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].map((co, idx) => (
                    <option key={idx} value={co}>{co}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* MST2 Schema */}
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">MST 2 Schema</h3>
          <div className="mb-4 flex gap-4">
            {['Q1', 'Q2', 'Q3'].map((question, index) => (
              <div key={index} className="mb-3">
                <label htmlFor={`MST2_${question}`} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white ml-2">
                  {question}
                </label>
                <select
                  id={`MST2_${question}`}
                  name={`MST2_${question}`}
                  value={formData.mst2[question]}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select CO</option>
                  {['CO1', 'CO2', 'CO3', 'CO4', 'CO5'].map((co, idx) => (
                    <option key={idx} value={co}>{co}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {error && <div className="text-red-500 mb-3">{error}</div>}

          <button
            type="submit"
            className="w-full px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-colors duration-800"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

 
const AddStudentPopup = ({ setCreate, subjectId, fetchData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    subjectId,
    name: '',
    mst1: { Q1: null, Q2: null, Q3: null },
    mst2: { Q1: null, Q2: null, Q3: null },
    assignment: { CO1: null, CO2: null, CO3: null, CO4: null, CO5: null },
    endsem: { Q1: null, Q2: null, Q3: null, Q4: null, Q5: null },
    indirect: { CO1: null, CO2: null, CO3: null, CO4: null, CO5: null },
  });
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const floatValue = value === '' ? '' : parseFloat(value);

    // Check if it's a nested field by looking for '_'
    if (name.includes('_')) {
      const [section, key] = name.split('_');

      // Validate based on section
      let valid = true;
      if (section === 'mst1' || section === 'mst2') {
        valid = validateMidSemester(floatValue);
      } else if (section === 'endSem') {
        valid = validateEndSemester(floatValue);
      } else if (section === 'assignment') {
        valid = validateAssignment(floatValue);
      } else if (section === 'indirect') {
        valid = validateIndirectCO(floatValue);
      }

      if (valid) {
        setFormData((prevData) => ({
          ...prevData,
          [section.toLowerCase()]: {
            ...prevData[section.toLowerCase()],
            [key]: value === '' ? null : floatValue,
          },
        }));
        setError('');
      } else {
        setError(`Invalid input value. Please enter a value within the allowed range for ${section}`);
      }
      setIsValid(valid);
    } else {
      // Simple fields like id or name
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Submitting form data:', formData); // Log the form data being submitted
      const response = await axios.post(`${API_BASE}/api/operation/submit-form`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Student added:', response.data);
      setCreate(false);
      fetchData(); // Recall fetchData after successful add
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.response?.data?.error || 'Failed to add student. Please try again.');
    }
  };

  return (
    <div className="absolute h-screen w-full flex items-center justify-center z-50 poppins-regular backdrop-blur-md backdrop-brightness-50">
      <form className="w-1/2 mx-auto bg-white dark:bg-black rounded-xl p-2 border-2 border-neutral-300 dark:border-neutral-700" onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex justify-end text-white cursor-pointer" onClick={() => setCreate(false)}>
            <div>❌</div>
          </div>
          <div className='grid grid-cols-2 gap-6'>
            <div className="mb-4">
              <label htmlFor="id" className="block mb-2 dark:text-white text-lg font-semibold">Enrollment Number</label>
              <input
                type="text"
                name="id"
                id="id"
                value={formData.id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 dark:text-white text-lg font-semibold">Student Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> MID SEMESTER EXAM - 1 MARKS</div>
              <div className='flex gap-3'>
                <div className="mb-4">
                  <label htmlFor="mst1_Q1" className="block mb-2 ml-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="mst1_Q1"
                    id="mst1_Q1"
                    value={formData.mst1.Q1}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst1_Q2" className="block mb-2 ml-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="mst1_Q2"
                    id="mst1_Q2"
                    value={formData.mst1.Q2}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst1_Q3" className="block mb-2 ml-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="mst1_Q3"
                    id="mst1_Q3"
                    value={formData.mst1.Q3}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> MID SEMESTER EXAM - 2 MARKS</div>
              <div className='flex gap-3'>
                <div className="mb-4">
                  <label htmlFor="mst2_Q1" className="block mb-2 ml-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="mst2_Q1"
                    id="mst2_Q1"
                    value={formData.mst2.Q1}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst2_Q2" className="block mb-2 ml-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="mst2_Q2"
                    id="mst2_Q2"
                    value={formData.mst2.Q2}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst2_Q3" className="block mb-2 ml-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="mst2_Q3"
                    id="mst2_Q3"
                    value={formData.mst2.Q3}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> ASSIGNMENT MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="assignment_CO1" className="block mb-2 dark:text-white">CO1</label>
                  <input
                    type="number"
                    name="assignment_CO1"
                    id="assignment_CO1"
                    value={formData.assignment.CO1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO2" className="block mb-2 dark:text-white">CO2</label>
                  <input
                    type="number"
                    name="assignment_CO2"
                    id="assignment_CO2"
                    value={formData.assignment.CO2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO3" className="block mb-2 dark:text-white">CO3</label>
                  <input
                    type="number"
                    name="assignment_CO3"
                    id="assignment_CO3"
                    value={formData.assignment.CO3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO4" className="block mb-2 dark:text-white">CO4</label>
                  <input
                    type="number"
                    name="assignment_CO4"
                    id="assignment_CO4"
                    value={formData.assignment.CO4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO5" className="block mb-2 dark:text-white">CO5</label>
                  <input
                    type="number"
                    name="assignment_CO5"
                    id="assignment_CO5"
                    value={formData.assignment.CO5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> END SEMESTER EXAM MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="endSem_Q1" className="block mb-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="endSem_Q1"
                    id="endSem_Q1"
                    value={formData.endsem.Q1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q2" className="block mb-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="endSem_Q2"
                    id="endSem_Q2"
                    value={formData.endsem.Q2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q3" className="block mb-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="endSem_Q3"
                    id="endSem_Q3"
                    value={formData.endsem.Q3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q4" className="block mb-2 dark:text-white">Q4</label>
                  <input
                    type="number"
                    name="endSem_Q4"
                    id="endSem_Q4"
                    value={formData.endsem.Q4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q5" className="block mb-2 dark:text-white">Q5</label>
                  <input
                    type="number"
                    name="endSem_Q5"
                    id="endSem_Q5"
                    value={formData.endsem.Q5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> INDIRECT CO MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="indirect_CO1" className="block mb-2 dark:text-white">CO1</label>
                  <input
                    type="number"
                    name="indirect_CO1"
                    id="indirect_CO1"
                    value={formData.indirect.CO1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO2" className="block mb-2 dark:text-white">CO2</label>
                  <input
                    type="number"
                    name="indirect_CO2"
                    id="indirect_CO2"
                    value={formData.indirect.CO2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO3" className="block mb-2 dark:text-white">CO3</label>
                  <input
                    type="number"
                    name="indirect_CO3"
                    id="indirect_CO3"
                    value={formData.indirect.CO3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO4" className="block mb-2 dark:text-white">CO4</label>
                  <input
                    type="number"
                    name="indirect_CO4"
                    id="indirect_CO4"
                    value={formData.indirect.CO4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO5" className="block mb-2 dark:text-white">CO5</label>
                  <input
                    type="number"
                    name="indirect_CO5"
                    id="indirect_CO5"
                    value={formData.indirect.CO5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 mb-3">{error}</div>}
          </div>
          <button type="submit" className="w-full px-4 py-2 mt-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-colors duration-800" disabled={!isValid}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};


  const overallSheet = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/overall-sheet?subjectId=${subjectId}`, {
      responseType: 'blob', // Important to set response type as blob for file download
    })
    .then((response) => {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Overall_Sheet.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadMST1 = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/downloadmst1/${subjectId}`, {
      responseType: 'blob', // Important to set response type as blob for file download
    })
    .then((response) => {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MST1_Sheet.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadMST2 = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/downloadmst2/${subjectId}`, {
      responseType: 'blob', // Important to set response type as blob for file download
    })
    .then((response) => {
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MST2_Sheet.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadEndSem = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/end-excel/${subjectId}`, {
      responseType: 'blob',
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EndSem_Sheet.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadAssignment = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/assignment-excel/${subjectId}`, {
      responseType: 'blob',
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Assignment_Sheet.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadCOSheet = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/generate-co-attainment/${subjectId}`, {
      responseType: 'blob',
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CO_Attainment_Sheet.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Excel sheet:', error);
    });
  };

  const downloadCOMatrix = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/co-matrix/${subjectId}`, {
      responseType: 'blob',
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CO_Matrix_${subjectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading the CO matrix:', error);
    });
  };

  const downloadOverallCO = (subjectId) => {
    axios.get(`${API_BASE}/api/operation/overall-co-matrix/${subjectId}`, {
      responseType: 'blob',
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Overall_CO_Matrix_${subjectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((error) => {
      console.error('Error downloading the Overall CO matrix:', error);
    });
  };

const EditStudentPopup = ({ setEdit, subjectId, editData, fetchData }) => {
  const [formData, setFormData] = useState({
    id: editData.id,
    subjectId,
    name: editData.name,
    mst1: { Q1: editData.MST1_Q1, Q2: editData.MST1_Q2, Q3: editData.MST1_Q3 },
    mst2: { Q1: editData.MST2_Q1, Q2: editData.MST2_Q2, Q3: editData.MST2_Q3 },
    assignment: { CO1: editData.Assignment_CO1, CO2: editData.Assignment_CO2, CO3: editData.Assignment_CO3, CO4: editData.Assignment_CO4, CO5: editData.Assignment_CO5 },
    endsem: { Q1: editData.EndSem_Q1, Q2: editData.EndSem_Q2, Q3: editData.EndSem_Q3, Q4: editData.EndSem_Q4, Q5: editData.EndSem_Q5 },
    indirect: { CO1: editData.Indirect_CO1, CO2: editData.Indirect_CO2, CO3: editData.Indirect_CO3, CO4: editData.Indirect_CO4, CO5: editData.Indirect_CO5 },
  });
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const floatValue = value === '' ? '' : parseFloat(value);

    // Check if it's a nested field by looking for '_'
    if (name.includes('_')) {
      const [section, key] = name.split('_');

      // Validate based on section
      let valid = true;
      if (section === 'mst1' || section === 'mst2') {
        valid = validateMidSemester(floatValue);
      } else if (section === 'endSem') {
        valid = validateEndSemester(floatValue);
      } else if (section === 'assignment') {
        valid = validateAssignment(floatValue);
      } else if (section === 'indirect') {
        valid = validateIndirectCO(floatValue);
      }

      if (valid) {
        setFormData((prevData) => ({
          ...prevData,
          [section.toLowerCase()]: {
            ...prevData[section.toLowerCase()],
            [key]: value === '' ? null : floatValue,
          },
        }));
        setError('');
      } else {
        setError(`Invalid input value. Please enter a value within the allowed range for ${section}`);
      }
      setIsValid(valid);
    } else {
      // Simple fields like id or name
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('Submitting form data:', formData); // Log the form data being submitted
      const response = await axios.put(`${API_BASE}/api/operation/sheets/${formData.id}/${formData.subjectId}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Student updated:', response.data);
      setEdit(false);
      fetchData(); // Recall fetchData after successful edit
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err.response?.data?.error || 'Failed to update student. Please try again.');
    }
  };

  return (
    <div className="absolute h-screen w-full flex items-center justify-center z-50 poppins-regular backdrop-blur-md backdrop-brightness-50">
      <form className="w-1/2 mx-auto bg-white dark:bg-black rounded-xl p-2 border-2 border-neutral-300 dark:border-neutral-700" onSubmit={handleSubmit}>
        <div className="p-4">
          <div className="flex justify-end text-white cursor-pointer" onClick={() => setEdit(false)}>
            <div>❌</div>
          </div>
          <div className='grid grid-cols-2 gap-6'>
            <div className="mb-4">
              <label htmlFor="id" className="block mb-2 dark:text-white text-lg font-semibold">Enrollment Number</label>
              <input
                type="text"
                name="id"
                id="id"
                value={formData.id}
                disabled
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block mb-2 dark:text-white text-lg font-semibold">Student Name</label>
              <input
                type="text"
                name="name"
                id="name"
                disabled
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> MID SEMESTER EXAM - 1 MARKS</div>
              <div className='flex gap-3'>
                <div className="mb-4">
                  <label htmlFor="mst1_Q1" className="block mb-2 ml-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="mst1_Q1"
                    id="mst1_Q1"
                    value={formData.mst1.Q1}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst1_Q2" className="block mb-2 ml-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="mst1_Q2"
                    id="mst1_Q2"
                    value={formData.mst1.Q2}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst1_Q3" className="block mb-2 ml-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="mst1_Q3"
                    id="mst1_Q3"
                    value={formData.mst1.Q3}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> MID SEMESTER EXAM - 2 MARKS</div>
              <div className='flex gap-3'>
                <div className="mb-4">
                  <label htmlFor="mst2_Q1" className="block mb-2 ml-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="mst2_Q1"
                    id="mst2_Q1"
                    value={formData.mst2.Q1}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst2_Q2" className="block mb-2 ml-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="mst2_Q2"
                    id="mst2_Q2"
                    value={formData.mst2.Q2}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="mst2_Q3" className="block mb-2 ml-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="mst2_Q3"
                    id="mst2_Q3"
                    value={formData.mst2.Q3}
                    onChange={handleChange}
                    className="w-full mx-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> ASSIGNMENT MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="assignment_CO1" className="block mb-2 dark:text-white">CO1</label>
                  <input
                    type="number"
                    name="assignment_CO1"
                    id="assignment_CO1"
                    value={formData.assignment.CO1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO2" className="block mb-2 dark:text-white">CO2</label>
                  <input
                    type="number"
                    name="assignment_CO2"
                    id="assignment_CO2"
                    value={formData.assignment.CO2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO3" className="block mb-2 dark:text-white">CO3</label>
                  <input
                    type="number"
                    name="assignment_CO3"
                    id="assignment_CO3"
                    value={formData.assignment.CO3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO4" className="block mb-2 dark:text-white">CO4</label>
                  <input
                    type="number"
                    name="assignment_CO4"
                    id="assignment_CO4"
                    value={formData.assignment.CO4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="assignment_CO5" className="block mb-2 dark:text-white">CO5</label>
                  <input
                    type="number"
                    name="assignment_CO5"
                    id="assignment_CO5"
                    value={formData.assignment.CO5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> END SEMESTER EXAM MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="endSem_Q1" className="block mb-2 dark:text-white">Q1</label>
                  <input
                    type="number"
                    name="endSem_Q1"
                    id="endSem_Q1"
                    value={formData.endsem.Q1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q2" className="block mb-2 dark:text-white">Q2</label>
                  <input
                    type="number"
                    name="endSem_Q2"
                    id="endSem_Q2"
                    value={formData.endsem.Q2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q3" className="block mb-2 dark:text-white">Q3</label>
                  <input
                    type="number"
                    name="endSem_Q3"
                    id="endSem_Q3"
                    value={formData.endsem.Q3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q4" className="block mb-2 dark:text-white">Q4</label>
                  <input
                    type="number"
                    name="endSem_Q4"
                    id="endSem_Q4"
                    value={formData.endsem.Q4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="endSem_Q5" className="block mb-2 dark:text-white">Q5</label>
                  <input
                    type="number"
                    name="endSem_Q5"
                    id="endSem_Q5"
                    value={formData.endsem.Q5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className='block mb-2 dark:text-white text-lg font-semibold'> INDIRECT CO MARKS</div>
              <div className='flex gap-1'>
                <div className="mb-4">
                  <label htmlFor="indirect_CO1" className="block mb-2 dark:text-white">CO1</label>
                  <input
                    type="number"
                    name="indirect_CO1"
                    id="indirect_CO1"
                    value={formData.indirect.CO1}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO2" className="block mb-2 dark:text-white">CO2</label>
                  <input
                    type="number"
                    name="indirect_CO2"
                    id="indirect_CO2"
                    value={formData.indirect.CO2}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO3" className="block mb-2 dark:text-white">CO3</label>
                  <input
                    type="number"
                    name="indirect_CO3"
                    id="indirect_CO3"
                    value={formData.indirect.CO3}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO4" className="block mb-2 dark:text-white">CO4</label>
                  <input
                    type="number"
                    name="indirect_CO4"
                    id="indirect_CO4"
                    value={formData.indirect.CO4}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="indirect_CO5" className="block mb-2 dark:text-white">CO5</label>
                  <input
                    type="number"
                    name="indirect_CO5"
                    id="indirect_CO5"
                    value={formData.indirect.CO5}
                    onChange={handleChange}
                    className="w-full mr-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 mb-3">{error}</div>}
          </div>
          <button type="submit" className="w-full px-4 py-2 mt-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-colors duration-800" disabled={!isValid}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubDash;