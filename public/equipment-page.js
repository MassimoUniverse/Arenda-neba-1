// Анимации и логика для страниц техники с GSAP и Lenis

// Функция для исправления кодировки текста (аналогично server.js)
function fixEncoding(text) {
  if (!text || typeof text !== 'string') return text;
  
  try {
    let fixed = text;
    
    // Удаляем только явно искаженные последовательности, сохраняя нормальные пробелы
    const removeCorruptedSequences = (str) => {
      // Удаляем последовательности типа: РС"РС, PjPC-PC, PC"PC и т.д. (без пробелов между словами)
      str = str.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      str = str.replace(/\[PjPC[^\]]*\][^А-Яа-яЁё\s]*/g, '');
      
      // Удаляем искаженные последовательности после нормальных слов, но сохраняем пробелы между словами
      // Ищем нормальное слово, за которым идет искаженная последовательность БЕЗ нормального текста после
      str = str.replace(/([А-Яа-яЁёA-Za-z0-9]+)([РС"РС•РС\-\[\],PjPC-PC[•PB»\-\[\],]+)(?![А-Яа-яЁёA-Za-z0-9])/g, '$1');
      
      str = str.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•\-]*/g, '');
      str = str.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      str = str.replace(/[РС]"[РС][•\-\[\],\s]*/g, '');
      str = str.replace(/[РС]•[РС][\-\[\],\s]*/g, '');
      return str;
    };
    
    fixed = removeCorruptedSequences(fixed);
    
    // Проверяем признаки неправильной кодировки
    const hasBadEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /РІ,Р/.test(fixed) || 
                          /P[SC]P/.test(fixed) || /PC"PC/.test(fixed) || /PµPSP/.test(fixed) ||
                          /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) || /CŕP»/.test(fixed) ||
                          /РС"РС/.test(fixed) || /PjPC-PC/.test(fixed);
    
    if (hasBadEncoding) {
      // Удаляем пробелы ТОЛЬКО между символами двойной кодировки (Р С -> РС), но НЕ между словами
      // Это должно быть только для случаев типа "Р С" где оба символа являются частью одной буквы
      // НЕ удаляем пробелы между разными словами
      fixed = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
      fixed = fixed.replace(/([PC])\s+([PC])(?![a-zA-Z])/g, '$1$2');
      
      fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/g, '');
      fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/g, '');
      fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/g, '');
      fixed = fixed.replace(/CŕP»CFCFC/g, '');
      fixed = fixed.replace(/PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*/g, '');
      fixed = fixed.replace(/PëCЃPEP°PJPµPSPSPsPiPs\s*C/g, '');
      fixed = fixed.replace(/,PµPECЃC,\s*Po/g, '');
      fixed = fixed.replace(/C,CЋСЂС‹,/g, '');
    }
    
    // Исправляем символ рубля
    fixed = fixed.replace(/в,Ѕ\/смена/gi, '₽/смена');
    fixed = fixed.replace(/Р\/смена/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅа/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅР°/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРмРµРЅ/gi, '₽/смен');
    fixed = fixed.replace(/СЃРјРµРЅа/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅР°/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅ/gi, 'смен');
    fixed = fixed.replace(/в,Ѕ/gi, '₽');
    fixed = fixed.replace(/Р\//g, '₽/');
    fixed = fixed.replace(/РІ,Р/gi, '₽');
    fixed = fixed.replace(/РІ,РЅ/gi, '₽');
    
    // Удаляем проблемные последовательности
    fixed = fixed.replace(/РЎР\s*ВµР\s*В»Р\s*ВµРЎРѓ[PC"PC\s-\[\],•]*/gi, 'Телескопический');
    fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/gi, '');
    fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/gi, '');
    fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/gi, '');
    fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/gi, '');
    fixed = fixed.replace(/Р\s*ВµР\s*В»Р\s*ВµРЎРѓ/gi, 'Телескопический');
    fixed = fixed.replace(/Телескопический[РС"РС•РС\-\[\],\s]*/gi, 'Телескопический');
    fixed = fixed.replace(/Телескопический\[PjPC-PC[•P\sB»\-\[\],]*/gi, 'Телескопический');
    
    // Финальная универсальная очистка - удаляем только искаженные последовательности
    // НЕ удаляем пробелы между нормальными словами
    fixed = fixed.replace(/([А-Яа-яЁёA-Za-z0-9]+)([РС"РС•РС\-\[\],PjPC-PC[•PB»\-\[\],]+)(?![А-Яа-яЁёA-Za-z0-9])/g, '$1');
    fixed = fixed.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    fixed = fixed.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•\-]*/g, '');
    fixed = fixed.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    fixed = fixed.replace(/[РС]"[РС]/g, '');
    fixed = fixed.replace(/PjPC-PC/g, '');
    fixed = fixed.replace(/PC"PC/g, '');
    // Удаляем только искаженные символы с спецсимволами, но сохраняем нормальные пробелы
    fixed = fixed.replace(/[РСPjPC][•\-\[\],]+/g, '');
    
    // Удаляем только множественные пробелы (2+), сохраняя одинарные пробелы между словами
    fixed = fixed.replace(/\s{2,}/g, ' ').trim();
    
    return fixed;
  } catch (error) {
    return text;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // =============================================
  // БУРГЕР-МЕНЮ ДЛЯ МОБИЛЬНЫХ
  // =============================================
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileNav.classList.toggle('open');
    });
    
    // Закрыть меню при клике на ссылку
    const mobileNavLinks = mobileNav.querySelectorAll('a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('open');
      });
    });
    
    // Закрыть меню при клике вне его
    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('open');
      }
    });
  }
  
  // Инициализация Lenis для плавной прокрутки
  let lenis;
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.08,
    });

    // Регистрируем ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
    }

    // Функция анимации для requestAnimationFrame
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    
    // Сохраняем в глобальной области для доступа из других скриптов
    window.lenis = lenis;
  }

  // Инициализация GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Загружаем данные техники из API
  const currentPath = decodeURIComponent(window.location.pathname);
  
  // Устанавливаем изображение по умолчанию сразу (только если нет изображения или это unsplash)
  const defaultImage = document.querySelector('.main-image img, .equipment-image img');
  if (defaultImage && (!defaultImage.src || defaultImage.src.includes('unsplash') || defaultImage.src.includes('http'))) {
    const pathLower = currentPath.toLowerCase();
    let imagePath = '../images/avtovyshka-13m.png';
    
    if (pathLower.includes('13m')) {
      imagePath = '../images/avtovyshka-13m.png';
    } else if (pathLower.includes('15m')) {
      imagePath = '../images/avtovyshka-15m.png';
    } else if (pathLower.includes('16m')) {
      imagePath = '../images/avtovyshka-15m.png'; // Используем 15м для 16м
    } else if (pathLower.includes('17m')) {
      imagePath = '../images/avtovyshka-18m.png'; // Используем 18м для 17м
    } else if (pathLower.includes('18m')) {
      imagePath = '../images/avtovyshka-18m.png';
    } else if (pathLower.includes('21m')) {
      imagePath = '../images/avtovyshka-21m.png';
    } else if (pathLower.includes('25m')) {
      imagePath = '../images/avtovyshka-25m.png';
    } else if (pathLower.includes('29m')) {
      imagePath = '../images/avtovyshka-29m.png';
    } else if (pathLower.includes('45m')) {
      imagePath = '../images/avtovyshka-29m.png'; // Используем 29м для 45м
    } else if (pathLower.includes('vezdehod') || pathLower.includes('вездеход')) {
      imagePath = '../images/avtovyshka-vezdehod-30m.png';
    } else if (pathLower.includes('samohodnaya') || pathLower.includes('самоходная')) {
      imagePath = '../images/avtovyshka-13m.png';
    } else {
      imagePath = '../images/avtovyshka-13m.png'; // Fallback
    }
    
    defaultImage.src = imagePath;
    const thumbs = document.querySelectorAll('.gallery-thumbnails img');
    if (thumbs.length > 0) {
      thumbs[0].src = imagePath;
    }
  }
  
  try {
    const apiUrl = `/api/services/url${currentPath}`;
    console.log('📡 Fetching service data from:', apiUrl);
    console.log('   currentPath:', currentPath);
    
    const response = await fetch(apiUrl);
    console.log('   Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('   Error response:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    
    if (response.ok) {
      const service = await response.json();
      console.log('✅ Service data received:', {
        title: service.title,
        has_image_url: !!service.image_url,
        image_url: service.image_url,
        has_images: !!service.images,
        images: service.images,
        images_type: typeof service.images,
        images_isArray: Array.isArray(service.images),
        has_reach_diagrams: !!service.reach_diagrams,
        reach_diagrams: service.reach_diagrams,
        reach_diagrams_type: typeof service.reach_diagrams,
        reach_diagrams_isArray: Array.isArray(service.reach_diagrams),
        has_reach_diagram_url: !!service.reach_diagram_url,
        reach_diagram_url: service.reach_diagram_url
      });
      
      // Применяем fixEncoding ко всем текстовым полям
      const fixedService = {
        ...service,
        title: service.title ? fixEncoding(service.title) : service.title,
        description: service.description ? fixEncoding(service.description) : service.description,
        price: service.price ? fixEncoding(service.price) : service.price,
        height_lift: service.height_lift ? fixEncoding(service.height_lift) : service.height_lift,
        max_reach: service.max_reach ? fixEncoding(service.max_reach) : service.max_reach,
        max_capacity: service.max_capacity ? fixEncoding(service.max_capacity) : service.max_capacity,
        lift_type: service.lift_type ? fixEncoding(service.lift_type) : service.lift_type,
        basket_size: service.basket_size ? fixEncoding(service.basket_size) : service.basket_size,
        voltage: service.voltage ? fixEncoding(service.voltage) : service.voltage,
        maneuverability: service.maneuverability ? fixEncoding(service.maneuverability) : service.maneuverability,
        setup_time: service.setup_time ? fixEncoding(service.setup_time) : service.setup_time,
        transport_length: service.transport_length ? fixEncoding(service.transport_length) : service.transport_length,
        transport_height: service.transport_height ? fixEncoding(service.transport_height) : service.transport_height,
        width: service.width ? fixEncoding(service.width) : service.width,
        boom_rotation_angle: service.boom_rotation_angle ? fixEncoding(service.boom_rotation_angle) : service.boom_rotation_angle,
        basket_rotation_angle: service.basket_rotation_angle ? fixEncoding(service.basket_rotation_angle) : service.basket_rotation_angle
      };
      
      // Обновляем заголовок страницы
      const titleEl = document.querySelector('.equipment-title, h1');
      if (titleEl && fixedService.title) {
        titleEl.textContent = fixedService.title;
      }
      
      // Обновляем описание
      const descriptionEl = document.querySelector('.equipment-description, .equipment-intro p');
      if (descriptionEl && fixedService.description) {
        descriptionEl.textContent = fixedService.description;
      }
      
      // Обновляем характеристики из новых полей
      const specsGrid = document.querySelector('.specs-grid');
      if (specsGrid) {
        specsGrid.innerHTML = '';
        
        const specs = [
          { icon: '📏', label: 'Высота подъема', value: fixedService.height_lift },
          { icon: '📐', label: 'Вылет стрелы', value: fixedService.max_reach },
          { icon: '⚖️', label: 'Грузоподъемность корзины', value: fixedService.max_capacity },
          { icon: '📦', label: 'Размер корзины (платформы)', value: fixedService.basket_size },
          { icon: '🚗', label: 'Тип', value: fixedService.lift_type },
          { icon: '🔋', label: 'Напряжение', value: fixedService.voltage },
          { icon: '🎯', label: 'Маневренность', value: fixedService.maneuverability },
          { icon: '⏱️', label: 'Время установки', value: fixedService.setup_time },
          { icon: '📏', label: 'Длина в транспортном положении', value: fixedService.transport_length },
          { icon: '📏', label: 'Высота в транспортном положении', value: fixedService.transport_height },
          { icon: '📏', label: 'Ширина', value: fixedService.width },
          { icon: '🔄', label: 'Угол поворота стрелы', value: fixedService.boom_rotation_angle },
          { icon: '🔄', label: 'Угол поворота корзины', value: fixedService.basket_rotation_angle }
        ];
        
        specs.forEach(spec => {
          if (spec.value) {
            const specItem = document.createElement('div');
            specItem.className = 'spec-item';
            specItem.innerHTML = `
              <div class="spec-icon">${spec.icon}</div>
              <div class="spec-info">
                <div class="spec-label">${spec.label}</div>
                <div class="spec-value">${spec.value}</div>
              </div>
            `;
            specsGrid.appendChild(specItem);
          }
        });
      }
      
      // Обновляем цены в таблице стоимости
      const pricingTable = document.querySelector('.pricing-table');
      if (pricingTable) {
        // Парсим цены из строки
        let priceHalfShift = '';
        let priceShift = '';
        const deliveryPerKm = fixedService.delivery_per_km || 85;
        
        if (fixedService.price) {
          const halfShiftMatch = fixedService.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
          if (halfShiftMatch) {
            priceHalfShift = halfShiftMatch[1].replace(/\s/g, '');
          }
          
          const shiftMatch = fixedService.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
          if (shiftMatch) {
            priceShift = shiftMatch[1].replace(/\s/g, '');
          } else {
            // Если нет цены за смену в строке, пробуем найти любое число
            const anyPriceMatch = fixedService.price.match(/(\d+[\s\d]*)/);
            if (anyPriceMatch) {
              priceShift = anyPriceMatch[1].replace(/\s/g, '');
            }
          }
        }
        
        // ВАЖНО: Если цена за полсмену не найдена, но есть цена за смену, вычисляем как 83% от смены
        if (!priceHalfShift && priceShift) {
          const shiftNum = parseInt(priceShift.replace(/\s/g, ''), 10);
          if (shiftNum && shiftNum > 0) {
            priceHalfShift = Math.round(shiftNum * 0.83).toString();
            console.log('💡 Цена за полсмену вычислена как 83% от смены:', priceHalfShift);
          }
        }
        
        // Если цена за смену не найдена, но есть цена за полсмену, вычисляем смену
        if (!priceShift && priceHalfShift) {
          const halfShiftNum = parseInt(priceHalfShift.replace(/\s/g, ''), 10);
          if (halfShiftNum && halfShiftNum > 0) {
            priceShift = Math.round(halfShiftNum / 0.83).toString();
            console.log('💡 Цена за смену вычислена из полсмены:', priceShift);
          }
        }
        
        // Если обе цены не найдены, используем значения по умолчанию
        if (!priceShift) {
          priceShift = '18000';
          priceHalfShift = Math.round(18000 * 0.83).toString();
          console.warn('⚠️ Цены не найдены, используются значения по умолчанию');
        } else if (!priceHalfShift) {
          // Если есть только смена, вычисляем полсмену
          const shiftNum = parseInt(priceShift.replace(/\s/g, ''), 10);
          if (shiftNum && shiftNum > 0) {
            priceHalfShift = Math.round(shiftNum * 0.83).toString();
          }
        }
        
        pricingTable.innerHTML = '';
        
        // ВСЕГДА показываем цену за полсмену, если она вычислена
        if (priceHalfShift) {
          const row = document.createElement('div');
          row.className = 'pricing-row';
          row.innerHTML = `
            <span>Полсмены (3+1 часа)</span>
            <span class="pricing-value">${parseInt(priceHalfShift).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
          `;
          pricingTable.appendChild(row);
        }
        
        // ВСЕГДА показываем цену за смену
        if (priceShift) {
          const row = document.createElement('div');
          row.className = 'pricing-row';
          row.innerHTML = `
            <span>1 смена (8 часов)</span>
            <span class="pricing-value">${parseInt(priceShift).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
          `;
          pricingTable.appendChild(row);
        }
        
        const deliveryRow = document.createElement('div');
        deliveryRow.className = 'pricing-row';
        deliveryRow.innerHTML = `
          <span>Подача техники (за КАД)</span>
          <span class="pricing-value">${deliveryPerKm} ₽/км × 2 (в каждую сторону)</span>
        `;
        pricingTable.appendChild(deliveryRow);
      }
      
      // Обновляем цену в заголовке (если есть)
      const priceEls = document.querySelectorAll('.price-value');
      if (priceEls.length && fixedService.price) {
        // Показываем только цену за смену в заголовке
        const shiftMatch = fixedService.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
        if (shiftMatch) {
          const shiftPrice = parseInt(shiftMatch[1].replace(/\s/g, ''));
          priceEls.forEach(el => {
            el.innerHTML = `${shiftPrice.toLocaleString('ru-RU')} ₽ / смена <span class="price-vat">без НДС</span>`;
          });
        } else {
          priceEls.forEach(el => {
            el.textContent = fixedService.price;
          });
        }
      }
      
      // Обновляем изображение и галерею
      const imgEl = document.querySelector('.main-image img, .equipment-image img');
      const thumbsContainer = document.querySelector('.gallery-thumbnails');
      
      console.log('🖼️ Processing images:', {
        has_imgEl: !!imgEl,
        has_thumbsContainer: !!thumbsContainer,
        service_image_url: service.image_url,
        service_images: service.images,
        service_images_type: typeof service.images
      });
      
      // Функция для добавления параметра обхода кэша к URL изображения
      function addCacheBuster(url, updatedAt) {
        if (!url) return url;
        // Если URL уже содержит параметры запроса, добавляем timestamp
        // Если нет, добавляем ?v=timestamp
        const separator = url.includes('?') ? '&' : '?';
        // Используем timestamp последнего обновления услуги или текущее время
        let timestamp;
        if (updatedAt) {
          // Преобразуем дату в timestamp (если это строка даты)
          try {
            const date = new Date(updatedAt);
            timestamp = date.getTime();
          } catch (e) {
            timestamp = Date.now();
          }
        } else {
          timestamp = Date.now();
        }
        return url + separator + 'v=' + timestamp;
      }
      
      // Функция для получения изображения из базы данных (аналогично getImageForService из script.js)
      // Но с учетом относительных путей для страниц оборудования
      function getImageForEquipmentPage(service, useCacheBuster = true) {
        const updatedAt = service.updated_at || service.updatedAt;
        let imageUrl = null;
        
        // Приоритет 1: image_url из базы данных
        if (service.image_url) {
          imageUrl = service.image_url;
          
          // Преобразуем localhost URL в относительный путь
          if (imageUrl.startsWith('http://localhost:3000/') || imageUrl.startsWith('http://127.0.0.1:3000/')) {
            imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
          
          // Если это полный внешний URL, оставляем как есть (без cache buster для внешних URL)
          if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
            return imageUrl;
          }
          
          // Преобразуем абсолютный путь в относительный для страниц оборудования
          if (imageUrl.startsWith('/images/')) {
            imageUrl = '..' + imageUrl;
          } else if (imageUrl.startsWith('/uploads/')) {
            imageUrl = '..' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = '..' + imageUrl;
          } else {
            imageUrl = '../' + imageUrl;
          }
        }
        
        // Приоритет 2: первое изображение из массива images
        if (!imageUrl && service.images && Array.isArray(service.images) && service.images.length > 0) {
          const firstImage = service.images[0];
          let imgUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
          
          // Преобразуем localhost URL в относительный путь
          if (imgUrl.startsWith('http://localhost:3000/') || imgUrl.startsWith('http://127.0.0.1:3000/')) {
            imgUrl = imgUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
          
          // Если это полный внешний URL, оставляем как есть (без cache buster для внешних URL)
          if (imgUrl.startsWith('https://') || imgUrl.startsWith('http://')) {
            return imgUrl;
          }
          
          // Преобразуем абсолютный путь в относительный для страниц оборудования
          if (imgUrl.startsWith('/images/')) {
            imageUrl = '..' + imgUrl;
          } else if (imgUrl.startsWith('/uploads/')) {
            imageUrl = '..' + imgUrl;
          } else if (imgUrl.startsWith('/')) {
            imageUrl = '..' + imgUrl;
          } else {
            imageUrl = '../' + imgUrl;
          }
        }
        
        // Приоритет 3: определяем по URL страницы (fallback)
        if (!imageUrl) {
          const currentPath = window.location.pathname.toLowerCase();
          if (currentPath.includes('13m')) {
            imageUrl = '../images/avtovyshka-13m.png';
          } else if (currentPath.includes('15m')) {
            imageUrl = '../images/avtovyshka-15m.png';
          } else if (currentPath.includes('16m')) {
            imageUrl = '../images/avtovyshka-15m.png';
          } else if (currentPath.includes('17m')) {
            imageUrl = '../images/avtovyshka-18m.png';
          } else if (currentPath.includes('18m')) {
            imageUrl = '../images/avtovyshka-18m.png';
          } else if (currentPath.includes('21m')) {
            imageUrl = '../images/avtovyshka-21m.png';
          } else if (currentPath.includes('25m')) {
            imageUrl = '../images/avtovyshka-25m.png';
          } else if (currentPath.includes('29m')) {
            imageUrl = '../images/avtovyshka-29m.png';
          } else if (currentPath.includes('45m')) {
            imageUrl = '../images/avtovyshka-29m.png';
          } else if (currentPath.includes('vezdehod') || currentPath.includes('вездеход')) {
            imageUrl = '../images/avtovyshka-vezdehod-30m.png';
          } else if (currentPath.includes('samohodnaya') || currentPath.includes('самоходная')) {
            imageUrl = '../images/avtovyshka-13m.png';
          } else {
            // Fallback
            imageUrl = '../images/avtovyshka-13m.png';
          }
        }
        
        // Если нашли изображение, добавляем параметр обхода кэша
        if (imageUrl && useCacheBuster) {
          return addCacheBuster(imageUrl, updatedAt);
        }
        
        return imageUrl;
      }
      
      // Собираем все изображения: основное + дополнительные
      let allImages = [];
      
      // Сначала обрабатываем массив изображений (чтобы определить основное)
      let imagesArray = [];
      if (service.images) {
        // Если это строка (JSON), парсим её
        if (typeof service.images === 'string') {
          try {
            imagesArray = JSON.parse(service.images);
            console.log('  ✅ Parsed images JSON:', imagesArray);
          } catch (e) {
            console.warn('  ⚠️ Failed to parse images JSON:', e);
            // Если не JSON, возможно это одна строка с URL
            if (service.images.trim()) {
              imagesArray = [service.images];
            }
          }
        } else if (Array.isArray(service.images)) {
          imagesArray = service.images;
          console.log('  ✅ Images is already an array:', imagesArray);
        }
      }
      
      // Используем функцию для получения основного изображения из базы данных (приоритет)
      // Эта функция правильно обрабатывает image_url и массив images
      const mainImage = getImageForEquipmentPage(service);
      if (mainImage) {
        allImages.push(mainImage);
        console.log('  ✅ Added main image from database:', mainImage);
      }
      
      // Добавляем дополнительные фото из массива images, исключая основное (если оно уже есть)
      if (Array.isArray(imagesArray) && imagesArray.length > 0) {
        imagesArray.forEach(imgUrl => {
          // Нормализуем URL (убираем лишние пробелы)
          let normalizedUrl = typeof imgUrl === 'string' ? imgUrl.trim() : (imgUrl.url || imgUrl).trim();
          
          // Преобразуем localhost URL в относительный путь
          if (normalizedUrl.startsWith('http://localhost:3000/') || normalizedUrl.startsWith('http://127.0.0.1:3000/')) {
            normalizedUrl = normalizedUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
          
          // Если это полный внешний URL, оставляем как есть
          if (!normalizedUrl.startsWith('https://') && !normalizedUrl.startsWith('http://')) {
            // Преобразуем абсолютные пути в относительные для страниц оборудования
            if (normalizedUrl.startsWith('/images/')) {
              normalizedUrl = '..' + normalizedUrl;
            } else if (normalizedUrl.startsWith('/uploads/')) {
              normalizedUrl = '..' + normalizedUrl;
            } else if (normalizedUrl.startsWith('/')) {
              normalizedUrl = '..' + normalizedUrl;
            } else if (!normalizedUrl.startsWith('../')) {
              normalizedUrl = '../' + normalizedUrl;
            }
          }
          
          // Проверяем, что это не дубликат основного изображения
          const isDuplicate = allImages.some(existing => {
            // Сравниваем без учета ../, / и домена
            const existingClean = existing.replace(/^\.\.\//, '').replace(/^\//, '').replace(/^https?:\/\/[^\/]+/, '');
            const normalizedClean = normalizedUrl.replace(/^\.\.\//, '').replace(/^\//, '').replace(/^https?:\/\/[^\/]+/, '');
            return existingClean === normalizedClean;
          });
          
          if (normalizedUrl && !isDuplicate) {
            allImages.push(normalizedUrl);
            console.log('  ✅ Added additional image:', normalizedUrl);
          }
        });
      }
      
      console.log('📸 Final allImages array:', allImages);
      
      // Если есть изображения, отображаем их
      if (allImages.length > 0) {
        // Текущий индекс изображения
        let currentImageIndex = 0;
        
        // Функция для нормализации URL изображения
        const normalizeImageUrl = (url) => {
          if (!url) return url;
          if (url.startsWith('http')) return url;
          if (url.startsWith('/') || url.startsWith('../')) return url;
          return '/' + url;
        };
        
        // Функция для установки главного изображения
        const setMainImage = (index) => {
          if (index < 0 || index >= allImages.length) return;
          currentImageIndex = index;
          
          if (imgEl) {
            const imageUrl = normalizeImageUrl(allImages[index]);
            imgEl.src = imageUrl;
            imgEl.alt = `${service.title} - вид ${index + 1}`;
            
            // Обновляем активную миниатюру
            if (thumbsContainer) {
              const thumbs = thumbsContainer.querySelectorAll('img');
              thumbs.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
              });
            }
            
            // Обновляем состояние кнопок навигации
            updateMainImageNav();
          }
        };
        
        // Функция для обновления состояния кнопок навигации главного изображения
        const updateMainImageNav = () => {
          const mainImageContainer = imgEl?.parentElement;
          if (!mainImageContainer) return;
          
          const prevBtn = mainImageContainer.querySelector('.main-image-nav.prev');
          const nextBtn = mainImageContainer.querySelector('.main-image-nav.next');
          
          if (prevBtn) prevBtn.disabled = currentImageIndex === 0;
          if (nextBtn) nextBtn.disabled = currentImageIndex === allImages.length - 1;
        };
        
        // Устанавливаем первое изображение как главное
        if (imgEl) {
          const mainImageContainer = imgEl.parentElement;
          
          // Создаем кнопки навигации для главного изображения, если их еще нет
          let mainPrevBtn = mainImageContainer.querySelector('.main-image-nav.prev');
          let mainNextBtn = mainImageContainer.querySelector('.main-image-nav.next');
          
          if (!mainPrevBtn && allImages.length > 1) {
            mainPrevBtn = document.createElement('button');
            mainPrevBtn.className = 'main-image-nav prev';
            mainPrevBtn.innerHTML = '‹';
            mainPrevBtn.setAttribute('aria-label', 'Предыдущее фото');
            mainPrevBtn.onclick = (e) => {
              e.stopPropagation();
              if (currentImageIndex > 0) {
                setMainImage(currentImageIndex - 1);
              }
            };
            mainImageContainer.appendChild(mainPrevBtn);
          }
          
          if (!mainNextBtn && allImages.length > 1) {
            mainNextBtn = document.createElement('button');
            mainNextBtn.className = 'main-image-nav next';
            mainNextBtn.innerHTML = '›';
            mainNextBtn.setAttribute('aria-label', 'Следующее фото');
            mainNextBtn.onclick = (e) => {
              e.stopPropagation();
              if (currentImageIndex < allImages.length - 1) {
                setMainImage(currentImageIndex + 1);
              }
            };
            mainImageContainer.appendChild(mainNextBtn);
          }
          
          // Устанавливаем первое изображение
          setMainImage(0);
          
          // Добавляем обработчик клика для просмотра в полноэкранном режиме
          imgEl.style.cursor = 'pointer';
          imgEl.addEventListener('click', function() {
            openImageFullscreen(allImages, currentImageIndex, service.title);
          });
          
          // Обработка ошибок загрузки изображения
          imgEl.onerror = function() {
            console.warn('❌ Failed to load main image:', this.src);
            // Используем fallback изображение
            const fallbackImage = '../images/avtovyshka-13m.png';
            if (this.src !== fallbackImage) {
              this.src = fallbackImage;
            }
            this.onerror = null; // Предотвращаем бесконечный цикл
          };
          imgEl.onload = function() {
            console.log('✅ Main image loaded successfully:', this.src);
          };
        }
        
        // Обновляем миниатюры с навигацией
        if (thumbsContainer) {
          // Проверяем, есть ли уже обертка
          let galleryWrapper = thumbsContainer.parentElement;
          if (!galleryWrapper.classList.contains('gallery-thumbnails-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'gallery-thumbnails-wrapper';
            thumbsContainer.parentElement.insertBefore(wrapper, thumbsContainer);
            wrapper.appendChild(thumbsContainer);
            galleryWrapper = wrapper;
          }
          
          // Очищаем только миниатюры, не трогая кнопки
          const existingThumbs = thumbsContainer.querySelectorAll('img');
          existingThumbs.forEach(thumb => thumb.remove());
          
          // Создаем кнопки навигации, если их еще нет
          let prevBtn = galleryWrapper.querySelector('.gallery-thumbnails-nav.prev');
          let nextBtn = galleryWrapper.querySelector('.gallery-thumbnails-nav.next');
          
          if (!prevBtn) {
            prevBtn = document.createElement('button');
            prevBtn.className = 'gallery-thumbnails-nav prev';
            prevBtn.innerHTML = '‹';
            prevBtn.setAttribute('aria-label', 'Предыдущее фото');
            galleryWrapper.insertBefore(prevBtn, thumbsContainer);
          }
          
          if (!nextBtn) {
            nextBtn = document.createElement('button');
            nextBtn.className = 'gallery-thumbnails-nav next';
            nextBtn.innerHTML = '›';
            nextBtn.setAttribute('aria-label', 'Следующее фото');
            galleryWrapper.appendChild(nextBtn);
          }
          
          // Функция прокрутки миниатюр
          const scrollThumbnails = (direction) => {
            const scrollAmount = 200;
            const currentScroll = thumbsContainer.scrollLeft;
            const newScroll = direction === 'prev' 
              ? currentScroll - scrollAmount 
              : currentScroll + scrollAmount;
            thumbsContainer.scrollTo({
              left: newScroll,
              behavior: 'smooth'
            });
          };
          
          // Обновляем состояние кнопок
          const updateNavButtons = () => {
            const canScrollLeft = thumbsContainer.scrollLeft > 0;
            const canScrollRight = thumbsContainer.scrollLeft < (thumbsContainer.scrollWidth - thumbsContainer.clientWidth - 1);
            if (prevBtn) prevBtn.disabled = !canScrollLeft;
            if (nextBtn) nextBtn.disabled = !canScrollRight;
          };
          
          if (prevBtn) prevBtn.onclick = () => scrollThumbnails('prev');
          if (nextBtn) nextBtn.onclick = () => scrollThumbnails('next');
          thumbsContainer.addEventListener('scroll', updateNavButtons);
          
          // Создаем миниатюры
          allImages.forEach((imgUrl, index) => {
            const thumb = document.createElement('img');
            // Убеждаемся, что URL правильный (добавляем / если нужно)
            let normalizedUrl = imgUrl;
            if (normalizedUrl && !normalizedUrl.startsWith('http') && !normalizedUrl.startsWith('/') && !normalizedUrl.startsWith('../')) {
              normalizedUrl = '/' + normalizedUrl;
            }
            thumb.src = normalizedUrl;
            thumb.alt = `${service.title} - вид ${index + 1}`;
            thumb.className = index === 0 ? 'active' : '';
            thumb.style.cursor = 'pointer';
            thumb.onclick = function(e) {
              e.stopPropagation();
              // Устанавливаем главное изображение по индексу
              setMainImage(index);
            };
            thumb.onerror = function() {
              console.warn('Failed to load thumbnail:', normalizedUrl);
              // Если изображение не загрузилось, скрываем миниатюру
              thumb.style.display = 'none';
            };
            thumb.onload = function() {
              console.log('✅ Thumbnail loaded:', normalizedUrl);
              updateNavButtons(); // Обновляем кнопки после загрузки
            };
            thumbsContainer.appendChild(thumb);
          });
          
          // Убеждаемся, что контейнер видим
          thumbsContainer.style.display = 'flex';
          
          // Инициализируем состояние кнопок
          setTimeout(updateNavButtons, 100);
          console.log('✅ Created', allImages.length, 'thumbnails with navigation');
        }
      }
      
      // Обновляем схемы вылета стрелы (поддержка нескольких)
      const diagramsContainer = document.getElementById('reachDiagramsContainer');
      const diagramsGrid = document.getElementById('reachDiagramsGrid');
      
      console.log('🔍 Looking for reach diagrams containers:', {
        diagramsContainer: !!diagramsContainer,
        diagramsGrid: !!diagramsGrid,
        containerElement: diagramsContainer,
        gridElement: diagramsGrid
      });
      
      if (diagramsContainer && diagramsGrid) {
        // Очищаем предыдущие схемы
        diagramsGrid.innerHTML = '';
        
        // Поддержка нескольких схем через массив или одну схему
        let diagrams = [];
        if (service.reach_diagrams) {
          if (Array.isArray(service.reach_diagrams)) {
            // Если есть массив схем (проверяем, что он не пустой)
            if (service.reach_diagrams.length > 0) {
              diagrams = service.reach_diagrams.map(d => {
                // Нормализуем данные: если элемент - строка, преобразуем в объект
                if (typeof d === 'string') {
                  return { url: d, title: 'Схема вылета стрелы' };
                } else if (d && typeof d === 'object') {
                  return { 
                    url: d.url || d, 
                    title: d.title || 'Схема вылета стрелы' 
                  };
                }
                return null;
              }).filter(d => d !== null && d.url);
            }
          } else if (typeof service.reach_diagrams === 'string' && service.reach_diagrams.trim()) {
            // Если это строка (старый формат или неправильно распарсенный JSON)
            try {
              const parsed = JSON.parse(service.reach_diagrams);
              if (Array.isArray(parsed) && parsed.length > 0) {
                diagrams = parsed.map(d => {
                  if (typeof d === 'string') {
                    return { url: d, title: 'Схема вылета стрелы' };
                  } else if (d && typeof d === 'object') {
                    return { 
                      url: d.url || d, 
                      title: d.title || 'Схема вылета стрелы' 
                    };
                  }
                  return null;
                }).filter(d => d !== null && d.url);
              }
            } catch (e) {
              // Если не JSON, считаем это одной схемой
              diagrams = [{ url: service.reach_diagrams, title: 'Схема вылета стрелы' }];
            }
          }
        }
        
        // Если массив пустой, проверяем старый формат reach_diagram_url
        if (diagrams.length === 0 && service.reach_diagram_url) {
          diagrams = [{ url: service.reach_diagram_url, title: 'Схема вылета стрелы' }];
        }
        
        console.log('🔍 Processing reach diagrams:', {
          service_reach_diagrams: service.reach_diagrams,
          service_reach_diagrams_type: typeof service.reach_diagrams,
          service_reach_diagrams_isArray: Array.isArray(service.reach_diagrams),
          service_reach_diagram_url: service.reach_diagram_url,
          diagrams_found: diagrams.length,
          diagrams: diagrams
        });
        
        if (diagrams.length > 0) {
          console.log('✅ Found', diagrams.length, 'diagrams, rendering...');
          diagrams.forEach((diagram, index) => {
            const diagramItem = document.createElement('div');
            diagramItem.className = 'reach-diagram-item';
            
            const img = document.createElement('img');
            let imageUrl = diagram.url || diagram;
            
            // Преобразуем localhost URL в относительный путь
            if (imageUrl.startsWith('http://localhost:') || imageUrl.startsWith('http://127.0.0.1:') || imageUrl.startsWith('https://localhost:')) {
              imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            
            // Удаляем любой домен, оставляем только путь
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            
            // Если это относительный путь без начального слэша, добавляем его
            if (!imageUrl.startsWith('/') && !imageUrl.startsWith('../')) {
              imageUrl = '/' + imageUrl;
            }
            
            // Преобразуем абсолютный путь в относительный для страниц оборудования
            if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
              imageUrl = '..' + imageUrl;
            }
            
            console.log(`  📸 Creating diagram ${index + 1}:`, imageUrl);
            img.src = imageUrl;
            img.alt = diagram.title || `Схема вылета стрелы ${index + 1}`;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.cursor = 'pointer';
            
            // Добавляем обработчик клика для открытия в полноэкранном режиме
            img.addEventListener('click', function() {
              openDiagramFullscreen(imageUrl, diagram.title || `Схема вылета стрелы ${index + 1}`);
            });
            
            img.onerror = function() {
              console.error('❌ Failed to load reach diagram:', imageUrl);
              diagramItem.style.display = 'none';
            };
            img.onload = function() {
              console.log('✅ Successfully loaded reach diagram:', imageUrl);
            };
            
            diagramItem.appendChild(img);
            
            if (diagram.title && diagram.title !== 'Схема вылета стрелы') {
              const title = document.createElement('div');
              title.className = 'reach-diagram-item-title';
              title.textContent = diagram.title;
              diagramItem.appendChild(title);
            }
            
            diagramsGrid.appendChild(diagramItem);
            console.log(`  ✅ Diagram ${index + 1} added to grid`);
          });
          
          diagramsContainer.style.display = 'block';
          diagramsContainer.style.visibility = 'visible';
          console.log('✅ Displayed', diagrams.length, 'reach diagrams. Container display:', diagramsContainer.style.display);
        } else {
          diagramsContainer.style.display = 'none';
          console.warn('⚠️ No reach diagrams found for service');
        }
      } else {
        console.error('❌ Reach diagrams container not found in DOM');
        console.log('Available IDs:', {
          diagramsContainer: !!document.getElementById('reachDiagramsContainer'),
          diagramsGrid: !!document.getElementById('reachDiagramsGrid')
        });
      }
      
      // Инициализируем мини-калькулятор для этой техники
      initEquipmentCalculator(service);
      
      // Убеждаемся, что форма заказа видна после загрузки данных
      ensureFormVisible();
      
      // Если нет изображений из API, используем локальное по умолчанию
      if (allImages.length === 0) {
        const imgEl = document.querySelector('.main-image img, .equipment-image img');
        const thumbsContainer = document.querySelector('.gallery-thumbnails');
        if (imgEl) {
          // Определяем, какое изображение использовать по URL страницы
          const currentPath = window.location.pathname.toLowerCase();
          let defaultImage = '../images/avtovyshka-13m.png';
          
          if (currentPath.includes('13m')) {
            defaultImage = '../images/avtovyshka-13m.png';
          } else if (currentPath.includes('15m')) {
            defaultImage = '../images/avtovyshka-15m.png';
          } else if (currentPath.includes('16m')) {
            defaultImage = '../images/avtovyshka-15m.png'; // Используем 15м как fallback для 16м
          } else if (currentPath.includes('18m')) {
            defaultImage = '../images/avtovyshka-18m.png';
          } else if (currentPath.includes('21m')) {
            defaultImage = '../images/avtovyshka-21m.png';
          } else if (currentPath.includes('25m')) {
            defaultImage = '../images/avtovyshka-25m.png';
          } else if (currentPath.includes('29m')) {
            defaultImage = '../images/avtovyshka-29m.png';
          } else if (currentPath.includes('45m')) {
            defaultImage = '../images/avtovyshka-29m.png'; // Используем 29м как fallback для 45м
          } else if (currentPath.includes('vezdehod') || currentPath.includes('вездеход')) {
            defaultImage = '../images/avtovyshka-vezdehod-30m.png';
          } else {
            defaultImage = '../images/avtovyshka-13m.png';
          }
          
          imgEl.src = defaultImage;
          if (thumbsContainer) {
            const existingThumbs = thumbsContainer.querySelectorAll('img');
            if (existingThumbs.length > 0) {
              existingThumbs[0].src = defaultImage;
            } else {
              const thumb = document.createElement('img');
              thumb.src = defaultImage;
              thumb.alt = 'Вид 1';
              thumb.className = 'active';
              thumbsContainer.appendChild(thumb);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading equipment data:', error);
  }
  
  // Инициализируем калькулятор в любом случае (после загрузки DOM)
  setTimeout(() => {
    const priceEl = document.querySelector('.price-value');
    const defaultService = {
      price: priceEl ? priceEl.textContent : '18 000 ₽ / смена'
    };
    initEquipmentCalculator(defaultService);
  }, 100);

  // =============================================
  // HEADER ANIMATION (как на главной странице)
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
  // PAGE LOAD ANIMATIONS (GSAP)
  // =============================================
  function initPageAnimations() {
    if (typeof gsap === 'undefined') {
      console.warn('GSAP is not loaded. Page animations will not work.');
      return;
    }

    console.log('Initializing page load animations with GSAP');

    // Анимация появления хедера
    const header = document.querySelector('.site-header, .navbar');
    if (header) {
      gsap.from(header, {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    // Анимация хлебных крошек
    const breadcrumbs = document.querySelector('.breadcrumbs');
    if (breadcrumbs) {
      gsap.from(breadcrumbs, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power2.out'
      });
    }

    // Анимация заголовка
    const title = document.querySelector('.equipment-header h1, .equipment-title');
    if (title) {
      gsap.from(title, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.3,
        ease: 'power2.out'
      });
    }

    // Анимация изображения
    const mainImage = document.querySelector('.main-image img, .equipment-image img');
    if (mainImage) {
      gsap.from(mainImage, {
        scale: 0.95,
        opacity: 0,
        duration: 1,
        delay: 0.4,
        ease: 'power2.out'
      });
    }

    // Анимация контента (stagger) - исключаем форму заказа
    const infoSections = document.querySelectorAll('.info-section');
    if (infoSections.length > 0) {
      const trigger = document.querySelector('.equipment-content, .equipment-info');
      if (trigger && typeof ScrollTrigger !== 'undefined') {
        gsap.from(infoSections, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          delay: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: trigger,
            start: 'top 80%',
            once: true
          }
        });
      } else {
        // Fallback без ScrollTrigger
        gsap.from(infoSections, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          delay: 0.5,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    }

    // Анимация карточек преимуществ
    const advantageCards = document.querySelectorAll('.advantage-card');
    if (advantageCards.length > 0) {
      const trigger = document.querySelector('.advantages-grid');
      if (trigger && typeof ScrollTrigger !== 'undefined') {
        gsap.from(advantageCards, {
          scale: 0.9,
          opacity: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: trigger,
            start: 'top 80%',
            once: true
          }
        });
      } else {
        // Fallback без ScrollTrigger
        gsap.from(advantageCards, {
          scale: 0.9,
          opacity: 0,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.6
        });
      }
    }

    // Анимация формы - используем fromTo чтобы явно установить финальное состояние
    const orderForm = document.querySelector('.equipment-order-form');
    if (orderForm) {
      // Убеждаемся, что форма видна перед анимацией
      gsap.set(orderForm, { opacity: 1, visibility: 'visible', display: 'block' });
      
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(orderForm, 
          {
            y: 30,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: orderForm,
              start: 'top 80%',
              once: true
            }
          }
        );
      } else {
        // Fallback без ScrollTrigger
        gsap.fromTo(orderForm,
          {
            y: 30,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            delay: 0.7,
            ease: 'power2.out'
          }
        );
      }
    }

    // Анимация калькулятора
    const calculator = document.getElementById('equipmentCalculator');
    if (calculator) {
      gsap.from(calculator, {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: 'power2.out'
      });
    }

    console.log('Page load animations initialized');
  }

  // Функция для обеспечения видимости формы заказа
  function ensureFormVisible() {
    const orderForm = document.querySelector('.equipment-order-form');
    if (orderForm) {
      // Устанавливаем явные стили для видимости
      orderForm.style.display = 'block';
      orderForm.style.visibility = 'visible';
      orderForm.style.opacity = '1';
      
      // Если GSAP доступен, устанавливаем финальное состояние
      if (typeof gsap !== 'undefined') {
        gsap.set(orderForm, { 
          opacity: 1, 
          visibility: 'visible', 
          display: 'block',
          y: 0
        });
      }
      
      console.log('✅ Order form visibility ensured');
    }
  }
  
  // Периодически проверяем видимость формы (на случай, если анимация её скрыла)
  let formCheckInterval = setInterval(() => {
    const orderForm = document.querySelector('.equipment-order-form');
    if (orderForm) {
      const computedStyle = window.getComputedStyle(orderForm);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
        console.warn('⚠️ Order form is hidden, fixing...');
        ensureFormVisible();
      }
    }
  }, 1000);
  
  // Останавливаем проверку через 10 секунд
  setTimeout(() => {
    clearInterval(formCheckInterval);
  }, 10000);
  
  // Запускаем анимации после небольшой задержки, чтобы убедиться, что все элементы загружены
  setTimeout(() => {
    initPageAnimations();
    // Убеждаемся, что форма видна после инициализации анимаций
    ensureFormVisible();
  }, 100);

  // =============================================
  // SMOOTH ANCHOR SCROLL (через Lenis)
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

  setupAnchorLinks();
  
  // Галерея: переключение основных изображений
  const mainImage = document.querySelector('.main-image img');
  const thumbs = document.querySelectorAll('.gallery-thumbnails img');

  // Обработка ошибок загрузки изображения
  if (mainImage) {
    mainImage.onerror = function() {
      this.src = '../images/avtovyshka-13m.png';
      this.onerror = null; // Предотвращаем бесконечный цикл
    };
  }

  if (mainImage && thumbs.length) {
    thumbs.forEach((thumb) => {
      thumb.onerror = function() {
        this.src = '../images/avtovyshka-13m.png';
        this.onerror = null;
      };
      
      thumb.addEventListener('click', () => {
        thumbs.forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = thumb.src;
        mainImage.alt = thumb.alt || mainImage.alt;
      });
    });
  }

  // Мобильное меню
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // Прогресс-бар скролла на странице техники
  const progress = document.getElementById('scrollProgress');
  if (progress) {
    function updateProgress() {
      let scrollY, maxScroll;
      
      if (window.lenis) {
        scrollY = window.lenis.scroll;
        maxScroll = window.lenis.limit;
      } else {
        scrollY = window.scrollY;
        maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      }
      
      const percentage = (scrollY / maxScroll) * 100;
      progress.style.width = `${percentage}%`;
    }

    if (window.lenis) {
      window.lenis.on('scroll', updateProgress);
    } else {
      window.addEventListener('scroll', updateProgress, { passive: true });
    }
  }
  
  // =============================================
  // MINI CALCULATOR FOR EQUIPMENT PAGES
  // =============================================
  let calculatorInitialized = false;
  
  function initEquipmentCalculator(service) {
    const form = document.getElementById('equipmentCalculatorForm');
    const resultEl = document.getElementById('equipmentCalcResult');
    if (!form || !resultEl) return;
    
    // Предотвращаем повторную инициализацию
    if (calculatorInitialized) return;
    calculatorInitialized = true;
    
    // Парсим цену из строки (например, "от 15 000 ₽/полсмена, от 18 000 ₽/смена")
    let basePrice = 0;
    let baseHalfShift = null;
    
    if (service && service.price) {
      const priceStr = service.price;
      
      // Ищем цену за полсмену - пробуем разные форматы
      const halfShiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*[\/\s]*полсмен/i);
      if (halfShiftMatch) {
        baseHalfShift = parseInt(halfShiftMatch[1].replace(/\s/g, ''), 10);
      } else {
        // Пробуем найти до запятой
        const beforeComma = priceStr.split(',')[0];
        if (beforeComma && beforeComma.includes('полсмен')) {
          const match = beforeComma.match(/(\d+[\s\d]*)/);
          if (match) baseHalfShift = parseInt(match[1].replace(/\s/g, ''), 10);
        }
      }
      
      // Ищем цену за смену
      const shiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*[\/\s]*смен/i);
      if (shiftMatch) {
        basePrice = parseInt(shiftMatch[1].replace(/\s/g, ''), 10);
      } else {
        // Пробуем найти после запятой
        const afterComma = priceStr.split(',')[1] || priceStr;
        if (afterComma && afterComma.includes('смен')) {
          const match = afterComma.match(/(\d+[\s\d]*)/);
          if (match) basePrice = parseInt(match[1].replace(/\s/g, ''), 10);
        } else if (!baseHalfShift) {
          // Если нет полсмены, ищем любое число в строке
          const match = priceStr.match(/(\d+[\s\d]*)/);
          if (match) basePrice = parseInt(match[1].replace(/\s/g, ''), 10);
        }
      }
    }
    
    // Если цена за полсмену не найдена в строке, пробуем извлечь из таблицы цен на странице
    if (!baseHalfShift) {
      const pricingTable = document.querySelector('.pricing-table');
      if (pricingTable) {
        const pricingRows = pricingTable.querySelectorAll('.pricing-row');
        pricingRows.forEach(row => {
          const text = row.textContent || '';
          if (text.includes('Полсмены') || text.includes('полсмен')) {
            const priceMatch = text.match(/(\d+[\s\d]*)\s*₽/);
            if (priceMatch) {
              baseHalfShift = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
              console.log('✅ Найдена цена за полсмену из таблицы цен:', baseHalfShift);
            }
          }
        });
      }
    }
    
    // Если цена за полсмену все еще не найдена, но есть цена за смену, вычисляем как 83% от смены
    if (!baseHalfShift && basePrice && basePrice > 0) {
      baseHalfShift = Math.round(basePrice * 0.83);
      console.log('💡 Цена за полсмену вычислена как 83% от смены:', baseHalfShift);
    }
    
    // Если цена за смену не найдена, пробуем извлечь из таблицы цен на странице
    if (!basePrice || basePrice === 0) {
      const pricingTable = document.querySelector('.pricing-table');
      if (pricingTable) {
        const pricingRows = pricingTable.querySelectorAll('.pricing-row');
        pricingRows.forEach(row => {
          const text = row.textContent || '';
          if ((text.includes('смен') || text.includes('8 часов')) && !text.includes('полсмен')) {
            const priceMatch = text.match(/(\d+[\s\d]*)\s*₽/);
            if (priceMatch) {
              basePrice = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
              console.log('✅ Найдена цена за смену из таблицы цен:', basePrice);
            }
          }
        });
      }
    }
    
    // Если цена все еще не найдена, используем значение по умолчанию
    if (!basePrice || basePrice === 0) {
      basePrice = 18000; // Значение по умолчанию
      console.warn('⚠️ Цена за смену не найдена, используется значение по умолчанию:', basePrice);
    }
    
    // Если цена за полсмену все еще не найдена после всех попыток, вычисляем как 83% от смены
    if (!baseHalfShift && basePrice && basePrice > 0) {
      baseHalfShift = Math.round(basePrice * 0.83);
      console.log('💡 Цена за полсмену вычислена как 83% от смены (fallback):', baseHalfShift);
    }
    
    console.log('💰 Итоговые цены для калькулятора:', { baseHalfShift, basePrice });
    
    console.log('Initializing calculator.');
    
    // Создаём кастомный выпадающий список для количества смен
    const shiftsSelect = document.getElementById('equip-calc-shifts');
    const customShiftsInput = document.getElementById('equip-calc-shifts-custom');
    const shiftsField = shiftsSelect ? shiftsSelect.closest('.calc-field') : null;
    const shiftsFieldParent = shiftsField ? shiftsField.parentNode : null;
    
    if (shiftsSelect) {
      const customShiftsSelect = document.createElement('div');
      customShiftsSelect.className = 'calc-select';

      const currentShiftsBtn = document.createElement('button');
      currentShiftsBtn.type = 'button';
      currentShiftsBtn.className = 'calc-select-current';
      currentShiftsBtn.textContent = shiftsSelect.options[shiftsSelect.selectedIndex]?.textContent || '';

      const shiftsOptionsWrap = document.createElement('div');
      shiftsOptionsWrap.className = 'calc-select-options';

      const shiftsList = document.createElement('ul');
      shiftsList.className = 'calc-select-options-list';

      Array.from(shiftsSelect.options).forEach((opt) => {
        const li = document.createElement('li');
        li.className = 'calc-select-option';
        li.dataset.value = opt.value;
        li.textContent = opt.textContent;
        if (opt.selected) {
          li.classList.add('is-active');
        }
        li.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          shiftsSelect.value = opt.value;
          currentShiftsBtn.textContent = opt.textContent;
          shiftsList.querySelectorAll('.calc-select-option').forEach((el) => el.classList.remove('is-active'));
          li.classList.add('is-active');
          
          // Закрываем выпадающий список
          customShiftsSelect.classList.remove('open');
          if (shiftsField) shiftsField.classList.remove('is-open');
          
          // Показываем/скрываем поле для ввода количества смен
          if (customShiftsInput) {
            if (opt.value === 'more') {
              customShiftsInput.style.display = 'block';
              customShiftsInput.style.visibility = 'visible';
              customShiftsInput.style.marginTop = '8px';
              customShiftsInput.required = true;
              // Фокус на поле для удобства с небольшой задержкой
              setTimeout(() => {
                if (customShiftsInput) {
                  customShiftsInput.focus();
                }
              }, 150);
            } else {
              customShiftsInput.style.display = 'none';
              customShiftsInput.style.visibility = 'hidden';
              customShiftsInput.required = false;
            }
          }
          
          // Автоматически пересчитываем при изменении выбора
          setTimeout(() => {
            calculatePrice();
          }, 200);
        });
        shiftsList.appendChild(li);
      });

      shiftsOptionsWrap.appendChild(shiftsList);
      customShiftsSelect.appendChild(currentShiftsBtn);
      customShiftsSelect.appendChild(shiftsOptionsWrap);

      // СНАЧАЛА скрываем нативный select (полностью, чтобы не мешал)
      shiftsSelect.style.position = 'absolute';
      shiftsSelect.style.opacity = '0';
      shiftsSelect.style.pointerEvents = 'none';
      shiftsSelect.style.width = '1px';
      shiftsSelect.style.height = '1px';
      shiftsSelect.style.overflow = 'hidden';
      shiftsSelect.style.clip = 'rect(0, 0, 0, 0)';
      shiftsSelect.style.zIndex = '-1';
      shiftsSelect.style.left = '-9999px';
      shiftsSelect.style.top = '-9999px';
      
      // ВАЖНО: Вставляем кастомный select ВНЕ label, после него
      // Это предотвращает перехват кликов label'ом
      if (shiftsField && shiftsFieldParent) {
        // Вставляем после label, а не внутри него
        shiftsFieldParent.insertBefore(customShiftsSelect, shiftsField.nextSibling);
      } else {
        // Fallback: вставляем перед нативным select
        shiftsSelect.parentNode.insertBefore(customShiftsSelect, shiftsSelect);
      }
      
      // Убеждаемся, что кастомный select имеет правильные стили для кликабельности
      customShiftsSelect.style.width = '100%';
      customShiftsSelect.style.pointerEvents = 'auto';
      customShiftsSelect.style.position = 'relative';
      customShiftsSelect.style.zIndex = '50';
      
      // Перемещаем поле для ввода количества смен после кастомного select'а, если оно есть
      if (customShiftsInput && customShiftsInput.parentNode) {
        const parent = customShiftsInput.parentNode;
        // Удаляем из текущего места
        parent.removeChild(customShiftsInput);
        // Вставляем после кастомного select'а в том же родителе
        if (customShiftsSelect.nextSibling) {
          parent.insertBefore(customShiftsInput, customShiftsSelect.nextSibling);
        } else {
          parent.appendChild(customShiftsInput);
        }
        // Убеждаемся, что поле видимо, если нужно
        if (shiftsSelect && shiftsSelect.value === 'more') {
          customShiftsInput.style.display = 'block';
          customShiftsInput.style.visibility = 'visible';
        }
      }
      
      // Убеждаемся, что кнопка кликабельна - применяем стили напрямую
      currentShiftsBtn.style.pointerEvents = 'auto';
      currentShiftsBtn.style.cursor = 'pointer';
      currentShiftsBtn.style.position = 'relative';
      currentShiftsBtn.style.zIndex = '100';
      currentShiftsBtn.style.backgroundColor = 'var(--bg-light)';
      currentShiftsBtn.style.border = '1px solid var(--border)';
      currentShiftsBtn.style.borderRadius = '10px';
      currentShiftsBtn.style.width = '100%';
      currentShiftsBtn.style.minHeight = '48px';
      currentShiftsBtn.style.padding = '12px 16px';
      currentShiftsBtn.style.display = 'flex';
      currentShiftsBtn.style.alignItems = 'center';
      currentShiftsBtn.style.justifyContent = 'space-between';
      currentShiftsBtn.setAttribute('tabindex', '0');

      // Добавляем обработчик клика с несколькими способами для надежности
      const handleButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Button clicked, toggling dropdown', e);
        const isOpen = customShiftsSelect.classList.toggle('open');
        if (shiftsField) {
          shiftsField.classList.toggle('is-open', isOpen);
        }
        return false;
      };
      
      // Используем capture phase для перехвата события раньше
      currentShiftsBtn.addEventListener('click', handleButtonClick, true);
      currentShiftsBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, true);
      
      // Также добавляем обработчик на touch для мобильных
      currentShiftsBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleButtonClick(e);
      }, true);
      
      // Обработчик для клавиатуры
      currentShiftsBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleButtonClick(e);
        }
      });

      document.addEventListener('click', (evt) => {
        if (!customShiftsSelect.contains(evt.target)) {
          customShiftsSelect.classList.remove('open');
          if (shiftsField) shiftsField.classList.remove('is-open');
        }
      });
      
      // Проверяем начальное значение и показываем поле, если нужно
      if (shiftsSelect && shiftsSelect.value === 'more' && customShiftsInput) {
        customShiftsInput.style.display = 'block';
        customShiftsInput.style.marginTop = '8px';
        customShiftsInput.required = true;
      }
    }
    
    // Функция расчета стоимости
    const calculatePrice = () => {
      if (!shiftsSelect || !resultEl) {
        console.warn('Calculator elements not found for calculatePrice', { shiftsSelect: !!shiftsSelect, resultEl: !!resultEl });
        return;
      }
      
      if (!basePrice || basePrice === 0) {
        console.warn('Base price not set, using default', basePrice);
        basePrice = 18000;
      }
      
      const shiftsSelectValue = shiftsSelect?.value || '1';
      let shifts;
      if (shiftsSelectValue === 'more' && customShiftsInput) {
        shifts = Number(customShiftsInput.value) || 4;
        if (shifts < 4) shifts = 4;
      } else {
        shifts = Number(shiftsSelectValue) || 1;
      }
      
      // Расчет стоимости с учетом полсмены
      let total;
      if (shifts === 0.5) {
        // Если цена за полсмену не найдена, пробуем извлечь из таблицы цен на странице
        if (!baseHalfShift) {
          const pricingTable = document.querySelector('.pricing-table');
          if (pricingTable) {
            const pricingRows = pricingTable.querySelectorAll('.pricing-row');
            for (const row of pricingRows) {
              const text = row.textContent || '';
              if (text.includes('Полсмены') || text.includes('полсмен')) {
                const priceMatch = text.match(/(\d+[\s\d]*)\s*₽/);
                if (priceMatch) {
                  baseHalfShift = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
                  console.log('✅ Найдена цена за полсмену из таблицы цен (в расчете):', baseHalfShift);
                  break;
                }
              }
            }
          }
        }
        
        if (baseHalfShift) {
          total = baseHalfShift;
        } else {
          // Если полсмены нет, используем 83% от полной смены (округление)
          total = Math.round(basePrice * 0.83);
          console.log('💡 Цена за полсмену вычислена как 83% от смены (в расчете):', total);
        }
      } else {
        total = basePrice * shifts;
      }
      
      const formatted = total.toLocaleString('ru-RU');
      
      // Отображаем результат
      let shiftsText;
      let timeText = '';
      
      if (shifts === 0.5) {
        shiftsText = 'полсмены';
        timeText = 'Полсмены включает в себя 3 часа работы и один час подачи';
      } else {
        timeText = 'Смена включает в себя 7 часов работы и один час подачи';
        if (shiftsSelectValue === 'more') {
          shiftsText = shifts === 4 ? '4 смены' : `${shifts} смен`;
        } else if (shifts === 1) {
          shiftsText = 'смену';
        } else if (shifts < 5) {
          shiftsText = 'смены';
        } else {
          shiftsText = 'смен';
        }
      }
      
      if (resultEl) {
        resultEl.innerHTML = `
          <p class="calc-result-text">
            ${formatted} ₽ за ${shifts === 0.5 ? 'полсмены' : (shiftsSelectValue === 'more' ? shiftsText : `${shifts} ${shiftsText}`)} <span class="price-vat">без НДС</span>
          </p>
          ${timeText ? `<span class="calculator-time">${timeText}</span>` : ''}
        `;
      }
    };
    
    // Вызываем расчет сразу после определения функции
    if (shiftsSelect && resultEl) {
      setTimeout(() => {
        calculatePrice();
      }, 200);
    }
    
    // Автоматический расчет при изменении значения в поле для ввода количества смен
    if (customShiftsInput) {
      customShiftsInput.addEventListener('input', () => {
        // Автоматически пересчитываем при изменении значения
        if (shiftsSelect?.value === 'more') {
          const customValue = Number(customShiftsInput.value);
          if (customValue >= 4) {
            calculatePrice();
          }
        }
      });
      
      customShiftsInput.addEventListener('change', () => {
        if (shiftsSelect?.value === 'more') {
          const customValue = Number(customShiftsInput.value);
          if (customValue >= 4) {
            calculatePrice();
          }
        }
      });
    }
    
    // Автоматический расчет при загрузке страницы (после создания всех элементов)
    setTimeout(() => {
      if (typeof calculatePrice === 'function') {
        try {
          calculatePrice();
        } catch (error) {
          console.error('Error calculating price:', error);
          // Показываем начальное сообщение, если расчет не удался
          resultEl.innerHTML = '<p class="calc-result-text">Выберите параметры для расчета</p>';
        }
      }
    }, 500);
    
    // Обработка отправки формы заказа
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Проверяем, был ли выполнен расчет (есть ли результат)
      const resultText = resultEl.querySelector('.calc-result-text');
      if (!resultText || resultText.textContent.includes('Выберите параметры')) {
        // Если расчет не выполнен, выполняем его
        calculatePrice();
        return;
      }
      
      // Проверяем, что если выбрано "Более 3 смен", то поле заполнено
      if (shiftsSelect?.value === 'more' && customShiftsInput) {
        const customValue = Number(customShiftsInput.value);
        if (!customValue || customValue < 4) {
          alert('Пожалуйста, введите количество смен (минимум 4)');
          if (customShiftsInput) {
            customShiftsInput.style.display = 'block';
            customShiftsInput.style.visibility = 'visible';
            customShiftsInput.focus();
          }
          return;
        }
      }
      
      // Собираем данные формы
      const formData = new FormData(form);
      const data = {};
      
      // Собираем данные формы
      for (const [key, value] of formData.entries()) {
        // Если это поле даты с flatpickr, конвертируем в формат YYYY-MM-DD
        if (key === 'date') {
          const dateInput = form.querySelector('input[name="date"]');
          if (dateInput && dateInput._flatpickr) {
            const selectedDates = dateInput._flatpickr.selectedDates;
            if (selectedDates.length > 0) {
              data[key] = selectedDates[0].toISOString().split('T')[0];
            } else {
              data[key] = '';
            }
          } else {
            data[key] = value;
          }
        } else if (key === 'duration') {
          // Обрабатываем duration - если выбрано "more", берем значение из customShiftsInput
          if (value === 'more' && customShiftsInput) {
            const customValue = Number(customShiftsInput.value) || 4;
            data[key] = customValue >= 4 ? customValue.toString() : '4';
          } else {
            data[key] = value;
          }
        } else {
          data[key] = value;
        }
      }
      
      // Отправляем данные на сервер
      try {
        const response = await fetch('/api/requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
          form.reset();
          // Сбрасываем календарь
          const dateInput = form.querySelector('input[name="date"]');
          if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.clear();
          }
          // Сбрасываем результат расчета
          resultEl.innerHTML = '<p class="calc-result-text">Выберите параметры и нажмите «Рассчитать»</p>';
        } else {
          alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Ошибка при отправке заявки:', error);
        alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
      }
    });
  }

  // Инициализация русского календаря для поля даты (в объединенной форме)
  if (typeof flatpickr !== 'undefined') {
    // Инициализируем календарь для поля даты в калькуляторе
    const dateInput = document.querySelector('#calcOrderForm input[name="date"]');
    if (dateInput && !dateInput._flatpickr) {
      // Изменяем тип на text для flatpickr
      dateInput.type = 'text';
      
      // Инициализируем flatpickr с русской локализацией
      const fp = flatpickr(dateInput, {
        locale: 'ru',
        dateFormat: 'd.m.Y',
        altInput: false,
        allowInput: true,
        minDate: 'today',
        defaultDate: null,
        placeholder: 'Выберите дату',
        monthSelectorType: 'static',
        animate: true,
        static: true
      });
      
      // Сохраняем ссылку на flatpickr для использования при отправке формы
      dateInput._flatpickr = fp;
    }
  }
  
  // =============================================
  // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК НА СТРАНИЦАХ ТЕХНИКИ
  // =============================================
  const equipmentTabs = document.querySelectorAll('.equipment-tab');
  const equipmentTabContents = document.querySelectorAll('.equipment-tab-content');
  
  equipmentTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const targetTab = this.dataset.tab;
      
      // Убираем active класс со всех вкладок и контента
      equipmentTabs.forEach(t => t.classList.remove('active'));
      equipmentTabContents.forEach(c => c.classList.remove('active'));
      
      // Добавляем active класс к выбранной вкладке и соответствующему контенту
      this.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // =============================================
  // ANDROID-STYLE RIPPLE EFFECT (для всех кнопок на страницах оборудования)
  // =============================================
  function createRipple(event, button) {
    // Удаляем существующие ripple элементы перед созданием нового
    const existingRipples = button.querySelectorAll('.ripple');
    existingRipples.forEach(r => r.remove());
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    
    const rect = button.getBoundingClientRect();
    
    // Для маленьких кнопок (header-messenger) используем больший размер ripple
    const isSmallButton = button.classList.contains('header-messenger');
    const baseSize = Math.max(rect.width, rect.height);
    const size = isSmallButton ? baseSize * 3 : baseSize * 2;
    
    // Позиция клика относительно кнопки
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Устанавливаем размер и позицию
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.transformOrigin = 'center';
    ripple.style.marginLeft = '0';
    ripple.style.marginTop = '0';
    
    button.appendChild(ripple);
    
    // Запускаем анимацию через requestAnimationFrame для плавности
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ripple.style.animation = 'ripple-animation 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });
    
    // Удаляем ripple после завершения анимации
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 600);
  }

  // Применяем ripple эффект ко всем кнопкам на страницах оборудования
  const interactiveButtons = document.querySelectorAll(
    '.btn, .messenger-btn, .header-messenger, .calc-submit-btn'
  );

  interactiveButtons.forEach((btn) => {
    // Пропускаем кнопки калькулятора - у них своя анимация
    if (btn.classList.contains('calc-number-btn')) return;
    
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
});

