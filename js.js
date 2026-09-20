document.querySelectorAll('*').forEach(el => {
  if (el.offsetWidth > document.documentElement.offsetWidth) {
    console.log('Вылезает:', el);
  }
});

const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');

if (burger && mobileMenu) {
  let closeTimer;

  const closeMobileMenu = () => {
    clearTimeout(closeTimer);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.classList.remove('is-open');
    closeTimer = setTimeout(() => {
      mobileMenu.hidden = true;
    }, 350);
  };

  const toggleMobileMenu = () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';

    clearTimeout(closeTimer);
    burger.setAttribute('aria-expanded', String(!isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');

    if (isOpen) {
      closeMobileMenu();
      return;
    }

    mobileMenu.hidden = false;
    requestAnimationFrame(() => {
      mobileMenu.classList.add('is-open');
    });
  };

  burger.addEventListener('click', toggleMobileMenu);

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMobileMenu();
    }
  });

  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.header')) {
      closeMobileMenu();
    }
  });
}