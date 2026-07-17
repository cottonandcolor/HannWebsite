const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('#nav-links');
const siteHeader = document.querySelector('.site-header');

menuToggle?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  siteHeader?.classList.toggle('menu-open', isOpen);
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    siteHeader?.classList.remove('menu-open');
  });
});

window.addEventListener('scroll', () => {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

const setInquiry = (inquiry) => {
  const select = document.querySelector('#inquiry-select');
  if (select && inquiry) select.value = inquiry;
};

document.querySelectorAll('[data-inquiry]').forEach(el => {
  el.addEventListener('click', () => setInquiry(el.dataset.inquiry));
});

const inquiryFromHash = {
  'contact-family-homes': 'Buying a home',
  'contact-acreage': 'Land and acreage',
  'contact-new-construction': 'New construction',
  'contact-commercial': 'Commercial real estate',
};

const applyHashInquiry = () => {
  const key = window.location.hash.replace(/^#/, '');
  if (inquiryFromHash[key]) setInquiry(inquiryFromHash[key]);
};

window.addEventListener('hashchange', applyHashInquiry);
applyHashInquiry();

async function submitLeadForm(form, submitBtn, successEl, defaultLabel, subjectPrefix) {
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
  }
  try {
    const response = await fetch('https://formsubmit.co/ajax/yourspacewithhannah@gmail.com', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: (() => {
        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value));
        body.append('_subject', `${subjectPrefix}: ${payload.name || ''} — ${payload.address || payload.area || payload.inquiry || ''}`);
        return body;
      })()
    });
    if (!response.ok) throw new Error('Form submission failed');
    form.classList.add('is-success');
    if (successEl) successEl.hidden = false;
    form.reset();
  } catch (error) {
    const subject = encodeURIComponent(`${subjectPrefix} — ${payload.name || ''}`);
    const body = encodeURIComponent(
`Hi Hannah,

My name is ${payload.name || ''}.
Phone: ${payload.phone || ''}
Email: ${payload.email || ''}
Inquiry: ${payload.inquiry || ''}
Address: ${payload.address || ''}
Timeline: ${payload.timeline || ''}
Area: ${payload.area || ''}
Beds: ${payload.beds || ''} Baths: ${payload.baths || ''} Max price: ${payload.max_price || ''}

${payload.message || ''}

Thank you.`
    );
    window.location.href = `mailto:yourspacewithhannah@gmail.com?subject=${subject}&body=${body}`;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = defaultLabel;
    }
  }
}

document.querySelector('#home-search-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitLeadForm(
    event.currentTarget,
    document.querySelector('#search-submit'),
    document.querySelector('#search-success'),
    'Send search request',
    'Home Search request'
  );
});

document.querySelector('#valuation-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitLeadForm(
    event.currentTarget,
    document.querySelector('#valuation-submit'),
    document.querySelector('#valuation-success'),
    'Get my home valuation',
    'Home Valuation request'
  );
});

document.querySelector('#hero-search')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const intent = document.querySelector('#hero-intent')?.value || 'Buying a home';
  const area = document.querySelector('#hero-area')?.value || '';
  setInquiry(intent);
  const message = document.querySelector('textarea[name="message"]');
  if (message) {
    message.value = area
      ? `I'm interested in: ${intent}. Preferred area: ${area}.`
      : `I'm interested in: ${intent}.`;
  }
  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
});

const modal = document.querySelector('#property-modal');

document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.property-track, .listings-carousel');
  const prev = carousel.querySelector('.carousel-nav.prev');
  const next = carousel.querySelector('.carousel-nav.next');
  if (!track || !prev || !next) return;

  const scrollAmount = () => {
    const card = track.querySelector('.property-card, .review-card, .prop-card');
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 14;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  };

  const updateNav = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= maxScroll;
  };

  prev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
  track.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();
});

const modalTitle = document.querySelector('#modal-title');
const modalSubtitle = document.querySelector('#modal-subtitle');
const modalDetails = document.querySelector('#modal-details');
const modalPrice = document.querySelector('#modal-price');
const modalTour = document.querySelector('#modal-tour');
const modalContact = document.querySelector('#modal-contact');
const modalGallery = document.querySelector('#modal-gallery');
const modalGalleryImage = document.querySelector('#modal-gallery-image');
const modalGalleryThumbs = document.querySelector('#modal-gallery-thumbs');
const modalGalleryCount = document.querySelector('#modal-gallery-count');
const modalGalleryPrev = document.querySelector('.modal-gallery-nav.prev');
const modalGalleryNext = document.querySelector('.modal-gallery-nav.next');

let galleryImages = [];
let galleryIndex = 0;

function padGalleryIndex(index) {
  return String(index).padStart(2, '0');
}

function setGalleryIndex(index) {
  if (!galleryImages.length) return;
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  const src = galleryImages[galleryIndex];
  modalGalleryImage.src = src;
  modalGalleryImage.alt = `${modalTitle.textContent} — photo ${galleryIndex + 1} of ${galleryImages.length}`;
  modalGalleryCount.textContent = `${galleryIndex + 1} / ${galleryImages.length}`;
  modalGalleryThumbs.querySelectorAll('button').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === galleryIndex);
    if (i === galleryIndex) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

