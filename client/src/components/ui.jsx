// Reusable stat card for dashboards (clean monochrome style)
export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-zinc-950 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-zinc-800" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-zinc-700">
          <span className="font-semibold">{trendUp ? '↑' : '↓'} {trend}</span>
          <span className="text-zinc-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

// Status badge component (clean monochrome)
export function StatusBadge({ status }) {
  const statusConfig = {
    active: 'bg-zinc-900 text-white border-zinc-900 font-medium',
    expired: 'bg-zinc-100 text-zinc-500 border-zinc-200 line-through',
    inactive: 'bg-zinc-100 text-zinc-500 border-zinc-200',
    pending: 'bg-zinc-100 text-zinc-900 border-zinc-300 font-medium',
    completed: 'bg-zinc-900 text-white border-zinc-900 font-medium',
    overdue: 'bg-white text-zinc-900 border-zinc-400 font-semibold',
    full: 'bg-zinc-800 text-zinc-100 border-zinc-800 font-medium',
    good: 'bg-zinc-900 text-white border-zinc-900 font-medium',
    partial: 'bg-zinc-100 text-zinc-800 border-zinc-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${statusConfig[status] || statusConfig.active}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active'}
    </span>
  );
}

// Section header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Search and filter bar
export function SearchBar({ placeholder, value, onChange, children }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={placeholder || 'Search...'}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        />
      </div>
      {children}
    </div>
  );
}

// Data table
export function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-slate-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-400">
          No records found
        </div>
      )}
    </div>
  );
}

// Modal dialog
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeMap[size]} max-h-[90vh] overflow-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Empty state
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-medium text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
