export default function Drawer({ title, onClose, onSave, saving, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className={`admin-card h-full overflow-auto p-6 ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}
        style={{ borderRadius: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--color-adm-text-dim)' }}>&times;</button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="flex gap-3 mt-6 sticky bottom-0 pt-4" style={{ background: 'var(--color-adm-surface)' }}>
          <button onClick={onClose} className="admin-btn-ghost h-11 px-5">Cancel</button>
          {onSave && (
            <button onClick={onSave} disabled={saving} className="admin-btn-primary h-11 px-5">
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
