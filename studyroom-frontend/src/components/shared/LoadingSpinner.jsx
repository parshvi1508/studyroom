export default function LoadingSpinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-4' : 'w-7 h-7 border-[3px]';
  return (
    <div
      className={`${sizeClass} rounded-full border-bg-border border-t-accent animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
