// Full-height right-side slide-over (.drawer-backdrop / .drawer-panel from waby-loan.html).
export default function Drawer({ title, onClose, onSave, saving, error, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 drawer-backdrop" onClick={onClose}>
      <div
        className="drawer-panel p-6"
        style={{ maxWidth: wide ? 1024 : 560, background: 'var(--color-adm-surface)', color: 'var(--color-adm-text)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-2xl leading-none" style={{ color: 'var(--color-adm-text-dim)' }}>&times;</button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="flex items-center gap-3 mt-6 sticky bottom-0 py-4" style={{ background: 'var(--color-adm-surface)' }}>
          <button onClick={onClose} className="admin-btn-ghost h-11 px-5">Cancel</button>
          {onSave && (
            <button onClick={onSave} disabled={saving} className="admin-btn-primary h-11 px-5">
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {error && <span className="text-sm" style={{ color: 'var(--color-adm-danger)' }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}
