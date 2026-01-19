import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ theme, updateTheme }) => {
  const location = useLocation();

  const handleThemeChange = (newTheme) => {
    updateTheme(newTheme);
  };

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
      <div className="sidebar-footer">
        <div className="theme-section">
          <label className="theme-label">Theme</label>
          <select 
            value={theme} 
            onChange={(e) => handleThemeChange(e.target.value)}
            className="theme-select-sidebar"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="dark-blue">Dark Blue</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;