import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ onReset }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleHomeClick = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <nav className="container mt-3">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-center flex-wrap">
            <Link 
              to="/" 
              className={`btn ${isActive('/') ? 'btn-primary' : 'btn-outline-primary'} mx-2 mb-2`}
              onClick={handleHomeClick}
            >
              📷 Analizar
            </Link>
            
            <Link 
              to="/history" 
              className={`btn ${isActive('/history') ? 'btn-primary' : 'btn-outline-primary'} mx-2 mb-2`}
            >
              📊 Historial
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;