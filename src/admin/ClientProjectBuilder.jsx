import { useEffect, useRef } from 'react';
import ProjectBuilder from './ProjectBuilder';

// ProjectBuilder is shared by owner/client/share contexts. Until its internal
// permission matrix is fully centralized, this adapter guarantees that the
// client workspace never exposes platform-level access-link management.
export default function ClientProjectBuilder(props) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const sync = () => {
      const tabs = root.querySelectorAll('.workspaceTabs > button');
      tabs.forEach((button) => {
        const label = button.textContent?.trim().toLowerCase();
        const restricted = label === 'acceso cliente';
        button.hidden = restricted;
        button.setAttribute('aria-hidden', restricted ? 'true' : 'false');
        if (restricted) button.tabIndex = -1;
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} data-project-role="client">
      <ProjectBuilder {...props} role="client" />
    </div>
  );
}
