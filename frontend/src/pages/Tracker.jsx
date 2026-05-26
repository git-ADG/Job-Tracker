import { useState, useEffect } from "react";
import axios from "axios";

const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMTFiNWExZWEyMmMwY2NhZjRhYWYwZCIsImlhdCI6MTc3OTc4Nzc0OCwiZXhwIjoxNzgyMzc5NzQ4fQ.IV-9aO2PFjoFjs5oYg182jm5YOEFtVuwaODVQBbOI-0";

const Tracker = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
       companyName : '',
       role : '',
       status : 'Applied' 
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name] : e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const response = await axios.post("http://localhost:5000/api/applications", formData,
                {
                    headers: {
                        Authorization : `Bearer ${TEST_TOKEN}`
                    }
                }
            );
            setApplications([response.data, ...applications]);
            setFormData({
                companyName: '',
                role : '',
                status : 'Applied'
            });
        }catch(err){
            console.error("Backend Error Details:", err.response?.data);
            alert(`Failed to save: ${err.response?.data?.details || err.message}`);
        }
    }

    const handleStatusChange = async (id, newStatus) => {
        try{
            await axios.put(`http://localhost:5000/api/applications/${id}`, {status: newStatus},
                {
                    headers : {
                        Authorization : `Bearer ${TEST_TOKEN}`
                    }
                }
            );
            setApplications(applications.map(app => app._id === id ? {...app, status : newStatus} : app));
        }catch(err){
            console.error(err);
            alert(`${err.response?.data || err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("are you sure you want to delete")) return;
        try{
            await axios.delete(`http://localhost:5000/api/applications/${id}`, {headers: {
                Authorization : `Bearer ${TEST_TOKEN}`
            }});
            setApplications(applications.filter((app) => app._id != id));
        }catch(err){
            console.error(err);
            alert(`${err.response?.data || err.message}`);
        }
    }

    useEffect(
        () =>{
            const fetchApplications = async() => {
                try{
                    const response = await axios.get("http://localhost:5000/api/applications", {
                        headers: {
                            Authorization : `Bearer ${TEST_TOKEN}`
                        }
                    });
                    setApplications(response.data);
                    setLoading(false);
                }catch(err){
                    console.log(err);
                    setLoading(false);
                }
            }
            fetchApplications();
        }, []
    );
    if(loading){
        return (
            <div style={{padding : '20px'}}>loading your applications</div>
        );
    }
    return (
        <div className='tracker-container' style={{padding : '20px', fontFamily : 'sans-serif'}}>
            <header style={{borderBottom : '2px solid #eee', paddingBottom : '10px', marginBottom : '20px'}}>
                <h1>Applications Tracker</h1>
                <p>Manage and track off-campus job hunt</p>
            </header>
            {/* form section */}
            <form onSubmit={handleSubmit}
                style={{marginBottom : '30px', padding : '20px', borderRadius : '8px', backgroundColor : '#f8f9fa', border : '1px solid #dee2e6', display : 'flex', gap : '15px', flexWrap : 'wrap', alignItems : 'flex-end'}}   
            >
                <div style={{flex : 1, minWidth: '200px'}}>
                    <label style={{display : 'block', marginBottom: '5px', fontWeight : 'bold'}}>Company Name</label>
                    <input type="text"
                    name="companyName" value={formData.companyName}
                    onChange={handleChange} required placeholder="eg Google"
                    style={{width : '100%', borderRadius : '4px', padding : '8px', border : '1px solid #ccc'}}
                    />
                </div>
                <div style={{flex : 1, minWidth: '200px'}}>
                    <label style={{display : 'block', marginBottom: '5px', fontWeight : 'bold'}}>Role</label>
                    <input type="text"
                    name="role" value={formData.role}
                    onChange={handleChange} required placeholder="eg SWE"
                    style={{width : '100%', borderRadius : '4px', padding : '8px', border : '1px solid #ccc'}}
                    />
                </div>
                <div style={{minWidth: '150px'}}>
                    <label style={{display : 'block', marginBottom: '5px', fontWeight : 'bold'}}>Status</label>
                    <select
                    name="status" value={formData.status}
                    onChange={handleChange} required
                    style={{width : '100%', borderRadius : '4px', padding : '8px', border : '1px solid #ccc'}}
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
                style={{padding: '9px 20px', backgroundColor: '#007bff', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Save Job
                </button>
            </form>
                
            {/* job grid */}
            <div className='applications-grid' style={{display : 'grid', gap : '15px'}}>
                {
                    applications.length === 0 ?
                    (<p> No applications found</p>):
                    (applications.map((application) => (
                        <div key={application._id} style={{border : '1px solid #ccc', padding : '15px', borderRadius : '5px'}}> 
                            <div>
                                <h3 style={{ marginTop: 0 }}>{application.companyName}</h3>
                                <p><strong>Role:</strong> {application.role}</p>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                
                {/* The Update Dropdown */}
                <select 
                  value={application.status}
                  onChange={(e) => handleStatusChange(application._id, e.target.value)}
                  style={{
                    padding: '5px', borderRadius: '4px', border: '1px solid #ccc',
                    backgroundColor: 
                      application.status === 'Applied' ? '#fff3cd' : 
                      application.status === 'Rejected' ? '#f8d7da' : 
                      application.status === 'Offer' || application.status === 'Accepted' ? '#d4edda' : '#e2e3e5'
                  }}
                >
                        <option value="Applied">Applied</option>
                        <option value="OA">OA</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Accepted">Accepted</option>
                </select>

                {/* The Delete Button */}
                <button 
                  onClick={() => handleDelete(application._id)}
                  style={{
                    padding: '5px 10px', backgroundColor: '#dc3545', color: 'white',
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                  }}
                >
                  Delete
                </button>

                </div>
            </div>
                    )))
                }
            </div>
        </div>
    );
};

export default Tracker;