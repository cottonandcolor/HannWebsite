const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.path-card').forEach(card => {
  card.addEventListener('click', () => {
    const inquiry = card.dataset.inquiry;
    const select = document.querySelector('#inquiry-select');
    if (select && inquiry) select.value = inquiry;
  });
});

const filterButtons = document.querySelectorAll('.filter-button');
const propertyCards = document.querySelectorAll('.property-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    propertyCards.forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  });
});

const modal = document.querySelector('#property-modal');
const modalTitle = document.querySelector('#modal-title');
const modalSubtitle = document.querySelector('#modal-subtitle');
const modalDetails = document.querySelector('#modal-details');
const modalContact = document.querySelector('#modal-contact');

document.querySelectorAll('.property-link').forEach(button => {
  button.addEventListener('click', () => {
    modalTitle.textContent = button.dataset.title || 'Property overview';
    modalSubtitle.textContent = button.dataset.subtitle || 'Property';
    modalDetails.textContent = button.dataset.details || '';
    modalContact.dataset.property = button.dataset.title || 'Property';
    document.body.classList.add('modal-open');
    modal.showModal();
  });
});

document.querySelector('.modal-close')?.addEventListener('click', () => {
  modal.close();
});

modal?.addEventListener('click', event => {
  const rect = modal.getBoundingClientRect();
  const clickedOutside =
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;
  if (clickedOutside) modal.close();
});

modal?.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
});

modalContact?.addEventListener('click', () => {
  const property = modalContact.dataset.property;
  const select = document.querySelector('#inquiry-select');
  const message = document.querySelector('textarea[name="message"]');
  if (select) select.value = property?.toLowerCase().includes('acres') ? 'Land and acreage' : 'Buying a home';
  if (message) message.value = `I would like more information about ${property}.`;
  modal.close();
});

document.querySelectorAll('.resource-request').forEach(button => {
  button.addEventListener('click', () => {
    const resource = button.dataset.resource || 'real estate guide';
    const subject = encodeURIComponent(`Request: ${resource}`);
    const body = encodeURIComponent(`Hi Hannah,\n\nI would like to request the ${resource}.\n\nThank you.`);
    window.location.href = `mailto:hannah@fullcircle-realestate.com?subject=${subject}&body=${body}`;
  });
});

document.querySelector('#contact-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = form.get('name') || '';
  const phone = form.get('phone') || '';
  const email = form.get('email') || '';
  const inquiry = form.get('inquiry') || 'Real estate inquiry';
  const message = form.get('message') || '';

  const subject = encodeURIComponent(`${inquiry} — ${name}`);
  const body = encodeURIComponent(
`Hi Hannah,

My name is ${name}.
Phone: ${phone}
Email: ${email}
Inquiry: ${inquiry}

${message}

Thank you.`
  );
  window.location.href = `mailto:hannah@fullcircle-realestate.com?subject=${subject}&body=${body}`;
});

document.querySelector('#year').textContent = new Date().getFullYear();
