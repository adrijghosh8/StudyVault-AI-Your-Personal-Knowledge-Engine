import { useCallback, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { ToastProvider } from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';
import AppLayout from './components/layout/AppLayout';
import SettingsDialog from './components/layout/SettingsDialog';
import KnowledgeBase from './components/knowledge/KnowledgeBase';
import AssistantPanel from './components/assistant/AssistantPanel';
import { useHealthCheck } from './hooks/useHealthCheck';
import { useDocuments } from './hooks/useDocuments';
import { pluralize } from './utils/format';

function Workspace() {
  const health = useHealthCheck();
  const docs = useDocuments();

  const [view, setView] = useState('knowledge');
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);

  const changeView = useCallback((next) => {
    setView(next);
    if (next === 'assistant') setFocusSignal((n) => n + 1);
  }, []);

  const requestDeleteAll = useCallback(() => {
    setSettingsOpen(false);
    setConfirmDeleteAll(true);
  }, []);

  const runDeleteAll = async () => {
    const ok = await docs.removeAll();
    if (ok) setConfirmDeleteAll(false);
  };

  const count = docs.documents.length;

  return (
    <>
      <AppLayout
        view={view}
        onViewChange={changeView}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        drawerOpen={drawerOpen}
        onDrawerOpenChange={setDrawerOpen}
        docCount={count}
        health={health}
        onOpenSettings={() => setSettingsOpen(true)}
        knowledge={
          <KnowledgeBase
            docs={docs}
            clearsOnShutdown={health.clearsOnShutdown}
            onRequestDeleteAll={requestDeleteAll}
          />
        }
        assistant={
          <AssistantPanel
            health={health}
            docCount={count}
            docsLoaded={docs.status === 'ready'}
            focusSignal={focusSignal}
            onGoToKnowledge={() => changeView('knowledge')}
          />
        }
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        health={health}
        documentCount={count}
        onDeleteAll={requestDeleteAll}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title="Delete all documents?"
        description={`This permanently deletes all indexed documents${
          count ? ` (${pluralize(count, 'document')})` : ''
        } and every uploaded file from the backend. The assistant will have nothing to answer from until you upload again. This can’t be undone.`}
        confirmLabel="Delete everything"
        requireText="DELETE"
        loading={docs.deletingAll}
        onConfirm={runDeleteAll}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Workspace />
      </ToastProvider>
    </MotionConfig>
  );
}
