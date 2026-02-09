import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ theme, updateTheme, historyCount = 0 }) => {
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
        <li className={location.pathname === '/requests' ? 'active' : ''}>
          <Link to="/requests">📋 Requests</Link>
        </li>
        <li className={location.pathname === '/player' ? 'active' : ''}>
          <Link to="/player">Player</Link>
        </li>
        <li className={location.pathname === '/screenplay-result' ? 'active' : ''}>
          <Link to="/screenplay-result">📄 Result</Link>
        </li>
        <li className={location.pathname === '/history' ? 'active' : ''}>
          <Link to="/history">
            History
            {historyCount > 0 && (
              <span className="history-badge">{historyCount}</span>
            )}
          </Link>
        </li>
        <li className={location.pathname === '/preferences' ? 'active' : ''}>
          <Link to="/preferences">⚙️ Preferences</Link>
        </li>
        <li className={location.pathname === '/format-schema' ? 'active' : ''}>
          <Link to="/format-schema">📋 Format Schema</Link>
        </li>
        <li className={location.pathname === '/view-models' ? 'active' : ''}>
          <Link to="/view-models">🔧 View Models</Link>
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