function buildGallery(basePath, count, title) {
  galleryImages = Array.from({ length: Number(count) }, (_, i) => `${basePath}/${padGalleryIndex(i + 1)}.jpg`);
  galleryIndex = 0;
  modalGalleryThumbs.innerHTML = galleryImages.map((src, i) =>
    `<button type="button" role="tab" aria-selected="${i === 0}" aria-label="Photo ${i + 1}"><img src="${src}" alt="" width="120" height="80" loading="lazy" /></button>`
  ).join('');
  modalGalleryThumbs.querySelectorAll('button').forEach((thumb, i) => {
    thumb.addEventListener('click', () => setGalleryIndex(i));
  });
  modal.classList.add('has-gallery');
  modalGallery.hidden = false;
  setGalleryIndex(0);
}

function clearGallery() {
  galleryImages = [];
  galleryIndex = 0;
  modal.classList.remove('has-gallery');
  modalGallery.hidden = true;
  modalGalleryThumbs.innerHTML = '';
  modalGalleryImage.removeAttribute('src');
}

modalGalleryPrev?.addEventListener('click', () => setGalleryIndex(galleryIndex - 1));
modalGalleryNext?.addEventListener('click', () => setGalleryIndex(galleryIndex + 1));

document.querySelectorAll('.property-link').forEach(button => {
  button.addEventListener('click', () => {
    modalTitle.textContent = button.dataset.title || 'Property overview';
    modalSubtitle.textContent = button.dataset.subtitle || 'Property';
    modalDetails.textContent = button.dataset.details || '';
    modalContact.dataset.property = button.dataset.title || 'Property';
    if (button.dataset.gallery && button.dataset.galleryCount) {
      buildGallery(button.dataset.gallery, button.dataset.galleryCount, button.dataset.title);
    } else {
      clearGallery();
    }
    if (modalPrice) {
      if (button.dataset.price) {
        modalPrice.textContent = button.dataset.price;
        modalPrice.hidden = false;
      } else {
        modalPrice.hidden = true;
      }
    }
    if (modalTour) {
      if (button.dataset.tour) {
        modalTour.href = button.dataset.tour;
        modalTour.textContent = /propertypanorama|drone-digital/i.test(button.dataset.tour)
          ? 'Virtual tour'
          : 'View listing';
        modalTour.hidden = false;
      } else {
        modalTour.hidden = true;
      }
    }
    document.body.classList.add('modal-open');
    modal.showModal();
  });
});

document.querySelector('.modal-close')?.addEventListener('click', () => modal.close());

modal?.addEventListener('click', event => {
  const rect = modal.getBoundingClientRect();
  const clickedOutside =
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;
  if (clickedOutside) modal.close();
});

modal?.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  clearGallery();
});

modalContact?.addEventListener('click', () => {
  const property = modalContact.dataset.property;
  const message = document.querySelector('textarea[name="message"]');
  if (property?.toLowerCase().includes('acres')) setInquiry('Land and acreage');
  else if (property?.toLowerCase().includes('commercial')) setInquiry('Commercial real estate');
  else setInquiry('Buying a home');
  if (message) message.value = `I would like more information about ${property}.`;
  modal.close();
});

const contactForm = document.querySelector('#contact-form');
const formSuccess = document.querySelector('#form-success');
const contactSubmit = document.querySelector('#contact-submit');

function showFormSuccess() {
  contactForm?.classList.add('is-success');
  if (formSuccess) formSuccess.hidden = false;
}

document.querySelectorAll('.resource-request').forEach(button => {
  button.addEventListener('click', () => {
    const resource = button.dataset.resource || 'real estate guide';
    setInquiry(button.dataset.inquiry);
    const message = document.querySelector('textarea[name="message"]');
    if (message) message.value = `I would like to request the ${resource}.`;
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  });
});

contactForm?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  contactSubmit.disabled = true;
  contactSubmit.textContent = 'Sending…';

  try {
    const response = await fetch('https://formsubmit.co/ajax/yourspacewithhannah@gmail.com', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: (() => {
        const body = new FormData();
        Object.entries(payload).forEach(([key, value]) => body.append(key, value));
        body.append('_subject', `Website inquiry: ${payload.inquiry || 'General'} — ${payload.name || ''}`);
        return body;
      })()
    });
    if (!response.ok) throw new Error('Form submission failed');
    showFormSuccess();
    form.reset();
  } catch (error) {
    const subject = encodeURIComponent(`${payload.inquiry || 'Inquiry'} — ${payload.name || ''}`);
    const body = encodeURIComponent(
`Hi Hannah,

My name is ${payload.name || ''}.
Phone: ${payload.phone || ''}
Email: ${payload.email || ''}
Inquiry: ${payload.inquiry || ''}

${payload.message || ''}

Thank you.`
    );
    window.location.href = `mailto:yourspacewithhannah@gmail.com?subject=${subject}&body=${body}`;
  } finally {
    contactSubmit.disabled = false;
    contactSubmit.textContent = 'Send Message to Hannah';
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

/**
 * Optional IDX mount left in place for future use only.
 * This site shows curated "My Listings" without live MLS.
 */
function mountIdxIfConfigured() {
  const mount = document.querySelector('#idx-mount');
  const embed = document.querySelector('#idx-embed');
  const cfg = window.HANNAH_IDX;
  if (!mount || !embed || !cfg?.html) return;
  embed.innerHTML = cfg.html;
  mount.hidden = false;
}
mountIdxIfConfigured();
