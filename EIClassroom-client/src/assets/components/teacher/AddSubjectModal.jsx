import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { API_BASE } from '../../../../lib/api';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const AddSubjectModal = ({ semesterId, onClose, onAdded }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [theoryPractical, setTheoryPractical] = useState('T');
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/reports/available-subjects`, {
          headers: authHeaders(),
        });
        setSubjects(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.session.toLowerCase().includes(q) ||
      String(s.semester).includes(q)
    );
  });

  const add = async () => {
    if (!selectedId) return;
    setAdding(true);
    setError('');
    try {
      await axios.post(
        `${API_BASE}/api/reports/semesters/${semesterId}/subjects`,
        {
          subjectId: selectedId,
          category: category.trim() || null,
          theoryPractical,
        },
        { headers: authHeaders() }
      );
      onAdded();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to add subject');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold dark:text-white">Add Subject from Saved PO</h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
            <X className="dark:text-white" size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by code, name, session, semester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[240px] border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-white dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No subjects match.</p>
          ) : (
            <div className="border border-neutral-300 dark:border-neutral-700 rounded max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F5] dark:bg-neutral-800 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left dark:text-white">Code</th>
                    <th className="px-2 py-2 text-left dark:text-white">Name</th>
                    <th className="px-2 py-2 text-left dark:text-white">Sem</th>
                    <th className="px-2 py-2 text-left dark:text-white">Session</th>
                    <th className="px-2 py-2 text-left dark:text-white">PO Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => s.hasSnapshot && setSelectedId(s.id)}
                      className={`cursor-pointer border-t border-neutral-200 dark:border-neutral-700 ${
                        selectedId === s.id
                          ? 'bg-violet-100 dark:bg-violet-900/30'
                          : s.hasSnapshot
                          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <td className="px-2 py-2 dark:text-white whitespace-nowrap">{s.code}</td>
                      <td className="px-2 py-2 dark:text-white">{s.name}</td>
                      <td className="px-2 py-2 dark:text-white">{s.semester}</td>
                      <td className="px-2 py-2 dark:text-white">{s.session}</td>
                      <td className="px-2 py-2 text-xs">
                        {s.hasSnapshot ? (
                          <span className="text-green-600 dark:text-green-400">
                            Committed {new Date(s.snapshotUpdatedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Not committed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm dark:text-white">
              Category (optional)
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. PC-1, PLC-1, BSC-3"
                className="mt-1 w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-white dark:bg-neutral-800"
              />
            </label>
            <label className="text-sm dark:text-white">
              Theory / Practical
              <select
                value={theoryPractical}
                onChange={(e) => setTheoryPractical(e.target.value)}
                className="mt-1 w-full border border-neutral-300 dark:border-neutral-700 rounded px-3 py-2 bg-white dark:bg-neutral-800"
              >
                <option value="T">T</option>
                <option value="P">P</option>
                <option value="T+P">T+P</option>
              </select>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-5 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={add}
            disabled={!selectedId || adding}
            className="px-4 py-2 text-white rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Subject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubjectModal;
