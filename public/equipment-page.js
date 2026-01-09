// Анимации и логика для страниц техники с GSAP и Lenis

document.addEventListener('DOMContentLoaded', async () => {
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
      
      // Обновляем заголовок страницы
      const titleEl = document.querySelector('.equipment-title, h1');
      if (titleEl && service.title) {
        titleEl.textContent = service.title;
      }
      
      // Обновляем описание
      const descriptionEl = document.querySelector('.equipment-description, .equipment-intro p');
      if (descriptionEl && service.description) {
        descriptionEl.textContent = service.description;
      }
      
      // Обновляем характеристики из новых полей
      const specsGrid = document.querySelector('.specs-grid');
      if (specsGrid) {
        specsGrid.innerHTML = '';
        
        const specs = [
          { icon: '📏', label: 'Высота подъема люльки', value: service.height_lift },
          { icon: '📐', label: 'Максимальный вылет', value: service.max_reach },
          { icon: '⚖️', label: 'Максимальная грузоподъемность', value: service.max_capacity },
          { icon: '🚗', label: 'Тип подъемника', value: service.lift_type },
          { icon: '📏', label: 'Длина в транспортном положении', value: service.transport_length },
          { icon: '📏', label: 'Высота в транспортном положении', value: service.transport_height },
          { icon: '📏', label: 'Ширина', value: service.width },
          { icon: '🔄', label: 'Угол поворота стрелы', value: service.boom_rotation_angle },
          { icon: '🔄', label: 'Угол поворота корзины', value: service.basket_rotation_angle }
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
      if (pricingTable && service.price) {
        // Парсим цены из строки
        let priceHalfShift = '';
        let priceShift = '';
        const deliveryPerKm = service.delivery_per_km || 85;
        
        const halfShiftMatch = service.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
        if (halfShiftMatch) {
          priceHalfShift = halfShiftMatch[1].replace(/\s/g, '');
        }
        
        const shiftMatch = service.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
        if (shiftMatch) {
          priceShift = shiftMatch[1].replace(/\s/g, '');
        }
        
        pricingTable.innerHTML = '';
        
        if (priceHalfShift) {
          const row = document.createElement('div');
          row.className = 'pricing-row';
          row.innerHTML = `
            <span>Полсмены (3+1 часа)</span>
            <span class="pricing-value">${parseInt(priceHalfShift).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
          `;
          pricingTable.appendChild(row);
        }
        
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
          <span class="pricing-value">${deliveryPerKm} ₽/км</span>
        `;
        pricingTable.appendChild(deliveryRow);
      }
      
      // Обновляем цену в заголовке (если есть)
      const priceEls = document.querySelectorAll('.price-value');
      if (priceEls.length && service.price) {
        // Показываем только цену за смену в заголовке
        const shiftMatch = service.price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
        if (shiftMatch) {
          const shiftPrice = parseInt(shiftMatch[1].replace(/\s/g, ''));
          priceEls.forEach(el => {
            el.innerHTML = `${shiftPrice.toLocaleString('ru-RU')} ₽ / смена <span class="price-vat">без НДС</span>`;
          });
        } else {
          priceEls.forEach(el => {
            el.textContent = service.price;
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
      
      // Функция для получения изображения из базы данных (аналогично getImageForService из script.js)
      // Но с учетом относительных путей для страниц оборудования
      function getImageForEquipmentPage(service) {
        // Приоритет 1: image_url из базы данных
        if (service.image_url) {
          let imageUrl = service.image_url;
          
          // Преобразуем localhost URL в относительный путь
          if (imageUrl.startsWith('http://localhost:3000/') || imageUrl.startsWith('http://127.0.0.1:3000/')) {
            imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
          
          // Если это полный внешний URL, оставляем как есть
          if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
            return imageUrl;
          }
          
          // Преобразуем абсолютный путь в относительный для страниц оборудования
          if (imageUrl.startsWith('/images/')) {
            return '..' + imageUrl;
          } else if (imageUrl.startsWith('/uploads/')) {
            return '..' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            return '..' + imageUrl;
          } else {
            return '../' + imageUrl;
          }
        }
        
        // Приоритет 2: первое изображение из массива images
        if (service.images && Array.isArray(service.images) && service.images.length > 0) {
          const firstImage = service.images[0];
          let imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
          
          // Преобразуем localhost URL в относительный путь
          if (imageUrl.startsWith('http://localhost:3000/') || imageUrl.startsWith('http://127.0.0.1:3000/')) {
            imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
          
          // Если это полный внешний URL, оставляем как есть
          if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
            return imageUrl;
          }
          
          // Преобразуем абсолютный путь в относительный для страниц оборудования
          if (imageUrl.startsWith('/images/')) {
            return '..' + imageUrl;
          } else if (imageUrl.startsWith('/uploads/')) {
            return '..' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            return '..' + imageUrl;
          } else {
            return '../' + imageUrl;
          }
        }
        
        // Приоритет 3: определяем по URL страницы (fallback)
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('13m')) {
          return '../images/avtovyshka-13m.png';
        } else if (currentPath.includes('15m')) {
          return '../images/avtovyshka-15m.png';
        } else if (currentPath.includes('16m')) {
          return '../images/avtovyshka-15m.png';
        } else if (currentPath.includes('17m')) {
          return '../images/avtovyshka-18m.png';
        } else if (currentPath.includes('18m')) {
          return '../images/avtovyshka-18m.png';
        } else if (currentPath.includes('21m')) {
          return '../images/avtovyshka-21m.png';
        } else if (currentPath.includes('25m')) {
          return '../images/avtovyshka-25m.png';
        } else if (currentPath.includes('29m')) {
          return '../images/avtovyshka-29m.png';
        } else if (currentPath.includes('45m')) {
          return '../images/avtovyshka-29m.png';
        } else if (currentPath.includes('vezdehod') || currentPath.includes('вездеход')) {
          return '../images/avtovyshka-vezdehod-30m.png';
        } else if (currentPath.includes('samohodnaya') || currentPath.includes('самоходная')) {
          return '../images/avtovyshka-13m.png';
        }
        
        // Fallback
        return '../images/avtovyshka-13m.png';
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
        // Устанавливаем первое изображение как главное
        if (imgEl) {
          // Убеждаемся, что URL правильный (добавляем / если нужно)
          let mainImageUrl = allImages[0];
          if (mainImageUrl && !mainImageUrl.startsWith('http') && !mainImageUrl.startsWith('/') && !mainImageUrl.startsWith('../')) {
            mainImageUrl = '/' + mainImageUrl;
          }
          imgEl.src = mainImageUrl;
          imgEl.alt = service.title;
          console.log('✅ Set main image:', mainImageUrl);
          
          // Добавляем обработчик клика для просмотра в полноэкранном режиме
          imgEl.style.cursor = 'pointer';
          imgEl.addEventListener('click', function() {
            openImageFullscreen(allImages, 0, service.title);
          });
          
          // Обработка ошибок загрузки изображения
          imgEl.onerror = function() {
            console.warn('❌ Failed to load main image:', mainImageUrl);
            // Используем fallback изображение
            const fallbackImage = '../images/avtovyshka-13m.png';
            if (this.src !== fallbackImage) {
              this.src = fallbackImage;
            }
            this.onerror = null; // Предотвращаем бесконечный цикл
          };
          imgEl.onload = function() {
            console.log('✅ Main image loaded successfully:', mainImageUrl);
          };
        }
        
        // Обновляем миниатюры
        if (thumbsContainer) {
          thumbsContainer.innerHTML = '';
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
              // Убираем active класс со всех миниатюр
              thumbsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
              // Добавляем active класс к выбранной
              thumb.classList.add('active');
              // Меняем главное изображение
              if (imgEl) {
                imgEl.src = normalizedUrl;
                imgEl.alt = `${service.title} - вид ${index + 1}`;
              }
              // Открываем в полноэкранном режиме
              openImageFullscreen(allImages, index, service.title);
            };
            thumb.onerror = function() {
              console.warn('Failed to load thumbnail:', normalizedUrl);
              // Если изображение не загрузилось, скрываем миниатюру
              thumb.style.display = 'none';
            };
            thumb.onload = function() {
              console.log('✅ Thumbnail loaded:', normalizedUrl);
            };
            thumbsContainer.appendChild(thumb);
          });
          console.log('✅ Created', allImages.length, 'thumbnails');
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
            if (imageUrl.startsWith('http://localhost:3000/') || imageUrl.startsWith('http://127.0.0.1:3000/')) {
              imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            
            // Если это относительный путь без начального слэша, добавляем его
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('../')) {
              imageUrl = '../' + imageUrl;
            } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/images/')) {
              // Преобразуем абсолютный путь в относительный для страниц оборудования
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
      
      // Ищем цену за полсмену
      const halfShiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
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
      const shiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
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
    
    // Если цена не найдена, используем значение по умолчанию
    if (!basePrice || basePrice === 0) {
      basePrice = 18000; // Значение по умолчанию
    }
    
    // Определяем стоимость подачи за КАД на основе типа техники
    // Используем данные из service, если доступны, иначе значения по умолчанию
    let deliveryPerKm = 85; // Единая стоимость за км для всех типов техники
    
    // Используем значения из service, если они есть
    if (service?.extraPerKm) {
      deliveryPerKm = service.extraPerKm;
    }
    
    // Кнопки увеличения/уменьшения расстояния
    const distanceInput = document.getElementById('equip-calc-distance');
    const numberButtons = document.querySelectorAll('.calc-number-btn');
    
    console.log('Initializing calculator buttons. Found buttons:', numberButtons.length);
    console.log('Distance input found:', !!distanceInput);
    
    if (numberButtons.length > 0) {
      // Функция для создания ripple эффекта
      function createCalcRipple(event, button) {
        try {
          // Проверяем, что событие действительно клик или касание
          if (!event || (!event.type.includes('click') && !event.type.includes('touch'))) {
            return;
          }
          
          // Удаляем старые ripple элементы, если есть
          const oldRipples = button.querySelectorAll('.ripple');
          oldRipples.forEach(r => r.remove());
          
          const ripple = document.createElement('span');
          ripple.classList.add('ripple');
          
          const rect = button.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height) * 2;
          
          // Получаем координаты клика/касания
          let clientX, clientY;
          if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
          } else if (event.clientX && event.clientY) {
            clientX = event.clientX;
            clientY = event.clientY;
          } else {
            // Если координаты недоступны, используем центр кнопки
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
          }
          
          // Позиционируем ripple относительно точки клика (центрируем через translate)
          const x = clientX - rect.left;
          const y = clientY - rect.top;
          
          ripple.style.width = size + 'px';
          ripple.style.height = size + 'px';
          ripple.style.left = x + 'px';
          ripple.style.top = y + 'px';
          ripple.style.transform = 'translate(-50%, -50%)';
          ripple.style.transformOrigin = 'center';
          ripple.style.position = 'absolute';
          ripple.style.borderRadius = '50%';
          ripple.style.background = 'rgba(255, 255, 255, 0.9)';
          ripple.style.pointerEvents = 'none';
          ripple.style.zIndex = '100';
          ripple.style.willChange = 'transform, opacity';
          ripple.style.opacity = '0';
          
          button.appendChild(ripple);
          
          // Принудительно запускаем анимацию
          requestAnimationFrame(() => {
            ripple.style.animation = 'calc-ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            ripple.style.opacity = '1';
          });
          
          // Удаляем ripple после завершения анимации
          setTimeout(() => {
            if (ripple && ripple.parentNode) {
              ripple.remove();
            }
          }, 600);
        } catch (error) {
          console.error('Error creating ripple:', error);
        }
      }
      
      numberButtons.forEach((btn) => {
        // Убираем автоматический фокус с кнопок
        btn.setAttribute('tabindex', '-1');
        
        // Функция для обработки клика/касания
        const handleButtonAction = (e, button) => {
          e.preventDefault();
          e.stopPropagation();
          if (!distanceInput) return;
          
          // Убираем класс is-clicked со всех кнопок
          numberButtons.forEach(b => b.classList.remove('is-clicked'));
          
          // Добавляем класс is-clicked только на нажатую кнопку
          button.classList.add('is-clicked');
          
          // Создаем ripple эффект только на нажатой кнопке
          createCalcRipple(e, button);
          
          const step = 1;
          const min = 0;
          const current = Number(distanceInput.value) || 0;
          const isPlus = button.classList.contains('calc-number-btn--plus');
          let next = current + (isPlus ? step : -step);
          if (next < min) next = min;
          distanceInput.value = next;
          
          // Убираем класс после анимации
          setTimeout(() => {
            button.classList.remove('is-clicked');
          }, 300);
          
          // Убираем фокус
          button.blur();
          
          // Триггерим событие input для пересчета
          distanceInput.dispatchEvent(new Event('input', { bubbles: true }));
        };
        
        // Обработчик клика мыши - проверяем, что клик действительно на кнопке
        btn.addEventListener('click', function(e) {
          const rect = this.getBoundingClientRect();
          const clickX = e.clientX;
          const clickY = e.clientY;
          
          // Проверяем, что клик в пределах кнопки
          if (clickX >= rect.left && clickX <= rect.right && 
              clickY >= rect.top && clickY <= rect.bottom) {
            handleButtonAction(e, this);
          }
        });
        
        // Обработчик touch для мобильных устройств - проверяем, что касание на кнопке
        btn.addEventListener('touchstart', function(e) {
          if (e.touches && e.touches.length > 0) {
            const rect = this.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            
            // Проверяем, что касание в пределах кнопки
            if (touchX >= rect.left && touchX <= rect.right && 
                touchY >= rect.top && touchY <= rect.bottom) {
              handleButtonAction(e, this);
            }
          } else {
            handleButtonAction(e, this);
          }
        });
        
        // Функция для проверки, находится ли курсор над кнопкой
        const isMouseOverButton = (e, button) => {
          const rect = button.getBoundingClientRect();
          const mouseX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
          const mouseY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
          
          return mouseX >= rect.left && mouseX <= rect.right && 
                 mouseY >= rect.top && mouseY <= rect.bottom;
        };
        
        // Управление hover эффектом через класс - только при реальном наведении
        btn.addEventListener('mouseenter', function(e) {
          this.style.outline = 'none';
          if (isMouseOverButton(e, this)) {
            this.classList.add('is-hovered');
          }
        });
        
        btn.addEventListener('mouseleave', function() {
          this.classList.remove('is-hovered');
        });
        
        btn.addEventListener('mousemove', function(e) {
          if (isMouseOverButton(e, this)) {
            this.classList.add('is-hovered');
          } else {
            this.classList.remove('is-hovered');
          }
        });
      });
    }
    
    // Обработчик изменения расстояния для автоматического пересчета
    const kmInfoEl = document.getElementById('equip-calc-km-info');
    if (distanceInput) {
      distanceInput.addEventListener('input', () => {
        // Обновляем информацию о километрах (цена уже включает обе стороны)
        if (kmInfoEl && distanceInput.value > 0) {
          const distance = Number(distanceInput.value) || 0;
          const cost = distance * deliveryPerKm * 2; // Умножаем на 2 (в каждую сторону)
          kmInfoEl.textContent = `Доставка: ${distance} км × ${deliveryPerKm} ₽ × 2 = ${cost.toLocaleString('ru-RU')} ₽ (в каждую сторону)`;
        } else if (kmInfoEl) {
          kmInfoEl.textContent = `${deliveryPerKm} ₽/км × 2 (в каждую сторону)`;
        }
        // Триггерим пересчет формы
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }
    
    // Создаём кастомный выпадающий список для количества смен
    const shiftsSelect = document.getElementById('equip-calc-shifts');
    const customShiftsInput = document.getElementById('equip-calc-shifts-custom');
    const shiftsField = shiftsSelect ? shiftsSelect.closest('.calc-field') : null;
    
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
              customShiftsInput.required = true;
            } else {
              customShiftsInput.style.display = 'none';
              customShiftsInput.required = false;
            }
          }
          
          // Триггерим пересчет
          if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        });
        shiftsList.appendChild(li);
      });

      shiftsOptionsWrap.appendChild(shiftsList);
      customShiftsSelect.appendChild(currentShiftsBtn);
      customShiftsSelect.appendChild(shiftsOptionsWrap);

      // Вставляем кастомный select перед нативным
      shiftsSelect.parentNode.insertBefore(customShiftsSelect, shiftsSelect);
      
      // Скрываем нативный select
      shiftsSelect.style.position = 'absolute';
      shiftsSelect.style.opacity = '0';
      shiftsSelect.style.pointerEvents = 'none';
      shiftsSelect.style.width = '1px';
      shiftsSelect.style.height = '1px';
      shiftsSelect.style.overflow = 'hidden';
      shiftsSelect.style.clip = 'rect(0, 0, 0, 0)';

      currentShiftsBtn.addEventListener('click', () => {
        const isOpen = customShiftsSelect.classList.toggle('open');
        if (shiftsField) {
          shiftsField.classList.toggle('is-open', isOpen);
        }
      });

      document.addEventListener('click', (evt) => {
        if (!customShiftsSelect.contains(evt.target)) {
          customShiftsSelect.classList.remove('open');
          if (shiftsField) shiftsField.classList.remove('is-open');
        }
      });
    }
    
    // Обработка отправки формы
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const shiftsSelectValue = shiftsSelect?.value || '1';
      let shifts;
      if (shiftsSelectValue === 'more' && customShiftsInput) {
        shifts = Number(customShiftsInput.value) || 4;
        if (shifts < 4) shifts = 4;
      } else {
        shifts = Number(shiftsSelectValue) || 1;
      }
      
      const distance = Number(document.getElementById('equip-calc-distance').value) || 0;
      
      // Расчет стоимости с учетом полсмены
      let baseCost;
      if (shifts === 0.5 && baseHalfShift) {
        baseCost = baseHalfShift;
      } else if (shifts === 0.5 && !baseHalfShift) {
        // Если полсмены нет, но выбрана полсмена, используем 83% от полной смены
        baseCost = Math.round(basePrice * 0.83);
      } else {
        baseCost = basePrice * shifts;
      }
      
      // Расчет подачи за КАД - цена за км уже включает обе стороны (в каждую сторону)
      const deliveryCost = distance * deliveryPerKm * 2; // Стоимость доставки за км в обе стороны
      
      const total = baseCost + deliveryCost; // Итоговая сумма с учетом доставки
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
      
      // Формируем информацию о стоимости километра
      let kmInfo = '';
      if (distance > 0) {
        kmInfo = `<span class="calculator-km-info">Доставка: ${distance} км × ${deliveryPerKm} ₽ × 2 = ${deliveryCost.toLocaleString('ru-RU')} ₽ (в каждую сторону)</span>`;
      }
      
      resultEl.innerHTML = `
        <p class="calc-result-text">
          ${formatted} ₽ за ${shifts === 0.5 ? 'полсмены' : (shiftsSelectValue === 'more' ? shiftsText : `${shifts} ${shiftsText}`)} <span class="price-vat">без НДС</span>
        </p>
        ${timeText ? `<span class="calculator-time">${timeText}</span>` : ''}
        ${kmInfo ? `<br>${kmInfo}` : ''}
      `;
    });
  }

  // Инициализация русского календаря для поля даты
  if (typeof flatpickr !== 'undefined') {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      // Изменяем тип на text для flatpickr
      input.type = 'text';
      
      // Инициализируем flatpickr с русской локализацией
      const fp = flatpickr(input, {
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
      input._flatpickr = fp;
    });
  }

  // Обработчик отправки формы заказа
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(orderForm);
      const data = {};
      
      // Собираем данные формы
      for (const [key, value] of formData.entries()) {
        // Если это поле даты с flatpickr, конвертируем в формат YYYY-MM-DD
        if (key === 'date') {
          const dateInput = orderForm.querySelector('input[name="date"]');
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
          orderForm.reset();
          // Сбрасываем календарь
          const dateInput = orderForm.querySelector('input[name="date"]');
          if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.clear();
          }
        } else {
          alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
      }
    });
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
