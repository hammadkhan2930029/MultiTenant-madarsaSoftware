const Container = ({ children, className = '' }) => (
  <div className={`fw-container ${className}`}>{children}</div>
);

export default Container;
