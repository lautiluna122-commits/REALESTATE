import { createRoot } from 'react-dom/client';
import ContactForm from './components/ContactForm';
import { getProjectById } from './platform/projectRegistry';

const project = getProjectById();

function mountContactForm() {
  const footer = document.querySelector('.v4 .footer');
  if (!footer || footer.querySelector('[data-contact-form-host]')) return Boolean(footer);

  const host = document.createElement('div');
  host.dataset.contactFormHost = 'true';
  host.style.marginTop = '28px';
  host.style.minWidth = 'min(100%, 320px)';
  footer.appendChild(host);

  createRoot(host).render(<ContactForm projectId={project.id} />);
  return true;
}

if (!mountContactForm()) {
  const observer = new MutationObserver(() => {
    if (mountContactForm()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
