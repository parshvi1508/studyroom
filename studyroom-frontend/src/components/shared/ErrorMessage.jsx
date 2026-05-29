export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="rounded bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}
