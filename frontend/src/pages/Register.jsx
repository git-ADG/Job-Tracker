import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API_URI = import.meta.env.VITE_API_URL;

const Register = () => {
    const [formData, setFormData] = useState({username : '', email : '', password : ''});
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name] : e.target.value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await axios.post(`${API_URI}/api/users/register`, formData);
            localStorage.setItem('token', response.data.token);
            navigate('/tracker');
        }catch(err){
            setError(err.response?.data || 'registration failed');
        }
    };
    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Create an Account</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
            type="text" name="username" placeholder="username" 
            onChange={handleChange} required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input 
            type="email" name="email" placeholder="Email Address" 
            onChange={handleChange} required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input 
            type="password" name="password" placeholder="Password" 
            onChange={handleChange} required 
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sign Up
            </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px' }}>
            Already have an account? <Link to="/login">Log in here</Link>
        </p>
        </div>
    );
};

export default Register;