import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import authAPI, { adminAPI } from '../services/api';

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  const user = authAPI.getStoredUser();

  useEffect(() => {
    // redirect non-admins away
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    adminAPI
      .getUsers()
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users', err);
        setError(err.message || 'Unable to load');
        setLoading(false);
      });
  }, [navigate, user]);

  return (
    <>
      <Navbar showAuthButtons={false} showProfileIcon={true} mode="dashboard" />
      <main className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        {loading && <p>Loading users…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
