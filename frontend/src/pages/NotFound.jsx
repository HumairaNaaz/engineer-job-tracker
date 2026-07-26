import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="auth-page">
      <div className="notfound-box">
        <div className="notfound-code">404</div>
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist or was moved.</p>
        <Link to="/" className="notfound-link">← Back to dashboard</Link>
      </div>
    </div>
  );
}

export default NotFound;