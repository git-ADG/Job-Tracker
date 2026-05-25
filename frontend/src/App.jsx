import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element = { <Dashboard /> } />
        <Route path='/tracker' element = { <div>Application tracker page coming soon</div> } />
        <Route path='/login' element = { <div> login page coming soon </div> } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;