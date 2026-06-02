import { useState, useEffect } from "react";
import axios from 'axios';

const API_URI = import.meta.env.VITE_API_URL;

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    const filteredJobs = jobs.filter(
        (job) => {
            const matchesSearch = (job.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            || (job.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesLocation = (job.location?.toLowerCase() || '').includes(locationFilter.toLowerCase());

            return matchesSearch && matchesLocation;
        }
    ); 

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URI}/api/job-posting`);
            setJobs(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching job data:", err);
            setLoading(false);
        }
    };

    const handleSaveJob = async (job) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please log in to save jobs to your tracker.");
                return;
            }

            const applicationData = {
                companyName: job.companyName,
                role: job.role,
                status: 'Applied', 
            };

            await axios.post(`${API_URI}/api/applications`, applicationData, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert(`Moved ${job.role} at ${job.companyName} directly into your application tracking system.`);
            
        } catch (err) {
            console.error("Failed to bridge job to application tracker:", err);
            alert("Could not process application storage. Review server console logs.");
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    if(loading){
        return (
            <div style={{padding : '20px'}}>Loading production job ledger...</div>
        );
    }

    return (
        <div className='dashboard-container' style={{padding : '20px', fontFamily : 'sans-serif'}}>
            <header style={{borderBottom : '2px solid #eee', paddingBottom : '10px', marginBottom : '20px'}}>
                <h1>Software Engineering Job Board</h1>
                <p>Live off-campus opportunities for developers</p>
            </header>

            {/* Live UI State Filters */}
            <div className='filter-section' style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', 
        borderRadius: '8px', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                <p style={{ margin: 'auto 0', fontWeight: 'bold' }}>Filters</p>
                <input type="text" placeholder="search role or company" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{padding: '8px', flex: 1, minWidth: '200px', border: '1px solid #ccc', borderRadius: '4px'}}/>
                <input type="text" placeholder="search location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{padding: '8px', flex: 1, minWidth: '200px', border: '1px solid #ccc', borderRadius: '4px'}}/>
            </div>

            {/* Infinite-capable data grid output */}
            <div className='job-grid' style={{display : 'grid', gap : '15px'}}>
                {
                    filteredJobs.length === 0 ?
                    (<p> No jobs found matching your criteria.</p>):
                    (filteredJobs.map((job, index) => (
                        <div key={job._id || index} style={{border : '1px solid #ccc', padding : '15px', borderRadius : '5px', display: 'flex', flexDirection: 'column', gap: '5px'}}> 
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{job.companyName}</h3>
                            <p style={{ margin: 0 }}><strong>Role: </strong>{job.role}</p>
                            <p style={{ margin: 0 }}><strong>Location: </strong> {job.location || 'Remote / India'}</p>
                            <p style={{ margin: 0 }}><strong>Salary: </strong> {job.salaryRaw || 'Not specified'}</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                                <a 
                                    href={job.applyLink} target="_blank" rel="noreferrer"
                                    style={{display : 'inline-block', padding : '8px 15px', backgroundColor : '#007bff', color: "#fff", textDecoration : 'none', borderRadius: '4px', fontWeight: 'bold'}}
                                >
                                    Apply via Portal
                                </a>

                                <button 
                                    onClick={() => handleSaveJob(job)}
                                    style={{ padding: '8px 15px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Save to Tracker
                                </button>
                            </div>
                        </div>
                    )))
                }
            </div>
        </div>
    );
};

export default Dashboard;