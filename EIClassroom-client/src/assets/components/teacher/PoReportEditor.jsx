import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, RefreshCw, FileBarChart } from 'lucide-react';
import { API_BASE } from '../../../../lib/api';
import AddSubjectModal from './AddSubjectModal';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const PoReportEditor = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSemesterLabel, setNewSemesterLabel] = useState('');
  const [addingToSemesterId, setAddingToSemesterId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/reports/${reportId}`, { headers: authHeaders() });
      setReport(res.data);
      setNewName(res.data.name);
    } catch (err) {
      console.error(err);
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const renameReport = async () => {
    if (!newName.trim() || newName === report.name) {
      setRenaming(false);
      return;
    }
    try {
      const res = await axios.patch(
        `${API_BASE}/api/reports/${reportId}`,
        { name: newName.trim() },
        { headers: authHeaders() }
      );
      setReport((r) => ({ ...r, name: res.data.name }));
      setRenaming(false);
    } catch (err) {
      console.error(err);
    }
  };

  const addSemester = async (e) => {
    e.preventDefault();
    if (!newSemesterLabel.trim()) return;
    try {
      await axios.post(
        `${API_BASE}/api/reports/${reportId}/semesters`,
        { label: newSemesterLabel.trim() },
        { headers: authHeaders() }
      );
      setNewSemesterLabel('');
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSemester = async (semId) => {
    if (!window.confirm('Delete this semester and all its subjects?')) return;
    try {
      await axios.delete(`${API_BASE}/api/reports/semesters/${semId}`, { headers: authHeaders() });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSubjectRow = async (rowId) => {
    try {
      await axios.delete(`${API_BASE}/api/reports/subjects/${rowId}`, { headers: authHeaders() });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const refreshRowPO = async (rowId) => {
    try {
      await axios.patch(
        `${API_BASE}/api/reports/subjects/${rowId}`,
        { refreshPO: true },
        { headers: authHeaders() }
      );
      load();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Failed to refresh');
    }
  };

  const updateRow = async (rowId, patch) => {
    try {
      await axios.patch(`${API_BASE}/api/reports/subjects/${rowId}`, patch, { headers: authHeaders() });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReport = async () => {
    if (!window.confirm('Delete the entire report?')) return;
    try {
      await axios.delete(`${API_BASE}/api/reports/${reportId}`, { headers: authHeaders() });
      navigate('/teachers/po-reports');
    } catch (err) {
      console.error(err);
    }
  };

  // Compute overall average across ALL subject rows in the report
  const overallAverage = (() => {
    if (!report) return Array(12).fill('-');
    const allRows = report.semesters.flatMap((s) => s.subjects.map((r) => r.overallPO));
    return Array(12)
      .fill()
      .map((_, i) => {
        const vals = allRows
          .map((row) => (Array.isArray(row) ? row[i] : null))
          .filter((v) => v !== '-' && v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
          .map((v) => Number(v));
        if (vals.length === 0) return '-';
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
      });
  })();

  if (loading) return <div className="p-8 dark:text-white">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!report) return null;

  // Flat numbering across all semesters (matches the reference image)
  let runningIndex = 0;

  return (
    <div className="w-[calc(100vw-120px)] max-w-[calc(100vw-120px)] min-w-0 p-6 poppins overflow-x-hidden">
      <Link
        to="/teachers/po-reports"
        className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-4 hover:underline"
      >
        <ArrowLeft size={16} /> Back to reports
      </Link>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
          <FileBarChart className="text-violet-600" />
          {renaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={renameReport}
              onKeyDown={(e) => e.key === 'Enter' && renameReport()}
              autoFocus
              className="border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-800 dark:text-white text-2xl"
            />
          ) : (
            <span
              className="cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text"
              onClick={() => setRenaming(true)}
              title="Click to rename"
            >
              {report.name}
            </span>
          )}
        </h1>
        <button
          onClick={deleteReport}
          className="px-3 py-2 text-red-500 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
        >
          <Trash2 size={16} /> Delete Report
        </button>
      </div>

      <form onSubmit={addSemester} className="mb-6 flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder='Add semester (e.g. "III SEM July-Dec 2021")'
          value={newSemesterLabel}
          onChange={(e) => setNewSemesterLabel(e.target.value)}
          className="flex-1 min-w-[260px] border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 bg-white dark:bg-neutral-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={!newSemesterLabel.trim()}
          className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={16} /> Add Semester
        </button>
      </form>

      {/* Big table view with all semesters */}
      <div className="overflow-x-auto border border-neutral-300 dark:border-neutral-700 rounded-lg">
        <table className="table-auto border-collapse w-full min-w-[1200px] text-sm">
          <thead className="bg-[#F5F5F5] dark:bg-neutral-800">
            <tr>
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">S.No.</th>
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">Semester</th>
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">Category</th>
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">Code</th>
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">T/P</th>
              {Array.from({ length: 12 }, (_, i) => (
                <th key={i} className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white">
                  PO{i + 1}
                </th>
              ))}
              <th className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white"></th>
            </tr>
          </thead>
          <tbody>
            {report.semesters.map((sem) => {
              const rowCount = Math.max(sem.subjects.length, 1);
              return (
                <React.Fragment key={sem.id}>
                  {sem.subjects.length === 0 ? (
                    <tr className="bg-white dark:bg-black">
                      <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 text-center dark:text-white">
                        —
                      </td>
                      <td className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white">
                        <div className="mb-2">{sem.label}</div>
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => setAddingToSemesterId(sem.id)}
                            className="inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                          >
                            <Plus size={12} /> Add subject
                          </button>
                          <button
                            onClick={() => deleteSemester(sem.id)}
                            className="inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                      <td
                        colSpan={15}
                        className="border border-neutral-300 dark:border-neutral-700 px-2 py-4 text-center text-slate-500 dark:text-slate-400 italic"
                      >
                        No subjects yet
                      </td>
                    </tr>
                  ) : (
                    sem.subjects.map((row, idx) => {
                      runningIndex += 1;
                      return (
                        <tr key={row.id} className="bg-white dark:bg-black">
                          <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 text-center dark:text-white">
                            {runningIndex}
                          </td>
                          {idx === 0 && (
                            <td
                              rowSpan={rowCount}
                              className="border border-neutral-300 dark:border-neutral-700 px-3 py-2 font-semibold dark:text-white align-middle"
                            >
                              <div className="mb-2">{sem.label}</div>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  onClick={() => setAddingToSemesterId(sem.id)}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
                                >
                                  <Plus size={12} /> Add subject
                                </button>
                                <button
                                  onClick={() => deleteSemester(sem.id)}
                                  className="inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-1">
                            <input
                              type="text"
                              value={row.category || ''}
                              onChange={(e) => updateRow(row.id, { category: e.target.value })}
                              placeholder="—"
                              className="w-20 border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-neutral-800 dark:text-white"
                            />
                          </td>
                          <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white whitespace-nowrap">
                            {row.subject?.code}
                          </td>
                          <td className="border border-neutral-300 dark:border-neutral-700 px-1 py-1">
                            <select
                              value={row.theoryPractical}
                              onChange={(e) => updateRow(row.id, { theoryPractical: e.target.value })}
                              className="border border-neutral-200 dark:border-neutral-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-neutral-800 dark:text-white"
                            >
                              <option value="T">T</option>
                              <option value="P">P</option>
                              <option value="T+P">T+P</option>
                            </select>
                          </td>
                          {Array.from({ length: 12 }, (_, i) => (
                            <td
                              key={i}
                              className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white text-center"
                            >
                              {Array.isArray(row.overallPO) ? row.overallPO[i] ?? '-' : '-'}
                            </td>
                          ))}
                          <td className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 whitespace-nowrap">
                            <button
                              onClick={() => refreshRowPO(row.id)}
                              className="p-1 text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded"
                              title="Refresh from latest snapshot"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              onClick={() => deleteSubjectRow(row.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Remove row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
            {/* Average row */}
            <tr className="bg-[#F5F5F5] dark:bg-neutral-800 font-semibold">
              <td
                colSpan={5}
                className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 text-right dark:text-white"
              >
                Average PO attainment
              </td>
              {overallAverage.map((cell, i) => (
                <td
                  key={i}
                  className="border border-neutral-300 dark:border-neutral-700 px-2 py-2 dark:text-white text-center"
                >
                  {cell}
                </td>
              ))}
              <td className="border border-neutral-300 dark:border-neutral-700" />
            </tr>
            {report.semesters.length === 0 && (
              <tr>
                <td
                  colSpan={18}
                  className="border border-neutral-300 dark:border-neutral-700 px-2 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No semesters yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addingToSemesterId !== null && (
        <AddSubjectModal
          semesterId={addingToSemesterId}
          onClose={() => setAddingToSemesterId(null)}
          onAdded={() => {
            setAddingToSemesterId(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default PoReportEditor;
