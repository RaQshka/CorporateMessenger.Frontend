import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getProfile } from '../services/api';

function PrivateRoute({ children }) {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      getProfile()
        .then(() => setIsValid(true))
        .catch(() => {
          localStorage.removeItem('token');
          setIsValid(false);
        });
    } else {
      setIsValid(false);
    }
  }, [token]);

  if (isValid === null) return null; // Ждем проверки
  return isValid ? children : <Navigate to="/login" />;
}

export default PrivateRoute;