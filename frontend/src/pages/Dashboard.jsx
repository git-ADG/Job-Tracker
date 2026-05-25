
const Dashboard = () => {
    return (
        <div className='dashboard-container' style={{padding : '20px', fontFamily : 'sans-serif'}}>
            <header style={{borderBottom : '2px solid #eee', paddingBottom : '10px', marginBottom : '20px'}}>
                <h1>Software Engineering Job Board</h1>
                <p>Live off-campus opportunities for developers</p>
            </header>
            {/* Filter section */}
            <div className='filter-section' style={{marginBottom : '20px', padding : '10px', backgroundColor : '#f9f9f9'}}>
                <p>Filters (experience, location, salary)</p>
            </div>
            {/* job grid */}
            <div className='job-grid' style={{display : 'grid', gap : '15px'}}>
                <div style={{border : '1px solid #ccc', padding : '15px', borderRadius : '5px'}}>
                    <h3>Software Engineer</h3>
                    <p><strong>Company:</strong>Google</p>
                    <button style={{padding : '8px 15px', cursor : 'pointer'}}>Apply Now</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;