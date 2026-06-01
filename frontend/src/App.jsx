import {BrowserRouter, Routes, Route, Link, useNavigate} from 'react-router-dom';
import ProtectedRoute from './components/protectedRoutes';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Register from './pages/Register';
import Login from './pages/Login';
// import KanbanBoard from './pages/KanbanBoard';

const Navigation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <nav style={{padding : '15px 20px', backgroundColor : '#333', color : 'white', display : 'flex', justifyContent : 'space-between'}}>
      <div style={{display : 'flex', gap: '20px'}}>
        <Link to= "/" style={{color : 'white', textDecoration : 'none', fontWeight : 'bold'}}>Job Board</Link>
        {token && <Link to= "/tracker" style={{color : 'white', textDecoration: 'none', fontWeight : 'bold'}}>Applications</Link>}
        {/* {token && <Link to= "/tracking-board" style={{color : 'white', textDecoration: 'none', fontWeight : 'bold'}}>Applications Board</Link>} */}
      </div>
      {token ? (
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '5px 10px', cursor: 'pointer' }}>Logout</button>
        ) : (
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
          </div>
        )}
    </nav>
  );
}

const App = () => {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path='/' element = { <Dashboard /> } />
        <Route path='/tracker' element = { 
          <ProtectedRoute>
            <Tracker />
          </ProtectedRoute>
         } />
        <Route path='/register' element = { <Register /> } />
        <Route path='/login' element = { <Login /> } />
        {/* <Route path='/tracking-board' element = { <KanbanBoard /> } /> */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;