export default function Button({ children, onClick, full = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`${
        full ? 'w-full' : ''
      } px-4 py-2 rounded-md font-semibold shadow ${className}`}
    >
      {children}
    </button>
  );
}