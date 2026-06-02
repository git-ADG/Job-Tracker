import { Navigate } from 'react-router-dom';

//navigate to login page if any protected page is accessed without token
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;