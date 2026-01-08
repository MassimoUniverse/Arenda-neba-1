/**
 * SCROLL-DRIVEN SLIDES
 * Плавная интерполяция слайдов на основе прогресса прокрутки
 * 
 * Логика:
 * - position = progress * (slidesCount - 1)
 * - distance = i - position
 * - На основе distance вычисляются transform, scale, opacity, blur, zIndex
 */

// =============================================
// ДАННЫЕ СЛАЙДОВ
// =============================================
// Меняйте этот массив для изменения контента слайдов
// Или данные будут загружены из API (популярные услуги)
const SCROLL_SLIDES_DATA = [
  {
    title: 'Автовышка-платформа 13м',
    subtitle: 'Большая корзина 2/4 метра, Грузоподъёмность 1000 кг',
    image: '/images/avtovyshka-13m.png',
    link: '/equipment/avtovyshka-13m.html',
    price: 'от 18 000 ₽/смена'
  },
  {
    title: 'Автовышка-платформа 16м',
    subtitle: 'Большая корзина 2/4 метра, Грузоподъёмность 1000 кг',
    image: '/images/avtovyshka-18m.png',
    link: '/equipment/avtovyshka-16m.html',
    price: 'от 20 000 ₽/смена'
  },
  {
    title: 'Автовышка-платформа 21м',
    subtitle: 'Большая корзина 2/4 метра, Грузоподъёмность 1000 кг',
    image: '/images/avtovyshka-21m.png',
    link: '/equipment/avtovyshka-21m.html',
    price: 'от 21 000 ₽/смена'
  },
  {
    title: 'Автовышка телескоп-колено 25м',
    subtitle: 'Корзина 1/2 метра, Грузоподъёмность 300 кг',
    image: '/images/avtovyshka-25m.png',
    link: '/equipment/avtovyshka-25m.html',
    price: 'от 21 000 ₽/смена'
  }
];

// =============================================
// КОНФИГУРАЦИЯ
// =============================================
const SCROLL_SLIDES_CONFIG = {
  scaleRange: 0.25,      // Разница масштаба между активным и неактивным слайдом
  translateYRange: 120,  // Диапазон смещения по Y (в процентах)
  opacityRange: 1.0,     // Диапазон прозрачности
  blurRange: 8,         // Максимальное размытие (px)
  zIndexBase: 10        // Базовый z-index
};

