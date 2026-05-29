export default function PresenceList({ participants }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-bg-border">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold text-text-primary uppercase tracking-widest">
            Online
          </h2>
          <span className="text-[10px] font-semibold bg-accent/15 text-accent px-2 py-0.5 rounded-full">
            {participants.length}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5">
        {participants.length === 0 && (
          <p className="text-text-muted text-xs text-center mt-4">No one else here</p>
        )}
        {participants.map((p) => (
          <div
            key={p.user_id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-bg-elevated transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-accent uppercase">
                {p.display_name?.[0] ?? '?'}
              </span>
            </div>
            <span className="text-sm text-text-primary truncate flex-1">{p.display_name}</span>
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
