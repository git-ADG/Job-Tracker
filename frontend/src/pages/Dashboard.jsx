import { useState, useEffect } from "react";
import axios from 'axios';
const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    const filteredJobs = jobs.filter(
        (job) => {
            const matchesSearch = (job.employer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            || (job.job_title?.toLowerCase() || '').includes(searchTerm.toLowerCase());

            const matchesLocation = (job.job_country?.toLowerCase() || '').includes(locationFilter.toLowerCase()) || (job.job_city?.toLowerCase() || '').includes(locationFilter.toLowerCase());

            return matchesSearch && matchesLocation;
        }
    ); 

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchJobs(nextPage);
    }
    const fetchJobs = async (pageNumber) => {
        try {
        const response = await axios.get(`http://localhost:5000/api/jobs/search?page=${pageNumber}`);
        
        if (pageNumber === 1) {
            setJobs(response.data);
        } else {
            setJobs((prevJobs) => [...prevJobs, ...response.data]);
        }
        
        setLoading(false);
        } catch (err) {
        console.error(err);
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs(1);
    }, []);
    if(loading){
        return (
            <div style={{padding : '20px'}}>loading tech roles</div>
        );
    }
    return (
        <div className='dashboard-container' style={{padding : '20px', fontFamily : 'sans-serif'}}>
            <header style={{borderBottom : '2px solid #eee', paddingBottom : '10px', marginBottom : '20px'}}>
                <h1>Software Engineering Job Board</h1>
                <p>Live off-campus opportunities for developers</p>
            </header>
            {/* Filter section */}
            <div className='filter-section' style={{marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', 
        borderRadius: '8px', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                <p>Filters</p>
                <input type="text" placeholder="search role or company" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{padding: '8px', flex: 1, minWidth: '200px'}}/>
                <input type="text" placeholder="search location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{padding: '8px', flex: 1, minWidth: '200px'}}/>
            </div>
            {/* job grid */}
            <div className='job-grid' style={{display : 'grid', gap : '15px'}}>
                {
                    filteredJobs.length === 0 ?
                    (<p> No jobs found matching your criteria</p>):
                    (filteredJobs.map((job, index) => (
                        <div key={index} style={{border : '1px solid #ccc', padding : '15px', borderRadius : '5px'}}> 
                            <h3>{job.employer_name}</h3>
                            <p><strong>Role:</strong>{job.job_title}</p>
                            <p><strong>Location:</strong> {job.job_city || 'Remote'}, {job.job_country}</p>
                            <p><strong>Salary</strong> {job.job_salary || 'Not specified'}</p>
                            {/* <p><strong>Job description:</strong>{job.job_description}</p> */}
                            <a 
                            href= {job.job_apply_link} target="_blank" rel="noreferrer"
                                style={{display : 'inline-block', marginTop: '10px', padding : '8px 15px', backgroundColor : '#007bff', color: "#fff", textDecoration : 'none', borderRadius: '4px'}}
                            >
                                Apply via
                            </a>
                        </div>
                    )))
                }
                {
                    filteredJobs.length > 0 && !loading && (
                        <div style={{textAlign : 'center', marginTop: '30px'}}> 
                            <button
                                onClick={handleLoadMore}
                                style={{
                                    padding : '10px 25px',
                                    fontSize : '16px',
                                    cursor : 'pointer',
                                    backgroundColor : '#28a745',
                                    color: 'white',
                                    border : 'none',
                                    borderRadius : '5px'
                                }}
                            >
                                Load more jobs
                            </button>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Dashboard;