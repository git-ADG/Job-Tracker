import {BrowserRouter, Routes, Route, Link} from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';

const App = () => {
  return (
    <BrowserRouter>
    <nav style={{padding : '15px 20px', backgroundColor : '#333', gap : '20px', color : 'white', display : 'flex'}}>
      <Link to= "/" style={{color : 'white', textDecoration : 'none', fontWeight : 'bold'}}>Job Board</Link>
      <Link to= "/tracker" style={{color : 'white', textDecoration: 'none', fontWeight : 'bold'}}>Applications</Link>
    </nav>
      <Routes>
        <Route path='/' element = { <Dashboard /> } />
        <Route path='/tracker' element = { <Tracker /> } />
        <Route path='/login' element = { <div> login page coming soon </div> } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;