// =============================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================
async function initScrollSlides() {
  const section = document.getElementById('scroll-slides');
  const wrapper = document.getElementById('scroll-slides-wrapper');
  
  if (!section || !wrapper) {
    console.warn('Scroll slides section not found');
    return;
  }
  
  // Загружаем популярные слайды из базы данных
  let slidesData = [];
  
  try {
    const response = await fetch('/api/services');
    if (response.ok) {
      const services = await response.json();
      const popularServices = services
        .filter(service => service.is_popular === 1 || service.is_popular === true)
        .sort((a, b) => (a.popular_order || 999) - (b.popular_order || 999))
        .slice(0, 4);
      
      if (popularServices.length > 0) {
        slidesData = popularServices.map((service) => {
          const specs = service.specifications 
            ? service.specifications.split(',').filter(s => s.trim()).map(s => s.trim())
            : [];
          
          let slideImage = service.image_url || '/images/avtovyshka-13m.png';
          const serviceUrl = (service.url || '').toLowerCase();
          if (!service.image_url) {
            if (serviceUrl.includes('13m')) slideImage = '/images/avtovyshka-13m.png';
            else if (serviceUrl.includes('16m')) slideImage = '/images/avtovyshka-18m.png';
            else if (serviceUrl.includes('21m')) slideImage = '/images/avtovyshka-21m.png';
            else if (serviceUrl.includes('25m')) slideImage = '/images/avtovyshka-25m.png';
          }
          
          let price = service.price || '';
          if (price && !price.toLowerCase().startsWith('от')) {
            price = 'от ' + price;
          }
          
          return {
            title: service.title || '',
            subtitle: specs.join(', ') || '',
            image: slideImage,
            link: service.url || '',
            price: price
          };
        });
      }
    }
  } catch (error) {
    console.error('Error loading popular equipment:', error);
  }
  
  // Если нет данных из API, используем fallback
  if (slidesData.length === 0) {
    slidesData = SCROLL_SLIDES_DATA;
  }
  
  if (slidesData.length === 0) {
    console.warn('No slides data available');
    return;
  }
  
  const slidesCount = slidesData.length;
  const totalSlidesStr = String(slidesCount).padStart(2, '0');
  
  // Создаём слайды
  slidesData.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'scroll-slide';
    slideEl.dataset.index = index;
    
    const slideNumber = String(index + 1).padStart(2, '0');
    const priceHtml = slide.price ? `<p class="scroll-slide-price">${slide.price} <span class="price-vat">без НДС</span></p>` : '';
    const linkHtml = slide.link ? `<a href="${slide.link}" class="scroll-slide-link">Подробнее →</a>` : '';
    
    slideEl.innerHTML = `
      <div class="scroll-slide-bg">
        <img src="${slide.image}" alt="${slide.title}" loading="lazy" />
      </div>
      <div class="scroll-slide-gradient"></div>
      <div class="scroll-slide-counter">${slideNumber}/${totalSlidesStr}</div>
      <div class="scroll-slide-content">
        <h3 class="scroll-slide-title">${slide.title}</h3>
        ${slide.subtitle ? `<p class="scroll-slide-subtitle">${slide.subtitle}</p>` : ''}
        ${priceHtml}
        ${linkHtml}
      </div>
    `;
    
    wrapper.appendChild(slideEl);
  });
  
  const slides = wrapper.querySelectorAll('.scroll-slide');
  
  if (slides.length === 0) {
    console.error('No slides created');
    return;
  }
  
  // =============================================
  // ВЫЧИСЛЕНИЕ ПРОГРЕССА ПРОКРУТКИ
  // =============================================
  /**
   * Вычисляет прогресс прокрутки внутри секции (0.0 - 1.0)
   * @returns {number} Прогресс от 0 до 1
   */
  function calculateScrollProgress() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionTop = rect.top;
    const sectionHeight = rect.height; // 400vh
    
    // Когда секция еще не достигла верха экрана (начало прокрутки)
    if (sectionTop > windowHeight) {
      return 0;
    }
    
    // Когда секция полностью прокручена (конец прокрутки)
    const sectionBottom = sectionTop + sectionHeight;
    if (sectionBottom < 0) {
      return 1;
    }
    
    // Вычисляем прогресс: от момента когда верх секции достиг верха экрана
    // до момента когда низ секции достиг низа экрана
    const startPoint = windowHeight; // когда верх секции на верху экрана
    const endPoint = -sectionHeight + windowHeight; // когда низ секции на верху экрана
    
    // Текущее положение относительно начальной точки
    const scrolled = startPoint - sectionTop;
    const totalScroll = startPoint - endPoint;
    
    // Нормализуем от 0 до 1
    const progress = scrolled / totalScroll;
    
    return Math.max(0, Math.min(1, progress));
  }
  
  // =============================================
  // ВЫЧИСЛЕНИЕ ПОЗИЦИИ И РАССТОЯНИЯ
  // =============================================
  /**
   * Вычисляет позицию слайда на основе прогресса
   * @param {number} progress - Прогресс прокрутки (0.0 - 1.0)
   * @returns {number} Позиция слайда (0.0 = первый, slidesCount - 1 = последний)
   */
  function getSlidePosition(progress) {
    return progress * (slidesCount - 1);
  }
  
  /**
   * Вычисляет расстояние слайда от текущей позиции
   * @param {number} slideIndex - Индекс слайда (0, 1, 2, 3...)
   * @param {number} position - Текущая позиция (0.0 - slidesCount - 1)
   * @returns {number} Расстояние (0 = активный, отрицательное = прошедший, положительное = будущий)
   */
  function getSlideDistance(slideIndex, position) {
    return slideIndex - position;
  }
  
  // =============================================
  // ВЫЧИСЛЕНИЕ СТИЛЕЙ НА ОСНОВЕ DISTANCE
  // =============================================
  /**
   * Вычисляет стили слайда на основе distance
   * @param {number} distance - Расстояние слайда от текущей позиции
   * @returns {Object} Объект со стилями {translateY, scale, opacity, blur, zIndex}
   */
  function getSlideStyles(distance) {
    const CONFIG = SCROLL_SLIDES_CONFIG;
    
    // Ограничиваем distance для плавности
    const clampedDistance = Math.max(-2, Math.min(2, distance));
    const absDistance = Math.abs(clampedDistance);
    
    // Активный слайд (distance близко к 0) - по центру, крупный, видимый
    if (absDistance < 0.5) {
      const activeProgress = absDistance * 2; // 0-1 внутри активной зоны
      return {
        translateY: -50 + (clampedDistance * 15), // Небольшое смещение для плавности
        scale: 1 - (activeProgress * CONFIG.scaleRange * 0.15),
        opacity: Math.max(0.9, 1 - (activeProgress * 0.1)),
        blur: activeProgress * CONFIG.blurRange * 0.15,
        zIndex: CONFIG.zIndexBase + slidesCount + 2
      };
    }
    
    // Прошедшие слайды (distance < 0) - уходят вверх и уменьшаются
    if (clampedDistance < 0) {
      const progress = Math.min(1, absDistance / 1.5); // Нормализуем для плавности
      return {
        translateY: -50 - (progress * 100), // Уходит вверх
        scale: Math.max(0.6, 1 - (progress * CONFIG.scaleRange)),
        opacity: Math.max(0, 1 - (progress * CONFIG.opacityRange * 0.8)),
        blur: Math.min(CONFIG.blurRange, progress * CONFIG.blurRange * 0.6),
        zIndex: CONFIG.zIndexBase + slidesCount - Math.floor(absDistance)
      };
    }
    
    // Будущие слайды (distance > 0) - появляются снизу и увеличиваются
    const progress = Math.min(1, clampedDistance / 1.5); // Нормализуем для плавности
    return {
      translateY: -50 + (progress * CONFIG.translateYRange), // Снизу
      scale: Math.max(0.6, 1 - (progress * CONFIG.scaleRange)),
      opacity: Math.max(0, 1 - (progress * CONFIG.opacityRange * 0.8)),
      blur: Math.min(CONFIG.blurRange, progress * CONFIG.blurRange * 0.6),
      zIndex: CONFIG.zIndexBase + Math.floor(clampedDistance)
    };
  }
  
  // =============================================
  // ОБНОВЛЕНИЕ ПОЗИЦИЙ СЛАЙДОВ
  // =============================================
  /**
   * Обновляет позиции всех слайдов на основе прогресса прокрутки
   */
  function updateSlides() {
    if (!slides || slides.length === 0) return;
    
    const progress = calculateScrollProgress();
    const position = getSlidePosition(progress);
    
    slides.forEach((slide, index) => {
      const distance = getSlideDistance(index, position);
      const styles = getSlideStyles(distance);
      
      // Применяем стили напрямую для плавной интерполяции
      slide.style.transform = `translateX(-50%) translateY(${styles.translateY}%) scale(${styles.scale})`;
      slide.style.opacity = Math.max(0, Math.min(1, styles.opacity));
      slide.style.filter = `blur(${styles.blur}px)`;
      slide.style.zIndex = Math.max(1, styles.zIndex);
      
      // Включаем pointer-events для активного слайда
      if (Math.abs(distance) < 0.5) {
        slide.style.pointerEvents = 'auto';
      } else {
        slide.style.pointerEvents = 'none';
      }
    });
  }
  
  // =============================================
  // ОБРАБОТЧИК ПРОКРУТКИ
  // =============================================
  let rafId = null;
  
  /**
   * Обработчик прокрутки с requestAnimationFrame для плавности
   */
  function handleScroll() {
    if (rafId) return;
    
    rafId = window.requestAnimationFrame(() => {
      updateSlides();
      rafId = null;
    });
  }
  
  /**
   * Настройка обработчика прокрутки
   */
  function setupScrollHandler() {
    if (window.lenis) {
      window.lenis.on('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  setupScrollHandler();
  
  // Переключимся на Lenis, когда он загрузится
  const checkLenis = setInterval(() => {
    if (window.lenis) {
      window.removeEventListener('scroll', handleScroll);
      window.lenis.on('scroll', handleScroll);
      clearInterval(checkLenis);
    }
  }, 100);
  
  // Инициализация при загрузке
  updateSlides();
  
  // Обновление при изменении размера окна
  window.addEventListener('resize', () => {
    updateSlides();
  }, { passive: true });
  
  // Также обновляем после небольшой задержки для надежности
  setTimeout(() => {
    updateSlides();
  }, 100);
}