// Функция для открытия диаграммы в полноэкранном режиме
// Функция для открытия изображений галереи в полноэкранном режиме
function openImageFullscreen(images, currentIndex, title) {
  if (!images || images.length === 0) return;
  
  const modal = document.createElement('div');
  modal.className = 'image-fullscreen-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  let currentIdx = currentIndex || 0;
  
  // Контейнер для изображения
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    position: relative;
    max-width: 95vw;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  `;
  
  // Изображение
  const fullscreenImg = document.createElement('img');
  fullscreenImg.style.cssText = `
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    cursor: default;
  `;
  
  // Кнопки навигации
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '‹';
  prevBtn.style.cssText = `
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 48px;
    height: 48px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 32px;
    font-weight: 300;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    z-index: 10001;
  `;
  
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '›';
  nextBtn.style.cssText = prevBtn.style.cssText;
  nextBtn.style.left = 'auto';
  nextBtn.style.right = '20px';
  
  // Кнопка закрытия
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 32px;
    font-weight: 300;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    z-index: 10001;
  `;
  
  // Счетчик изображений
  const counter = document.createElement('div');
  counter.style.cssText = `
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    margin-top: 16px;
  `;
  
  function updateImage() {
    if (currentIdx < 0) currentIdx = images.length - 1;
    if (currentIdx >= images.length) currentIdx = 0;
    
    fullscreenImg.src = images[currentIdx];
    fullscreenImg.alt = `${title} - фото ${currentIdx + 1}`;
    counter.textContent = `${currentIdx + 1} / ${images.length}`;
    
    prevBtn.style.opacity = images.length > 1 ? '1' : '0.3';
    nextBtn.style.opacity = images.length > 1 ? '1' : '0.3';
  }
  
  prevBtn.onclick = function(e) {
    e.stopPropagation();
    if (images.length > 1) {
      currentIdx--;
      updateImage();
    }
  };
  
  nextBtn.onclick = function(e) {
    e.stopPropagation();
    if (images.length > 1) {
      currentIdx++;
      updateImage();
    }
  };
  
  prevBtn.onmouseenter = nextBtn.onmouseenter = closeBtn.onmouseenter = function() {
    this.style.background = 'rgba(255, 255, 255, 0.3)';
    this.style.transform = 'scale(1.1)';
  };
  
  prevBtn.onmouseleave = nextBtn.onmouseleave = closeBtn.onmouseleave = function() {
    this.style.background = 'rgba(255, 255, 255, 0.2)';
    this.style.transform = 'scale(1)';
  };
  
  // Функция закрытия
  const closeModal = function() {
    modal.style.opacity = '0';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  };
  
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeModal();
  });
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Закрытие по Escape
  const handleEscape = function(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    } else if (e.key === 'ArrowLeft' && images.length > 1) {
      currentIdx--;
      updateImage();
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      currentIdx++;
      updateImage();
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Собираем структуру
  imageContainer.appendChild(fullscreenImg);
  imageContainer.appendChild(counter);
  modal.appendChild(imageContainer);
  modal.appendChild(prevBtn);
  modal.appendChild(nextBtn);
  modal.appendChild(closeBtn);
  
  // Добавляем в DOM
  document.body.appendChild(modal);
  
  // Инициализируем изображение
  updateImage();
  
  // Анимация появления
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
  
  // Предотвращаем клик на изображении от закрытия модального окна
  fullscreenImg.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  imageContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

function openDiagramFullscreen(imageUrl, title) {
  // Создаем модальное окно для полноэкранного просмотра
  const modal = document.createElement('div');
  modal.className = 'diagram-fullscreen-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  // Контейнер для изображения
  const imageContainer = document.createElement('div');
  imageContainer.style.cssText = `
    position: relative;
    max-width: 95vw;
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  `;
  
  // Изображение
  const fullscreenImg = document.createElement('img');
  fullscreenImg.src = imageUrl;
  fullscreenImg.alt = title;
  fullscreenImg.style.cssText = `
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    cursor: default;
  `;
  
  // Заголовок
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
  `;
  
  // Кнопка закрытия
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #ffffff;
    font-size: 32px;
    font-weight: 300;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    z-index: 10001;
  `;
  
  closeBtn.onmouseenter = function() {
    this.style.background = 'rgba(255, 255, 255, 0.3)';
    this.style.transform = 'scale(1.1)';
  };
  closeBtn.onmouseleave = function() {
    this.style.background = 'rgba(255, 255, 255, 0.2)';
    this.style.transform = 'scale(1)';
  };
  
  // Функция закрытия
  const closeModal = function() {
    modal.style.opacity = '0';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  };
  
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeModal();
  });
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Закрытие по Escape
  const handleEscape = function(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Собираем структуру
  imageContainer.appendChild(fullscreenImg);
  imageContainer.appendChild(titleEl);
  modal.appendChild(imageContainer);
  modal.appendChild(closeBtn);
  
  // Добавляем в DOM
  document.body.appendChild(modal);
  
  // Анимация появления
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
  
  // Предотвращаем клик на изображении от закрытия модального окна
  fullscreenImg.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  imageContainer.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}
