import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Book } from 'lucide-react';
import { API_BASE } from '../../../../lib/api';

const Loading = () => (
  <div className="flex justify-center items-center h-screen text-black dark:text-white">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black dark:border-white"></div>
  </div>
);

const CourseManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [creating, setCreating] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/subjects/subjects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSubjects(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch subjects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/subjects/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConfirmDelete(null);
      await fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete subject');
      console.error(err);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full md:mr-16 pb-16">
      <div className="flex justify-between mb-4">
        <p className="text-4xl font-semibold md:m-10 m-5">Course Management</p>
        <button
          onClick={() => setCreating(true)}
          className="md:m-10 mt-5 mr-5 px-4 py-2 text-white border-2 border-neutral-200 dark:border-neutral-700 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 transition-colors duration-800"
        >
          Create New Course
        </button>
      </div>

      {error && <div className="text-red-500 mx-5 md:mx-10 mb-4">{error}</div>}

      <div className="md:mx-10 mx-5 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-left">
          <thead className="bg-neutral-100 dark:bg-neutral-900 text-sm uppercase text-neutral-600 dark:text-neutral-300">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-950">
            {subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No courses found.
                </td>
              </tr>
            )}
            {subjects.map((sub) => (
              <tr key={sub.id} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="px-4 py-3 flex items-center gap-2">
                  <Book className="h-5 w-5 text-violet-600" />
                  <span className="font-medium">{sub.name}</span>
                </td>
                <td className="px-4 py-3">{sub.code}</td>
                <td className="px-4 py-3">{sub.session}</td>
                <td className="px-4 py-3">{sub.semester}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(sub)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-colors"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(sub)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <EditSubject
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await fetchSubjects();
          }}
        />
      )}

      {editing && (
        <EditSubject
          subject={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await fetchSubjects();
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Course"
          message={`Are you sure you want to delete "${confirmDelete.name}" (${confirmDelete.code})? This will also remove all related sheets, CO/PO data and report links. This action cannot be undone.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}
    </div>
  );
};

const EditSubject = ({ subject, onClose, onSaved }) => {
  const isEdit = !!subject;
  const [formData, setFormData] = useState({
    name: subject?.name || '',
    code: subject?.code || '',
    session: subject?.session || '',
    semester: subject ? String(subject.semester ?? '') : '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    const payload = {
      name: formData.name,
      code: formData.code,
      session: formData.session,
      semester: parseInt(formData.semester, 10),
    };
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
    try {
      if (isEdit) {
        await axios.put(`${API_BASE}/api/subjects/${subject.id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE}/api/subjects/newsubject`, payload, { headers });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || (isEdit ? 'Failed to update subject' : 'Failed to create subject'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 h-full w-full flex items-center justify-center z-50 poppins-regular backdrop-brightness-50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-11/12 md:w-1/3 mx-auto bg-white dark:bg-neutral-950 rounded-xl p-6 border-2 border-neutral-300 dark:border-neutral-700"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{isEdit ? 'Edit Course' : 'Create New Course'}</h3>
          <button type="button" onClick={onClose} className="cursor-pointer">❌</button>
        </div>

        <div className="space-y-4">
          <FloatingInput label="Subject Name" name="name" value={formData.name} onChange={handleChange} required />
          <FloatingInput label="Subject Code" name="code" value={formData.code} onChange={handleChange} required />
          <FloatingInput label="Session (e.g. 2025-26)" name="session" value={formData.session} onChange={handleChange} required />
          <FloatingInput label="Semester (1-8)" name="semester" type="number" min="1" max="8" value={formData.semester} onChange={handleChange} required />
        </div>

        {error && <div className="text-red-500 mt-3">{error}</div>}

        <button
          type="submit"
          disabled={submitting || formData.code.includes('/')}
          className="mt-5 text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-60 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-lg w-full px-5 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
        </button>
      </form>
    </div>
  );
};

const FloatingInput = ({ label, name, value, onChange, type = 'text', ...rest }) => (
  <div className="relative z-0 w-full group">
    <input
      type={type}
      name={name}
      id={`edit_${name}`}
      className="block py-2.5 px-0 w-full text-lg text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-purple-500 focus:outline-none focus:ring-0 focus:border-purple-600 peer"
      placeholder=" "
      value={value}
      onChange={onChange}
      {...rest}
    />
    <label
      htmlFor={`edit_${name}`}
      className="peer-focus:font-medium absolute text-lg text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-purple-600 peer-focus:dark:text-purple-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
    >
      {label}
    </label>
  </div>
);

const ConfirmDialog = ({ title, message, onCancel, onConfirm }) => (
  <div className="fixed inset-0 h-full w-full flex items-center justify-center z-50 backdrop-brightness-50 backdrop-blur-sm">
    <div className="max-w-md w-11/12 mx-auto bg-white dark:bg-neutral-950 rounded-xl p-6 border-2 border-neutral-300 dark:border-neutral-700">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-300 mb-5">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default CourseManagement;
