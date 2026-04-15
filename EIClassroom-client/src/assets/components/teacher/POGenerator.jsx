import React, { useState, useEffect, useRef } from 'react';
import { IoStatsChart } from "react-icons/io5";
import { FaFileUpload } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_BASE } from '../../../../lib/api';

const POGenerator = ({ subjectId: subjectIdProp, poTab }) => {
  const location = useLocation();
  const subjectId = subjectIdProp || new URLSearchParams(location.search).get('subject');
  const tabControlled = Boolean(poTab);

  // Initialize matrix1 with 5 rows of input cells and 1 row for average
  const [matrix1, setMatrix1] = useState(
    Array(5).fill().map(() => Array(12).fill('-'))
  );
  const [averageRow, setAverageRow] = useState(Array(12).fill('-'));
  const [matrix2, setMatrix2] = useState(Array(5).fill(''));
  const [outputMatrix, setOutputMatrix] = useState(
    Array(6).fill().map(() => Array(12).fill('-'))
  );
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingExisting, setLoadingExisting] = useState(Boolean(subjectId));
  const [internalTab, setInternalTab] = useState('direct');
  const activeTab = tabControlled ? poTab : internalTab;
  const setActiveTab = tabControlled ? () => {} : setInternalTab;
  const [indirectMatrix, setIndirectMatrix] = useState(
    Array(5).fill().map(() => Array(12).fill('-'))
  );
  const [indirectAverage, setIndirectAverage] = useState(Array(12).fill('-'));
  const [snapshot, setSnapshot] = useState(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitStatus, setCommitStatus] = useState('');
  const fileInputRef = useRef(null);

  const indirectRowLabels = ['Exit Summary', 'Alumni', 'External', 'Parents', 'Recruiters'];

  const handleIndirectChange = (row, col, value) => {
    setIndirectMatrix((prev) => {
      const updated = [...prev];
      updated[row] = [...updated[row]];
      updated[row][col] = value;
      return updated;
    });
  };

  // Load saved PO data when a subject is provided via query param
  useEffect(() => {
    if (!subjectId) return;
    const fetchPO = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/po/${subjectId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const { matrix1: savedM1, matrix2: savedM2, indirectMatrix: savedIM } = response.data;
        if (Array.isArray(savedM1) && savedM1.length === 5) setMatrix1(savedM1);
        if (Array.isArray(savedM2) && savedM2.length === 5) setMatrix2(savedM2);
        if (Array.isArray(savedIM) && savedIM.length === 5) setIndirectMatrix(savedIM);
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error('Failed to load saved PO:', err);
        }
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchPO();
  }, [subjectId]);

  // Load existing PO snapshot (final-report table) for this subject
  useEffect(() => {
    if (!subjectId) return;
    const fetchSnapshot = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/po/${subjectId}/snapshot`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSnapshot(response.data);
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.error('Failed to load PO snapshot:', err);
        }
      }
    };
    fetchSnapshot();
  }, [subjectId]);

  const commitSnapshot = async (directAverage, indirectAverageArr, overallAverage) => {
    if (!subjectId) return;
    try {
      setCommitLoading(true);
      setCommitStatus('');
      const response = await axios.post(
        `${API_BASE}/api/po/${subjectId}/snapshot`,
        { directAverage, indirectAverage: indirectAverageArr, overallAverage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSnapshot(response.data);
      setCommitStatus('Committed to final report');
    } catch (err) {
      console.error('Failed to commit PO snapshot:', err);
      setCommitStatus('Failed to commit');
    } finally {
      setCommitLoading(false);
    }
  };

  const savePO = async () => {
    if (!subjectId) return;
    try {
      setSaveLoading(true);
      setSaveStatus('');
      await axios.post(
        `${API_BASE}/api/po/${subjectId}`,
        { matrix1, matrix2, indirectMatrix, indirectAverage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSaveStatus('Saved');
    } catch (err) {
      console.error('Failed to save PO:', err);
      setSaveStatus('Failed to save');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle change in first matrix values
  const handleMatrix1Change = (row, col, value) => {
    setMatrix1((prev) => {
      const updated = [...prev];
      updated[row] = [...updated[row]];
      updated[row][col] = value;
      return updated;
    });
  };

  // Handle change in second matrix values
  const handleMatrix2Change = (col, value) => {
    setMatrix2((prev) => {
      const updated = [...prev];
      updated[col] = value;
      return updated;
    });
  };

  // Calculate indirect average row whenever indirectMatrix changes
  useEffect(() => {
    const calculated = Array(12).fill().map((_, colIndex) => {
      const validValues = indirectMatrix
        .map(row => row[colIndex])
        .filter(cell => cell !== '-' && cell !== '' && cell !== null && cell !== undefined)
        .map(cell => Number(cell));

      if (validValues.length === 0) return '-';
      const sum = validValues.reduce((acc, val) => acc + val, 0);
      return (sum / validValues.length).toFixed(2);
    });
    setIndirectAverage(calculated);
  }, [indirectMatrix]);

  // Calculate average row whenever matrix1 changes
  useEffect(() => {
    const calculatedAverages = Array(12).fill().map((_, colIndex) => {
      const validValues = matrix1
        .map(row => row[colIndex])
        .filter(cell => cell !== '-')
        .map(cell => Number(cell));
      
      if (validValues.length === 0) {
        return '-';
      }

      const sum = validValues.reduce((acc, val) => acc + val, 0);
      return (sum / validValues.length).toFixed(2);
    });

    setAverageRow(calculatedAverages);
  }, [matrix1]);

  // Calculate output matrix whenever inputs change
  useEffect(() => {
    const calculated = [...matrix1.map((row, rowIndex) => {
      // For CO rows, calculate based on formula
      return row.map((cell, colIndex) => {
        if (cell === '-' || !matrix2[rowIndex] || matrix2[rowIndex] === '') {
          return '-';
        }
        
        const matrix1Value = Number(cell);
        const matrix2Value = Number(matrix2[rowIndex]) / 3;
        const result = matrix1Value * matrix2Value;
        
        return result.toFixed(2);
      });
    })];

    // Calculate the average row for output matrix
    const outputAverage = Array(12).fill().map((_, colIndex) => {
      const values = calculated
        .map(row => row[colIndex])
        .filter(cell => cell !== '-')
        .map(cell => Number(cell));
      
      if (values.length === 0) {
        return '-';
      }

      const sum = values.reduce((acc, val) => acc + val, 0);
      return (sum / values.length).toFixed(2);
    });

    // Add average row to calculated output
    calculated.push(outputAverage);
    setOutputMatrix(calculated);
  }, [matrix1, matrix2]);

  // Handle file upload for CO values
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setUploadError('');
    
    if (!file) return;
    
    // Check file extension
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      setUploadError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Find the row with "Overall CO" assessment
        const overallCoRow = jsonData.find(row => 
          row.Assessment === 'Overall CO' || 
          row.Assessment === 'Overall CO ' || 
          String(row.Assessment).trim().toLowerCase() === 'overall co');
        
        if (!overallCoRow) {
          setUploadError('Could not find "Overall CO" row in the Excel file');
          return;
        }
        
        // Extract CO values without affecting matrix1
        const newMatrix2 = Array(5).fill('');
        for (let i = 1; i <= 5; i++) {
          const coValue = overallCoRow[`CO${i}`];
          newMatrix2[i-1] = coValue !== undefined ? coValue : '';
        }
        
        // Update only matrix2, preserving matrix1 state
        setMatrix2(newMatrix2);
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        setUploadError('Failed to parse the Excel file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      setUploadError('Error reading the file');
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset the file input
    event.target.value = null;
  };

  // Handler to trigger file input click
  const handleUploadButtonClick = () => {
    fileInputRef.current.click();
  };

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      setExportError('');
      
      // Create PO headers
      const poHeaders = Array.from({ length: 12 }, (_, i) => `PO${i + 1}`);
      
      // Send the matrix data to the export endpoint
      const response = await axios({
        method: 'post',
        url: `${API_BASE}/api/po/export-co-po-matrix`,
        data: {
          matrix: outputMatrix.slice(0, 5), // First 5 rows (CO1-CO5)
          averageRow: outputMatrix[5],      // Last row (Average)
          headers: poHeaders
        },
        responseType: 'blob'  // Important for file download
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary anchor element to download the file
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CO_PO_Attainment_Matrix.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setExportError('Failed to export to Excel. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const rowHeaders = ["CO1", "CO2", "CO3", "CO4", "CO5", "Average"];

  return (
    <div className="w-full max-w-full min-w-0 pb-12 poppins overflow-x-hidden">
      {!tabControlled && (
        <h1 className="text-3xl font-bold dark:text-white pt-6 text-center">
          PO Generator{subjectId ? ` — ${subjectId}` : ''}
        </h1>
      )}
      {loadingExisting && (
        <p className="text-center text-slate-500 dark:text-slate-400 mt-2">Loading saved PO…</p>
      )}

      {!tabControlled && (
        <div className="mt-6 mx-6 border-b border-neutral-300 dark:border-neutral-700 flex gap-2">
          {[
            { key: 'direct', label: 'Direct PO' },
            { key: 'indirect', label: 'Indirect PO' },
            { key: 'overall', label: 'Overall PO' },
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
      )}

      {activeTab === 'indirect' && (
        <div className="mx-6 mt-8">
          <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center">
            <IoStatsChart className="mr-2 text-violet-600" />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
              Indirect PO Attainment
            </span>
          </h2>
          <div className="overflow-x-auto">
            <table className="table-auto border-collapse border border-neutral-300 dark:border-neutral-700 w-full min-w-[700px]">
              <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
                <tr>
                  <th className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">#</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">
                      PO{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indirectMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex} className="bg-white dark:bg-black">
                    <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white whitespace-nowrap">
                      {indirectRowLabels[rowIndex]}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2">
                        <select
                          value={cell}
                          onChange={(e) => handleIndirectChange(rowIndex, colIndex, e.target.value)}
                          className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 w-full bg-white dark:bg-neutral-800 dark:text-white"
                        >
                          <option value="-">-</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-[#F5F5F5] dark:bg-neutral-800">
                  <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">Average</td>
                  {indirectAverage.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 dark:text-white">
                      {cell}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'overall' && (() => {
        const directAvg = outputMatrix[5] || Array(12).fill('-');
        const overall = Array(12).fill().map((_, i) => {
          const d = directAvg[i];
          const ind = indirectAverage[i];
          const dNum = d === '-' || d === '' ? null : Number(d);
          const iNum = ind === '-' || ind === '' ? null : Number(ind);
          if (dNum === null && iNum === null) return '-';
          if (dNum === null) return iNum.toFixed(2);
          if (iNum === null) return dNum.toFixed(2);
          return (0.8 * dNum + 0.2 * iNum).toFixed(2);
        });
        const snapshotDate = snapshot?.updatedAt ? new Date(snapshot.updatedAt).toLocaleString() : null;
        const isStale = snapshot && JSON.stringify(snapshot.overallAverage) !== JSON.stringify(overall);
        return (
          <div className="mx-6 mt-8">
            <div className={`mb-4 px-4 py-3 rounded-lg border ${
              !snapshot
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                : isStale
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-700 text-orange-800 dark:text-orange-200'
                : 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-700 text-green-800 dark:text-green-200'
            }`}>
              {!snapshot && (
                <p className="text-sm">
                  <strong>Not committed yet.</strong> Once you've verified the Direct and Indirect PO data,
                  commit this snapshot to the final report table so it appears in the PO Report Generator.
                </p>
              )}
              {snapshot && isStale && (
                <p className="text-sm">
                  <strong>Snapshot is out of date.</strong> Last committed {snapshotDate}. The current values
                  differ from the committed snapshot — re-commit to refresh the final report.
                </p>
              )}
              {snapshot && !isStale && (
                <p className="text-sm">
                  <strong>Committed to final report.</strong> Last committed {snapshotDate}.
                </p>
              )}
            </div>
            <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center">
              <IoStatsChart className="mr-2 text-violet-600" />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
                Overall PO Attainment (80% Direct + 20% Indirect)
              </span>
            </h2>
            <div className="overflow-x-auto bg-[#F5F5F5] dark:bg-neutral-900 rounded-lg p-4 border-[1px] border-neutral-300 dark:border-neutral-700">
              <table className="table-auto border-collapse border border-neutral-300 dark:border-neutral-700 w-full min-w-[700px]">
                <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
                  <tr>
                    <th className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">#</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">PO{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-black">
                    <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white whitespace-nowrap">Direct (80%)</td>
                    {directAvg.map((cell, i) => (
                      <td key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 dark:text-white">{cell}</td>
                    ))}
                  </tr>
                  <tr className="bg-white dark:bg-black">
                    <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white whitespace-nowrap">Indirect (20%)</td>
                    {indirectAverage.map((cell, i) => (
                      <td key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 dark:text-white">{cell}</td>
                    ))}
                  </tr>
                  <tr className="bg-[#F5F5F5] dark:bg-neutral-800">
                    <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">Overall</td>
                    {overall.map((cell, i) => (
                      <td key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">{cell}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {subjectId && (
              <div className="mt-6 flex gap-4 items-center flex-wrap">
                <button
                  className="px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => commitSnapshot(directAvg, indirectAverage, overall)}
                  disabled={commitLoading}
                >
                  {commitLoading
                    ? 'Committing...'
                    : snapshot
                    ? 'Re-commit to Final Report'
                    : 'Commit to Final Report'}
                </button>
                {commitStatus && (
                  <span className={commitStatus.startsWith('Committed') ? 'text-green-500' : 'text-red-500'}>
                    {commitStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <div className={activeTab === 'direct' ? '' : 'hidden'}>

      {/* Overall CO Attainment (Previously Second Matrix) */}
      <div className="mb-8 mt-8 mx-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center">
          <IoStatsChart className="mr-2 text-violet-600" />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">Overall CO Attainment</span>
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleUploadButtonClick}
            className="px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20 flex items-center gap-2"
          >
            <FaFileUpload /> Upload CO Report
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx,.xls" 
            onChange={handleFileUpload} 
          />
          {uploadError && <span className="text-red-500">{uploadError}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-neutral-300 dark:border-neutral-700 w-full">
            <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
              <tr>
                {Array.from({ length: 5 }, (_, i) => (
                  <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">CO{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-black">
                {matrix2.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={cell}
                      onChange={(e) =>
                        handleMatrix2Change(colIndex, e.target.value)
                      }
                      className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 w-full bg-white dark:bg-neutral-800 dark:text-white"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CO-PO Articulation Matrix (Previously First Matrix) */}
      <div className="mb-8 mx-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center">
          <IoStatsChart className="mr-2 text-violet-600" />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">CO-PO Articulation Matrix</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-neutral-300 dark:border-neutral-700 w-full min-w-[700px]">
            <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
              <tr>
                <th className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">#</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">PO{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Render the editable rows (CO1-CO5) */}
              {matrix1.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-white dark:bg-black">
                  <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">{rowHeaders[rowIndex]}</td>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2">
                      <select
                        value={cell}
                        onChange={(e) =>
                          handleMatrix1Change(rowIndex, colIndex, e.target.value)
                        }
                        className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 w-full bg-white dark:bg-neutral-800 dark:text-white"
                      >
                        <option value="-">-</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
              {/* Render the average row (read-only) */}
              <tr className="bg-[#F5F5F5] dark:bg-neutral-800">
                <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">{rowHeaders[5]}</td>
                {averageRow.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 dark:text-white">
                    {cell}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Matrix */}
      <div className="mx-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center">
          <IoStatsChart className="mr-2 text-violet-600" />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">CO-PO Attainment Matrix</span>
        </h2>
        <div className="overflow-x-auto bg-[#F5F5F5] dark:bg-neutral-900 rounded-lg p-4 border-[1px] border-neutral-300 dark:border-neutral-700">
          <table className="table-auto border-collapse border border-neutral-300 dark:border-neutral-700 w-full min-w-[700px]">
            <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
              <tr>
                <th className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">#</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-gray-700 dark:text-white">PO{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outputMatrix.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 5 ? "bg-[#F5F5F5] dark:bg-neutral-800" : "bg-white dark:bg-black"}>
                  <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">{rowHeaders[rowIndex]}</td>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 dark:text-white">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      </div>

      {/* Action Buttons (shared across tabs) */}
      <div className="mt-8 mx-6">
        <div className="flex gap-4 items-center flex-wrap">
          {activeTab === 'direct' && (
            <button
              className="px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={exportToExcel}
              disabled={exportLoading}
            >
              {exportLoading ? 'Exporting...' : 'Export to Excel'}
            </button>
          )}
          {subjectId && activeTab !== 'overall' && (
            <button
              className="px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={savePO}
              disabled={saveLoading}
            >
              {saveLoading ? 'Saving...' : (activeTab === 'indirect' ? 'Save Indirect PO' : 'Save PO')}
            </button>
          )}
          {saveStatus && (
            <span className={saveStatus === 'Saved' ? 'text-green-500' : 'text-red-500'}>
              {saveStatus}
            </span>
          )}
          {exportError && <span className="text-red-500">{exportError}</span>}
        </div>
      </div>
    </div>
  );
};

export default POGenerator;