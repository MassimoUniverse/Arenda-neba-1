// =============================================
// ПЛАВНЫЕ АНИМАЦИИ — Аренда Неба
// Вдохновлено marine-system.ru
// =============================================

// =============================================
// LENIS SMOOTH SCROLL (инициализация глобально)
// =============================================
let lenis = null;
let lenisInitialized = false;

function initLenis() {
  // Предотвращаем повторную инициализацию
  if (lenisInitialized) return;
  
  // Проверяем доступность Lenis
  if (typeof window.Lenis === 'undefined') {
    // Пробуем еще раз через небольшую задержку
    if (!lenisInitialized) {
      setTimeout(initLenis, 50);
    }
    return;
  }

  // Проверяем доступность GSAP и ScrollTrigger
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Пробуем еще раз через небольшую задержку
    if (!lenisInitialized) {
      setTimeout(initLenis, 50);
    }
    return;
  }

  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.08, // Более плавная интерполяция для программного скролла
    });

    // Регистрируем ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      // Оптимизированная интеграция с GSAP ScrollTrigger
      let scrollUpdateRaf = null;
      let lastScrollY = window.scrollY || window.pageYOffset;
      
      lenis.on('scroll', () => {
        const currentScrollY = window.scrollY || window.pageYOffset;
        // Обновляем ScrollTrigger только при вертикальной прокрутке
        // и только если позиция действительно изменилась
        if (Math.abs(currentScrollY - lastScrollY) > 1) {
          lastScrollY = currentScrollY;
          // Используем requestAnimationFrame для оптимизации обновлений
          if (!scrollUpdateRaf) {
            scrollUpdateRaf = requestAnimationFrame(() => {
              ScrollTrigger.update();
              scrollUpdateRaf = null;
            });
          }
        }
      });
    }

    // Функция анимации для requestAnimationFrame
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    
    // Сохраняем в глобальной области для доступа из других скриптов
    window.lenis = lenis;
    lenisInitialized = true;
    
    console.log('✅ Lenis smooth scroll initialized');
  } catch (error) {
    console.error('❌ Error initializing Lenis:', error);
  }
}

// Инициализируем Lenis - пробуем несколько раз для надежности
function tryInitLenis() {
  if (!lenisInitialized) {
    initLenis();
  }
}

// Пробуем инициализировать сразу
tryInitLenis();

// Также пробуем после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(tryInitLenis, 100);
  });
} else {
  setTimeout(tryInitLenis, 100);
}

// И после полной загрузки страницы
window.addEventListener('load', () => {
  setTimeout(tryInitLenis, 200);
});

