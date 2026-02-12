(function() {
  'use strict';

  if (typeof window.__app !== 'undefined' && window.__app.initialized) {
    return;
  }

  window.__app = { initialized: true };

  const utils = {
    debounce: function(func, wait) {
      let timeout;
      return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    },

    throttle: function(func, limit) {
      let inThrottle;
      return function() {
        const context = this;
        const args = arguments;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => { inThrottle = false; }, limit);
        }
      };
    },

    getHeaderHeight: function() {
      const header = document.querySelector('.l-header');
      return header ? header.offsetHeight : 80;
    },

    isHomePage: function() {
      const path = window.location.pathname;
      return path === '/' || path === '/index.html' || path.endsWith('/index.html');
    }
  };

  function initBurgerMenu() {
    const toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    const nav = document.querySelector('.navbar-collapse, #mainNav');
    const body = document.body;

    if (!toggle || !nav) return;

    let isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
    }

    function closeMenu() {
      isOpen = false;
      nav.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      isOpen ? closeMenu() : openMenu();
    });

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && isOpen) {
        closeMenu();
      }
    });

    document.addEventListener('click', function(e) {
      if (isOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (isOpen) closeMenu();
      });
    });

    window.addEventListener('resize', utils.debounce(() => {
      if (window.innerWidth >= 1024 && isOpen) {
        closeMenu();
      }
    }, 150), { passive: true });
  }

  function initSmoothScroll() {
    document.addEventListener('click', function(e) {
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      const href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      let hash = '';
      if (href.startsWith('#')) {
        hash = href;
      } else if (href.startsWith('/#')) {
        if (!utils.isHomePage()) {
          return;
        }
        hash = href.substring(1);
      } else {
        return;
      }

      const element = document.querySelector(hash);
      if (!element) return;

      e.preventDefault();

      const headerHeight = utils.getHeaderHeight();
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      if (history.pushState) {
        history.pushState(null, null, hash);
      }
    });
  }

  function initActiveMenu() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
      link.removeAttribute('aria-current');
      link.classList.remove('active');

      const href = link.getAttribute('href');
      if (!href) return;

      const linkPath = href.split('#')[0];

      if (linkPath === currentPath ||
          (utils.isHomePage() && (linkPath === '/' || linkPath === '/index.html' || linkPath === 'index.html')) ||
          (currentPath.endsWith(linkPath) && linkPath !== '')) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      }
    });
  }

  function initScrollSpy() {
    if (!utils.isHomePage()) return;

    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return;

    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    if (navLinks.length === 0) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${entry.target.id}`) {
              navLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: `-${utils.getHeaderHeight()}px 0px -70% 0px`,
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  function initFormValidation() {
    const forms = document.querySelectorAll('.needs-validation, .c-form');

    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const nameInput = form.querySelector('#contactName');
        const emailInput = form.querySelector('#contactEmail');
        const phoneInput = form.querySelector('#contactPhone');
        const messageInput = form.querySelector('#contactMessage');
        const privacyInput = form.querySelector('#contactPrivacy, #privacyConsent');
        const submitBtn = form.querySelector('button[type="submit"]');

        let isValid = true;

        function showError(input, message) {
          input.classList.add('is-invalid', 'has-error');
          let errorEl = input.nextElementSibling;
          if (!errorEl || !errorEl.classList.contains('invalid-feedback')) {
            errorEl = document.createElement('div');
            errorEl.className = 'invalid-feedback c-form__error';
            input.parentNode.appendChild(errorEl);
          }
          errorEl.textContent = message;
          errorEl.style.display = 'block';
          isValid = false;
        }

        function clearError(input) {
          input.classList.remove('is-invalid', 'has-error');
          const errorEl = input.nextElementSibling;
          if (errorEl && errorEl.classList.contains('invalid-feedback')) {
            errorEl.style.display = 'none';
          }
        }

        if (nameInput) {
          clearError(nameInput);
          const nameValue = nameInput.value.trim();
          if (nameValue.length === 0) {
            showError(nameInput, 'Lūdzu, ievadiet savu vārdu.');
          } else if (!/^[a-zA-ZÀ-ÿs-']{2,50}$/.test(nameValue)) {
            showError(nameInput, 'Vārds drīkst saturēt tikai burtus (2-50 rakstzīmes).');
          }
        }

        if (emailInput) {
          clearError(emailInput);
          const emailValue = emailInput.value.trim();
          if (emailValue.length === 0) {
            showError(emailInput, 'Lūdzu, ievadiet e-pasta adresi.');
          } else if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(emailValue)) {
            showError(emailInput, 'Lūdzu, ievadiet derīgu e-pasta adresi.');
          }
        }

        if (phoneInput) {
          clearError(phoneInput);
          const phoneValue = phoneInput.value.trim();
          if (phoneValue.length === 0) {
            showError(phoneInput, 'Lūdzu, ievadiet tālruņa numuru.');
          } else if (!/^[ds+-()]{7,20}$/.test(phoneValue)) {
            showError(phoneInput, 'Lūdzu, ievadiet derīgu tālruņa numuru (7-20 cipari).');
          }
        }

        if (messageInput) {
          clearError(messageInput);
          const messageValue = messageInput.value.trim();
          if (messageValue.length < 10) {
            showError(messageInput, 'Ziņojumam jābūt vismaz 10 rakstzīmju garam.');
          }
        }

        if (privacyInput && !privacyInput.checked) {
          showError(privacyInput, 'Jums jāpiekrīt privātuma politikai.');
        }

        if (!isValid) {
          form.classList.add('was-validated');
          return false;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Nosūta...';

          setTimeout(() => {
            window.location.href = 'thank_you.html';
          }, 800);
        }

        return false;
      });
    });
  }

  function initLazyLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('loading') && !img.hasAttribute('data-critical')) {
        img.setAttribute('loading', 'lazy');
      }

      img.addEventListener('error', function() {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#6c757d">Image unavailable</text></svg>';
        this.src = 'data:image/svg+xml;base64,' + btoa(svg);
      });
    });
  }

  function initScrollToTop() {
    let scrollBtn = document.querySelector('.scroll-to-top, #scrollToTop');
    
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.className = 'scroll-to-top';
      scrollBtn.setAttribute('aria-label', 'Atgriezties augšā');
      scrollBtn.innerHTML = '↑';
      document.body.appendChild(scrollBtn);
    }

    window.addEventListener('scroll', utils.throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }, 200), { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initActiveMenu();
    initScrollSpy();
    initFormValidation();
    initLazyLoading();
    initScrollToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
