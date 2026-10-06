(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const menuBackdrop = document.querySelector('[data-menu-backdrop]');
  const header = document.querySelector('[data-header]');
  let lastFocusedElement = null;
  let menuCloseTimer = null;

  const getMenuFocusable = () => mobileMenu ? [...mobileMenu.querySelectorAll('a, button:not([disabled])')] : [];
  const closeMenu = (restoreFocus = true) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'メニューを開く');
    mobileMenu.classList.remove('is-open');
    menuBackdrop?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    if (restoreFocus && lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
    window.clearTimeout(menuCloseTimer);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350;
    menuCloseTimer = window.setTimeout(() => {
      mobileMenu.hidden = true;
      if (menuBackdrop) menuBackdrop.hidden = true;
    }, delay);
  };
  const openMenu = () => {
    if (!menuButton || !mobileMenu) return;
    lastFocusedElement = document.activeElement;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'メニューを閉じる');
    window.clearTimeout(menuCloseTimer);
    mobileMenu.hidden = false;
    if (menuBackdrop) menuBackdrop.hidden = false;
    document.body.classList.add('menu-open');
    window.requestAnimationFrame(() => {
      mobileMenu.classList.add('is-open');
      menuBackdrop?.classList.add('is-open');
      getMenuFocusable()[0]?.focus();
    });
  };

  menuButton?.addEventListener('click', () => menuButton.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu());
  mobileMenu?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(false); });
  menuBackdrop?.addEventListener('click', () => closeMenu());
  mobileMenu?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = getMenuFocusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(false);
  });

  document.querySelectorAll('.faq-item button').forEach(button => {
    button.addEventListener('click', () => {
      const answer = document.getElementById(button.getAttribute('aria-controls'));
      if (!answer) return;
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(willOpen));
      answer.hidden = !willOpen;
    });
  });

  const dialog = document.querySelector('.reserve-dialog');
  let reserveTrigger = null;
  document.querySelectorAll('[data-reserve]').forEach(button => {
    button.addEventListener('click', () => {
      reserveTrigger = button;
      if (menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(false);
      if (dialog?.showModal && !dialog.open) dialog.showModal();
    });
  });
  document.querySelectorAll('[data-dialog-close]').forEach(button => button.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => reserveTrigger?.focus());

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) revealItems.forEach(item => item.classList.add('is-visible'));
  else {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); currentObserver.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealItems.forEach(item => observer.observe(item));
    // Extremely fast jumps (including browser find/full-page capture) can skip an
    // observer threshold. Never leave content permanently hidden in that case.
    window.setTimeout(() => revealItems.forEach(item => item.classList.add('is-visible')), 1600);
  }

  const floatingNav = document.querySelector('[data-floating-nav]');
  const backToTop = document.querySelector('[data-back-to-top]');
  const floatingReserve = document.querySelector('[data-floating-reserve]');
  const mobileBar = document.querySelector('[data-mobile-bar]');
  const mobileTop = document.querySelector('[data-mobile-top]');
  const mobileReserve = document.querySelector('[data-mobile-reserve]');
  const finalCta = document.querySelector('.final-cta');
  const mobileViewport = window.matchMedia('(max-width: 768px)');
  let ticking = false;

  const releaseFocusBeforeHide = element => {
    if (element?.contains(document.activeElement)) document.activeElement.blur();
  };
  const updatePageUi = () => {
    const pagePassed = window.scrollY > Math.min(420, window.innerHeight * .55);
    const finalRect = finalCta?.getBoundingClientRect();
    const finalVisible = finalRect ? finalRect.top <= window.innerHeight * .75 && finalRect.bottom >= window.innerHeight * .2 : false;
    header?.classList.toggle('is-scrolled', window.scrollY > 40);
    floatingNav?.classList.toggle('is-visible', pagePassed && !mobileViewport.matches);
    floatingNav?.classList.toggle('is-reserve-hidden', finalVisible);
    mobileBar?.classList.toggle('is-visible', pagePassed && mobileViewport.matches);
    mobileBar?.classList.toggle('is-reserve-hidden', finalVisible);
    if (backToTop) backToTop.disabled = !pagePassed;
    if (floatingReserve) floatingReserve.disabled = !pagePassed || finalVisible;
    if (mobileTop) mobileTop.disabled = !pagePassed;
    if (mobileReserve) mobileReserve.disabled = !pagePassed || finalVisible;
    if (!pagePassed) { releaseFocusBeforeHide(floatingNav); releaseFocusBeforeHide(mobileBar); }
    ticking = false;
  };
  const requestUiUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updatePageUi);
  };
  const scrollTop = () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  backToTop?.addEventListener('click', scrollTop);
  mobileTop?.addEventListener('click', scrollTop);
  updatePageUi();
  window.addEventListener('scroll', requestUiUpdate, { passive: true });
  window.addEventListener('resize', requestUiUpdate);
  mobileViewport.addEventListener?.('change', updatePageUi);
})();
