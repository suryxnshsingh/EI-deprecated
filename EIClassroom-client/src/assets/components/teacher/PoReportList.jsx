import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FileBarChart, Plus, Trash2 } from 'lucide-react';
import { API_BASE } from '../../../../lib/api';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const PoReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/reports`, { headers: authHeaders() });
      setReports(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createReport = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_BASE}/api/reports`,
        { name: newName.trim() },
        { headers: authHeaders() }
      );
      setNewName('');
      navigate(`/teachers/po-reports/${res.data.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/api/reports/${id}`, { headers: authHeaders() });
      setReports((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
      setError('Failed to delete report');
    }
  };

  return (
    <div className="w-[calc(100vw-120px)] max-w-[calc(100vw-120px)] min-w-0 p-6 poppins"><div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold dark:text-white mb-6 flex items-center gap-3">
        <FileBarChart className="text-violet-600" />
        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
          PO Report Generator
        </span>
      </h1>

      <form onSubmit={createReport} className="mb-8 flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="New report name (e.g. NBA 2024 Batch Report)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-[260px] border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 bg-white dark:bg-neutral-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={16} /> {creating ? 'Creating…' : 'New Report'}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
          <p className="text-slate-500 dark:text-slate-400">No reports yet. Create one above to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-4 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-violet-500 transition-colors"
            >
              <Link to={`/teachers/po-reports/${r.id}`} className="flex-1">
                <div className="font-semibold dark:text-white">{r.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last updated {new Date(r.updatedAt).toLocaleString()}
                </div>
              </Link>
              <button
                onClick={() => deleteReport(r.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Delete report"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default PoReportList;
