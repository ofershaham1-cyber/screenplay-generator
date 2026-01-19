import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h2>Screenplay App</h2>
      </div>
      <ul className="sidebar-menu">
        <li className={location.pathname === '/' || location.pathname === '/generator' ? 'active' : ''}>
          <Link to="/generator">Generator</Link>
        </li>
        <li className={location.pathname === '/player' ? 'active' : ''}>
          <Link to="/player">Player</Link>
        </li>
        <li className={location.pathname === '/history' ? 'active' : ''}>
          <Link to="/history">History</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;