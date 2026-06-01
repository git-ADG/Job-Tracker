import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import KanbanBoard from "./KanbanBoard";

const API_URI = import.meta.env.VITE_API_URL;

const Tracker = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        companyName: '',
        role: '',
        status: 'Applied'
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            navigate('/login');
        }
    }, [navigate]);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await axios.get(`${API_URI}/api/applications`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setApplications(response.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
            }
        }
        fetchApplications();
    }, [token]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URI}/api/applications`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setApplications([response.data, ...applications]);
            setFormData({
                companyName: '',
                role: '',
                status: 'Applied'
            });
        } catch (err) {
            alert(`Failed to save: ${err.response?.data || err.message}`);
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete?")) return;
        try {
            await axios.delete(`${API_URI}/api/applications/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setApplications(applications.filter((app) => app._id !== id));
        } catch (err) {
            alert(`${err.response?.data || err.message}`);
        }
    }

    if (loading) {
        return (
            <div style={{ padding: '20px' }}>Loading your applications...</div>
        );
    }

    return (
        <div className='tracker-container' style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <header style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1>Applications Tracker</h1>
                <p>Manage and track off-campus job hunt</p>
            </header>

            <form onSubmit={handleSubmit}
                style={{ marginBottom: '30px', padding: '20px', borderRadius: '8px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}
            >
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Company Name</label>
                    <input type="text"
                        name="companyName" value={formData.companyName}
                        onChange={handleChange} required placeholder="eg Google"
                        style={{ width: '100%', borderRadius: '4px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role</label>
                    <input type="text"
                        name="role" value={formData.role}
                        onChange={handleChange} required placeholder="eg SWE"
                        style={{ width: '100%', borderRadius: '4px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ minWidth: '120px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
                    <select
                        name="status" value={formData.status}
                        onChange={handleChange} required
                        style={{ width: '100%', borderRadius: '4px', padding: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    >
                        <option value="Applied">Applied</option>
                        <option value="OA">OA</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Accepted">Accepted</option>
                    </select>
                </div>
                <button type="submit"
                    style={{ padding: '9px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Save Job
                </button>
            </form>

            <KanbanBoard applications={applications} setApplications={setApplications} handleDelete={handleDelete} />
        </div>
    );
};

export default Tracker;