export default function PresenceList({ participants }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-bg-border">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Online ({participants.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {participants.length === 0 && (
          <p className="text-text-muted text-xs text-center mt-4">No one else here</p>
        )}
        {participants.map((p) => (
          <div key={p.user_id} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
            <span className="text-sm text-text-primary truncate">{p.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