document.addEventListener('DOMContentLoaded', () => {
  // Регистрация плагинов GSAP
  gsap.registerPlugin(ScrollTrigger);

  // =============================================
  // SCROLL PROGRESS BAR (работает с Lenis)
  // =============================================
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    function updateProgressBar() {
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      let scrolled;
      
      if (window.lenis) {
        scrolled = (window.lenis.scroll / windowHeight) * 100;
      } else {
        scrolled = (window.scrollY / windowHeight) * 100;
      }
      
      progressBar.style.width = scrolled + '%';
    }

    // Используем Lenis события, если доступен
    function setupProgressBar() {
      if (window.lenis) {
        window.lenis.on('scroll', updateProgressBar);
      } else {
        // Fallback на нативный scroll
        window.addEventListener('scroll', updateProgressBar, { passive: true });
      }
    }
    
    setupProgressBar();
    
    // Переключимся на Lenis, когда он загрузится
    const checkLenisProgress = setInterval(() => {
      if (window.lenis) {
        window.removeEventListener('scroll', updateProgressBar);
        window.lenis.on('scroll', updateProgressBar);
        clearInterval(checkLenisProgress);
      }
    }, 100);
  }

  // =============================================
  // HEADER SCROLL EFFECT (работает с Lenis)
  // =============================================
  const header = document.querySelector('.site-header');
  if (header) {
    function updateHeader() {
      let scrollY;
      
      if (window.lenis) {
        scrollY = window.lenis.scroll;
      } else {
        scrollY = window.scrollY;
      }
      
      if (scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Используем Lenis события, если доступен
    function setupHeader() {
      if (window.lenis) {
        window.lenis.on('scroll', updateHeader);
      } else {
        // Fallback на нативный scroll
        window.addEventListener('scroll', updateHeader, { passive: true });
      }
    }
    
    setupHeader();
    
    // Переключимся на Lenis, когда он загрузится
    const checkLenisHeader = setInterval(() => {
      if (window.lenis) {
        window.removeEventListener('scroll', updateHeader);
        window.lenis.on('scroll', updateHeader);
        clearInterval(checkLenisHeader);
      }
    }, 100);
  }

  // =============================================
  // HERO ANIMATIONS (последовательное появление)
  // ============================================= 
  gsap.set(['.hero-badge', '.hero-title', '.hero-subtitle', '.hero-stats', '.hero-actions'], {
    opacity: 0,
    y: 30,
  });

  const heroTl = gsap.timeline({
    defaults: { ease: 'power2.out', duration: 0.8 },
  });

  heroTl
    .to('.hero-badge', { opacity: 1, y: 0 }, 0.3)
    .to('.hero-title', { opacity: 1, y: 0 }, 0.5)
    .to('.hero-subtitle', { opacity: 1, y: 0 }, 0.7)
    .to('.hero-stats', { opacity: 1, y: 0 }, 0.9)
    .to('.hero-actions', { opacity: 1, y: 0 }, 1.1);

  // =============================================
  // COUNTER ANIMATION (анимация цифр)
  // =============================================
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach((counter) => {
    const text = counter.textContent;
    const match = text.match(/(\d+)/);
    if (match) {
      const target = parseInt(match[1], 10);
      const suffix = text.replace(match[0], '');
      
      ScrollTrigger.create({
        trigger: counter,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.fromTo(
            counter,
            { innerText: 0 },
            {
              innerText: target,
              duration: 2,
              ease: 'power2.out',
              snap: { innerText: 1 },
              onUpdate: function () {
                counter.textContent = Math.ceil(this.targets()[0].innerText) + suffix;
              },
            }
          );

          // Дополнительная анимация масштаба, чтобы цифры смотрелись эффектнее
          gsap.fromTo(
            counter,
            { scale: 0.9 },
            {
              scale: 1,
              duration: 0.8,
              ease: 'elastic.out(1, 0.5)',
            }
          );
        },
      });
    }
  });

  // =============================================
  // SECTION HEADERS (появление заголовков секций)
  // =============================================
  // Устанавливаем начальное состояние для всех заголовков
  gsap.utils.toArray('.section-header').forEach((header) => {
    // Если заголовок уже был анимирован, устанавливаем финальное состояние
    if (header.hasAttribute('data-header-animated')) {
      gsap.set(header, { opacity: 1, y: 0 });
      return;
    }
    
    // Устанавливаем начальное состояние для анимации
    gsap.set(header, { opacity: 0, y: 40 });
  });
  
  gsap.utils.toArray('.section-header').forEach((header) => {
    // Проверяем, не был ли заголовок уже анимирован
    if (header.hasAttribute('data-header-animated')) {
      return;
    }
    
    // Помечаем заголовок как анимированный
    header.setAttribute('data-header-animated', 'true');
    
    const scrollTrigger = ScrollTrigger.create({
      trigger: header,
      start: 'top 85%',
      once: true, // Анимация сработает только один раз
      onEnter: () => {
        gsap.to(header, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
        });
      },
    });
    
    // Сохраняем ссылку на ScrollTrigger для возможной очистки
    header._scrollTrigger = scrollTrigger;
  });

  // =============================================
  // CALCULATOR ANIMATION (картинка слева, форма справа)
  // =============================================
  ScrollTrigger.create({
    trigger: '.calculator-layout',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      // выбор техники — выезжает слева
      gsap.from('.field-equipment', {
        x: -40,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
      });

      // картинка техники — слева, выезжает чуть сильнее
      gsap.from('.calculator-preview', {
        x: -80,
        opacity: 0,
        duration: 1,
        delay: 0.1,
        ease: 'power3.out',
      });

      // блок результата — снизу вверх
      gsap.from('.calculator-result', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        delay: 0.25,
        ease: 'power2.out',
      });

      // форма — справа
      gsap.from('.calculator-form', {
        x: 80,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'power3.out',
      });
    },
  });

  // =============================================
  // SERVICE CARDS (каскадное появление)
  // =============================================
  // Оптимизированная версия с проверкой наличия элементов
  const servicesGrid = document.querySelector('.services-grid');
  if (servicesGrid) {
    const serviceCards = document.querySelectorAll('.service-card-link');
    if (serviceCards.length > 0) {
      // Устанавливаем начальное состояние для лучшей производительности
      gsap.set('.service-card-link', {
        opacity: 0,
        y: 50
      });
      
      ScrollTrigger.create({
        trigger: '.autopark-section',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to('.service-card-link', {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            overwrite: true
          });
        },
        // Отключаем обновление при горизонтальной прокрутке карусели
        invalidateOnRefresh: false,
        refreshPriority: -1
      });
    }
  }

  // =============================================
  // REVIEW CARDS (каскадное появление)
  // =============================================
  // Устанавливаем начальное состояние для карточек отзывов
  gsap.set('.review-card', {
    opacity: 1,
    y: 0
  });
  
  ScrollTrigger.create({
    trigger: '.reviews-grid',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      const cards = document.querySelectorAll('.review-card');
      if (cards.length > 0) {
        gsap.from('.review-card', {
          y: 40,
          opacity: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power2.out',
        });
      }
    },
  });

  // =============================================
  // CONTACTS PANEL (плавное появление)
  // =============================================
  // Устанавливаем начальные значения для видимости
  gsap.set('.contact-card', {
    opacity: 1,
    y: 0
  });
  
  ScrollTrigger.create({
    trigger: '.contacts-panel',
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.from('.contacts-panel', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });
      gsap.from('.contact-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.3,
        ease: 'power2.out',
      });
    },
  });

  // =============================================
  // FOOTER ANIMATION (каскадное появление колонок)
  // =============================================
  ScrollTrigger.create({
    trigger: '.site-footer',
    start: 'top 90%',
    once: true,
    onEnter: () => {
      gsap.from('.footer-col', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
      });
    },
  });

  // =============================================
  // VIDEO PARALLAX - ОТКЛЮЧЕН (может вызывать лаги)
  // =============================================
  // Параллакс видео отключен для улучшения производительности

  // =============================================
  // SMOOTH ANCHOR SCROLL (через Lenis, если доступен)
  // =============================================
  function setupAnchorLinks() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#' || targetId === '#top') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();

        if (window.lenis) {
          window.lenis.scrollTo(target, { 
            offset: -80,
            duration: 2.5,
            easing: (t) => {
              // Более плавная easing функция для мягкого перехода
              return t < 0.5 
                ? 2 * t * t 
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
            },
            immediate: false
          });
        } else {
          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: 'smooth',
          });
        }
      });
    });
  }

  // Настраиваем якорные ссылки после загрузки
  setupAnchorLinks();
  
  // Обработка ссылки на главную страницу (логотип)
  document.querySelectorAll('a.logo[href="/"], a.logo[href="index.html"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      // Если мы уже на главной странице, прокручиваем наверх
      if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        e.preventDefault();
        
        if (window.lenis) {
          window.lenis.scrollTo(0, {
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
      // Иначе просто переходим по ссылке (обычное поведение)
    });
  });
  
  // Также настраиваем после инициализации Lenis (если он загрузился позже)
  if (window.lenis) {
    setupAnchorLinks();
  } else {
    window.addEventListener('load', setupAnchorLinks);
  }

  // =============================================
  // ANDROID-STYLE RIPPLE EFFECT (для всех кнопок)
  // =============================================
  function createRipple(event, button) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    // Удаляем ripple после завершения анимации
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Применяем ripple эффект ко всем кнопкам (кроме carousel-btn и number-btn, у них своя анимация)
  const interactiveButtons = document.querySelectorAll(
    '.btn, .messenger-btn, .number-btn, .header-messenger, .reviews-nav-btn'
  );

  interactiveButtons.forEach((btn) => {
    // Пропускаем кнопки карусели и кнопки калькулятора - у них своя анимация
    if (btn.classList.contains('carousel-btn') || 
        btn.classList.contains('number-btn') || 
        btn.classList.contains('calc-number-btn')) return;
    
    // Обработчик для мыши
    btn.addEventListener('click', (e) => {
      createRipple(e, btn);
    });
    
    // Обработчик для touch устройств
    btn.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      const fakeEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      createRipple(fakeEvent, btn);
    });
  });

  // =============================================
  // SMOOTH NAVIGATION BUTTONS ANIMATION (GSAP)
  // =============================================
  function initNavigationButtons() {
    // Простая и надежная анимация для стрелок каталога машин
    const carouselButtons = document.querySelectorAll('.carousel-btn:not([data-animated])');
    carouselButtons.forEach((btn) => {
      if (btn.disabled || btn.hasAttribute('data-animated')) return;
      
      btn.setAttribute('data-animated', 'true');
      
      // Удаляем все существующие ripple элементы, если они есть
      const existingRipples = btn.querySelectorAll('.ripple');
      existingRipples.forEach(ripple => ripple.remove());
      
      // Получаем иконку (стрелку) внутри кнопки
      let icon = btn.querySelector('span, svg');
      
      // Если иконки нет, создаем span для текстового содержимого
      if (!icon) {
        icon = document.createElement('span');
        icon.textContent = btn.textContent.trim();
        btn.textContent = '';
        btn.appendChild(icon);
      }
      
      // Устанавливаем начальные значения - только transform
      gsap.set(btn, { clearProps: 'all' });
      gsap.set(btn, { y: 0, scale: 1 });
      gsap.set(icon, { clearProps: 'all' });
      gsap.set(icon, { x: 0, scale: 1 });
      
      // Определяем направление для анимации иконки
      const direction = btn.classList.contains('next') ? 1 : -1;
      
      let hoverAnimation = null;
      let pressAnimation = null;
      
      // Hover - вход: только transform, цвета через CSS класс
      btn.addEventListener('mouseenter', () => {
        if (btn.disabled) return;
        // Останавливаем все предыдущие анимации
        if (hoverAnimation) hoverAnimation.kill();
        if (pressAnimation) pressAnimation.kill();
        
        btn.classList.add('carousel-btn-hover');
        hoverAnimation = gsap.to(btn, {
          y: -3,
          scale: 1.05,
          duration: 0.3,
          ease: 'power2.out'
        });
        gsap.to(icon, {
          x: direction * 1.5,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      // Hover - выход
      btn.addEventListener('mouseleave', () => {
        if (btn.disabled) return;
        // Останавливаем все анимации
        if (hoverAnimation) hoverAnimation.kill();
        if (pressAnimation) pressAnimation.kill();
        
        btn.classList.remove('carousel-btn-hover', 'carousel-btn-active');
        
        // Плавный возврат в исходное состояние
        gsap.to(btn, {
          y: 0,
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(btn, { clearProps: 'all' });
            gsap.set(btn, { y: 0, scale: 1 });
          }
        });
        gsap.to(icon, {
          x: 0,
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(icon, { clearProps: 'all' });
            gsap.set(icon, { x: 0, scale: 1 });
          }
        });
      });
      
      // Нажатие
      btn.addEventListener('mousedown', (e) => {
        if (btn.disabled) return;
        e.preventDefault();
        
        // Останавливаем hover анимацию
        if (hoverAnimation) hoverAnimation.kill();
        
        btn.classList.add('carousel-btn-active');
        pressAnimation = gsap.to(btn, {
          scale: 0.95,
          y: -1,
          duration: 0.1,
          ease: 'power2.in'
        });
        gsap.to(icon, {
          x: direction * 1,
          duration: 0.1,
          ease: 'power2.in'
        });
      });
      
      // Отпускание
      btn.addEventListener('mouseup', () => {
        if (btn.disabled) return;
        
        // Останавливаем анимацию нажатия
        if (pressAnimation) pressAnimation.kill();
        
        if (btn.classList.contains('carousel-btn-hover')) {
          // Если все еще hover, возвращаемся к hover состоянию
          gsap.to(btn, {
            scale: 1.05,
            y: -3,
            duration: 0.15,
            ease: 'power2.out'
          });
          gsap.to(icon, {
            x: direction * 1.5,
            duration: 0.15,
            ease: 'power2.out'
          });
        } else {
          // Иначе возвращаемся в исходное состояние
          btn.classList.remove('carousel-btn-active');
          gsap.to(btn, {
            scale: 1,
            y: 0,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(btn, { clearProps: 'all' });
              gsap.set(btn, { y: 0, scale: 1 });
            }
          });
          gsap.to(icon, {
            x: 0,
            scale: 1,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(icon, { clearProps: 'all' });
              gsap.set(icon, { x: 0, scale: 1 });
            }
          });
        }
      });
      
      // Клик - быстрая анимация иконки (только если не disabled)
      btn.addEventListener('click', (e) => {
        if (btn.disabled) return;
        // Небольшая анимация клика
        gsap.to(icon, {
          x: direction * 2,
          duration: 0.08,
          ease: 'power2.in',
          yoyo: true,
          repeat: 1
        });
      });
      
      // Touch события
      btn.addEventListener('touchstart', (e) => {
        if (btn.disabled) return;
        e.preventDefault();
        
        if (hoverAnimation) hoverAnimation.kill();
        
        btn.classList.add('carousel-btn-active');
        pressAnimation = gsap.to(btn, {
          scale: 0.95,
          y: -1,
          duration: 0.1,
          ease: 'power2.in'
        });
        gsap.to(icon, {
          x: direction * 1,
          duration: 0.1,
          ease: 'power2.in'
        });
      });
      
      btn.addEventListener('touchend', (e) => {
        if (btn.disabled) return;
        e.preventDefault();
        
        if (pressAnimation) pressAnimation.kill();
        
        btn.classList.remove('carousel-btn-active', 'carousel-btn-hover');
        gsap.to(btn, {
          scale: 1,
          y: 0,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(btn, { clearProps: 'all' });
            gsap.set(btn, { y: 0, scale: 1 });
          }
        });
        gsap.to(icon, {
          x: 0,
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(icon, { clearProps: 'all' });
            gsap.set(icon, { x: 0, scale: 1 });
          }
        });
      });
    });
    
    // Отдельная обработка для стрелок отзывов
    const reviewsButtons = document.querySelectorAll('.reviews-nav-btn:not([data-animated])');
    reviewsButtons.forEach((btn) => {
      if (btn.disabled || btn.hasAttribute('data-animated')) return;
      
      btn.setAttribute('data-animated', 'true');
      
      const icon = btn.querySelector('span, svg');
      if (!icon) return;
      
      let isHovered = false;
      let isPressed = false;
      
      // Hover анимация для отзывов
      btn.addEventListener('mouseenter', () => {
        if (btn.disabled) return;
        isHovered = true;
        
        gsap.to(btn, {
          y: -2,
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.08)',
          borderColor: '#ff6b35',
          color: '#ff6b35',
          duration: 0.3,
          ease: 'power2.out'
        });
        
        gsap.to(icon, {
          scale: 1.15,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      // Уход с кнопки
      btn.addEventListener('mouseleave', () => {
        if (btn.disabled) return;
        isHovered = false;
        isPressed = false;
        
        gsap.to(btn, {
          y: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          borderColor: '#e2e8f0',
          color: '#1a1f36',
          duration: 0.3,
          ease: 'power2.out'
        });
        
        gsap.to(icon, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
      
      // Нажатие
      btn.addEventListener('mousedown', (e) => {
        if (btn.disabled) return;
        e.preventDefault();
        isPressed = true;
        
        gsap.to(btn, {
          y: 0,
          scale: 0.95,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
          duration: 0.15,
          ease: 'power2.in'
        });
        
        gsap.to(icon, {
          scale: 0.9,
          duration: 0.15,
          ease: 'power2.in'
        });
      });
      
      // Отпускание
      btn.addEventListener('mouseup', () => {
        if (btn.disabled) return;
        isPressed = false;
        
        if (isHovered) {
          gsap.to(btn, {
            y: -2,
            scale: 1,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.08)',
            duration: 0.2,
            ease: 'power2.out'
          });
          
          gsap.to(icon, {
            scale: 1.15,
            duration: 0.2,
            ease: 'power2.out'
          });
        } else {
          gsap.to(btn, {
            y: 0,
            scale: 1,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
            duration: 0.2,
            ease: 'power2.out'
          });
          
          gsap.to(icon, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.out'
          });
        }
      });
    });
  }
  
  // Инициализируем после загрузки DOM
  setTimeout(() => {
    initNavigationButtons();
  }, 100);
  
  // Также инициализируем для динамически добавленных кнопок
  const observer = new MutationObserver(() => {
    const newCarouselButtons = document.querySelectorAll('.carousel-btn:not([data-animated])');
    const newReviewsButtons = document.querySelectorAll('.reviews-nav-btn:not([data-animated])');
    if (newCarouselButtons.length > 0 || newReviewsButtons.length > 0) {
      initNavigationButtons();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // =============================================
  // FADE IN ON SCROLL - универсальный компонент
  // =============================================
  let fadeInObserver = null;
  
  function initFadeInOnScroll() {
    // Находим только элементы, которые еще не были обработаны
    const fadeElements = document.querySelectorAll('[data-fade-in]:not(.fade-in-complete)');
    
    if (fadeElements.length === 0) return;
    
    // Если observer уже существует, используем его, иначе создаем новый
    if (!fadeInObserver) {
      const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      };
      
      fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target;
            
            // Проверяем, не был ли элемент уже обработан
            if (element.classList.contains('fade-in-complete')) {
              fadeInObserver.unobserve(element);
              return;
            }
            
            const delay = parseInt(element.getAttribute('data-fade-delay') || '0', 10);
            const direction = element.getAttribute('data-fade-direction') || 'up';
            
            // Устанавливаем начальное состояние
            const fromState = {
              opacity: 0,
              y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
              x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
              scale: direction === 'scale' ? 0.9 : 1
            };
            
            gsap.fromTo(
              element,
              fromState,
              {
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1,
                duration: 0.7,
                delay: delay / 1000,
                ease: 'power2.out',
                onComplete: () => {
                  element.classList.add('fade-in-complete');
                }
              }
            );
            
            // Отключаем наблюдение после анимации
            fadeInObserver.unobserve(element);
          }
        });
      }, observerOptions);
    }
    
    // Наблюдаем только за новыми элементами
    fadeElements.forEach((el) => {
      // Проверяем еще раз перед добавлением в observer
      if (!el.classList.contains('fade-in-complete')) {
        // Устанавливаем начальное состояние через CSS для лучшей производительности
        gsap.set(el, {
          opacity: 0,
          y: el.getAttribute('data-fade-direction') === 'up' ? 30 : 
             el.getAttribute('data-fade-direction') === 'down' ? -30 : 0,
          x: el.getAttribute('data-fade-direction') === 'left' ? 30 : 
             el.getAttribute('data-fade-direction') === 'right' ? -30 : 0,
          scale: el.getAttribute('data-fade-direction') === 'scale' ? 0.9 : 1
        });
        
        fadeInObserver.observe(el);
      }
    });
  }
  
  // Инициализируем после загрузки DOM
  initFadeInOnScroll();
  
  // Также инициализируем для динамически добавленных элементов
  // Используем debounce для предотвращения множественных вызовов
  let fadeObserverTimeout = null;
  const fadeObserver = new MutationObserver(() => {
    // Очищаем предыдущий таймер
    if (fadeObserverTimeout) {
      clearTimeout(fadeObserverTimeout);
    }
    
    // Запускаем проверку с небольшой задержкой
    fadeObserverTimeout = setTimeout(() => {
      const newElements = document.querySelectorAll('[data-fade-in]:not(.fade-in-complete)');
      if (newElements.length > 0) {
        // Проверяем, что это действительно новые элементы, а не те же самые
        const hasNewElements = Array.from(newElements).some(el => {
          return !el.hasAttribute('data-fade-initialized');
        });
        
        if (hasNewElements) {
          // Помечаем элементы как инициализированные
          newElements.forEach(el => {
            el.setAttribute('data-fade-initialized', 'true');
          });
          initFadeInOnScroll();
        }
      }
    }, 100);
  });
  
  fadeObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // =============================================
  // CARD HOVER - использует CSS transitions вместо GSAP
  // =============================================
  // Hover эффекты для карточек теперь в CSS для лучшей производительности

  // =============================================
  // LOGO FADE - ОТКЛЮЧЕН (может вызывать лаги при скролле)
  // =============================================
  // Fade эффект для лого отключен для улучшения производительности
});
