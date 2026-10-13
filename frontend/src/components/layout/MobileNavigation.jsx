import Dialog from '../ui/Dialog';
import { SidebarContent } from './Sidebar';

export default function MobileNavigation({ open, onClose, onViewChange, onOpenSettings, ...rest }) {
  return (
    <Dialog open={open} onClose={onClose} placement="left" hideHeader title="Navigation">
      <SidebarContent
        {...rest}
        collapsed={false}
        onViewChange={(view) => {
          onViewChange(view);
          onClose();
        }}
        onOpenSettings={() => {
          onClose();
          onOpenSettings();
        }}
      />
    </Dialog>
  );
}
