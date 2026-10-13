import { useEffect, useState } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import Sidebar from './Sidebar';
import ResizeHandle from './ResizeHandle';
import MobileNavigation from './MobileNavigation';
import StatusDot from '../ui/StatusDot';
import { cn } from '../../utils/cn';

const WIDTH_KEY = 'studyvault.assistantWidth';
const DEFAULT_WIDTH = 440;
const MIN_WIDTH = 320;
// The assistant may take at most 70% of the window so the knowledge base always stays usable.
const maxWidth = () => Math.max(MIN_WIDTH, Math.round(window.innerWidth * 0.7));

function loadWidth() {
  try {
    const saved = Number(window.localStorage.getItem(WIDTH_KEY));
    if (Number.isFinite(saved) && saved >= MIN_WIDTH) return saved;
  } catch {
    // storage unavailable
  }
  return DEFAULT_WIDTH;
}

function ViewSwitch({ view, onViewChange }) {
  const options = [
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'assistant', label: 'Assistant' },
  ];
  return (
    <div className="flex rounded-lg border border-line bg-panel p-0.5" role="group" aria-label="Switch panel">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={view === o.id}
          onClick={() => onViewChange(o.id)}
          className={cn(
            'h-7 rounded-md px-3 text-xs font-medium transition-colors',
            view === o.id ? 'bg-elevated text-ink' : 'text-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AppLayout({
  view,
  onViewChange,
  collapsed,
  onToggleCollapsed,
  drawerOpen,
  onDrawerOpenChange,
  docCount,
  health,
  onOpenSettings,
  knowledge,
  assistant,
}) {
  const navProps = { view, onViewChange, docCount, health, onOpenSettings };
  const [assistantWidth, setAssistantWidth] = useState(loadWidth);

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDTH_KEY, String(assistantWidth));
    } catch {
      // storage unavailable
    }
  }, [assistantWidth]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg text-ink">
      <Sidebar collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} {...navProps} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Below xl only one panel fits, so a compact bar switches between them. */}
        <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-sidebar px-3 xl:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDrawerOpenChange(true)}
              aria-label="Open navigation"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-soft transition-colors hover:bg-elevated hover:text-ink lg:hidden"
            >
              <MenuIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold tracking-tight lg:hidden">StudyVault AI</span>
          </div>
          <div className="flex items-center gap-3">
            <ViewSwitch view={view} onViewChange={onViewChange} />
            <span title={`API ${health.status}`} className="lg:hidden">
              <StatusDot status={health.status} />
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <main
            className={cn(
              'min-w-0 flex-1 flex-col bg-bg',
              view === 'knowledge' ? 'flex' : 'hidden xl:flex',
            )}
          >
            {knowledge}
          </main>
          <ResizeHandle
            width={assistantWidth}
            min={MIN_WIDTH}
            max={maxWidth}
            defaultWidth={DEFAULT_WIDTH}
            onChange={setAssistantWidth}
          />
          <aside
            aria-label="AI Assistant"
            style={{ '--assistant-w': `${assistantWidth}px` }}
            className={cn(
              'min-w-0 flex-col border-l border-line bg-panel xl:min-w-[320px] xl:max-w-[70vw] xl:w-[var(--assistant-w)] xl:flex-none xl:border-l-0',
              view === 'assistant' ? 'flex flex-1' : 'hidden xl:flex',
            )}
          >
            {assistant}
          </aside>
        </div>
      </div>

      <MobileNavigation
        open={drawerOpen}
        onClose={() => onDrawerOpenChange(false)}
        {...navProps}
      />
    </div>
  );
}
