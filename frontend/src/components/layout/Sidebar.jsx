import { motion } from 'framer-motion';
import { Database, Library, PanelLeftClose, PanelLeftOpen, Settings, Sparkles } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import StatusDot, { STATUS_LABELS } from '../ui/StatusDot';
import { cn } from '../../utils/cn';

function NavItem({ label, icon: Icon, active, collapsed, badge, onClick }) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        'group flex h-9 w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors',
        collapsed ? 'justify-center' : 'px-2.5',
        active ? 'bg-accent text-white' : 'text-soft hover:bg-elevated hover:text-ink',
      )}
    >
      <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && badge > 0 && (
        <span
          className={cn(
            'rounded-md px-1.5 text-[11px] tabular-nums',
            active ? 'bg-white/20 text-white' : 'bg-elevated text-mute',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
  return collapsed ? <Tooltip label={label}>{button}</Tooltip> : button;
}

/** Shared by the desktop sidebar and the mobile drawer. */
export function SidebarContent({
  collapsed = false,
  view,
  onViewChange,
  docCount,
  health,
  onOpenSettings,
  onToggleCollapsed,
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-14 shrink-0 items-center gap-2.5', collapsed ? 'justify-center' : 'px-4')}>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-bg" aria-hidden="true">
          <Library className="h-4 w-4" />
        </span>
        {!collapsed && <span className="truncate text-sm font-semibold tracking-tight">StudyVault AI</span>}
      </div>

      <nav aria-label="Workspace" className={cn('flex flex-col gap-1', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && (
          <p className="px-2.5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-mute">Workspace</p>
        )}
        <NavItem
          label="Knowledge Base"
          icon={Database}
          active={view === 'knowledge'}
          collapsed={collapsed}
          badge={docCount}
          onClick={() => onViewChange('knowledge')}
        />
        <NavItem
          label="AI Assistant"
          icon={Sparkles}
          active={view === 'assistant'}
          collapsed={collapsed}
          onClick={() => onViewChange('assistant')}
        />
      </nav>

      <div className={cn('mt-auto flex flex-col gap-1 border-t border-line py-3', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <Tooltip label={`API ${STATUS_LABELS[health.status].toLowerCase()}`}>
            <div className="flex h-8 w-full items-center justify-center" role="status" aria-label={`API ${STATUS_LABELS[health.status]}`}>
              <StatusDot status={health.status} />
            </div>
          </Tooltip>
        ) : (
          <div className="flex h-8 items-center gap-2.5 px-2.5 text-xs text-soft" role="status">
            <StatusDot status={health.status} />
            <span className="truncate">API {STATUS_LABELS[health.status].toLowerCase()}</span>
          </div>
        )}
        <NavItem label="Settings" icon={Settings} collapsed={collapsed} onClick={onOpenSettings} />
        {onToggleCollapsed && (
          <NavItem
            label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            collapsed={collapsed}
            onClick={onToggleCollapsed}
          />
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, ...rest }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 232 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="hidden shrink-0 border-r border-line bg-sidebar lg:block"
    >
      <SidebarContent collapsed={collapsed} {...rest} />
    </motion.aside>
  );
}
