// API Base URL
const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentSection = 'homepage';

// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Upload image function
async function uploadImage(file, imageUrlInputId, previewId, fileType = 'image') {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    // Получаем информацию об услуге для правильного именования файла
    const serviceId = document.getElementById('serviceForm')?.dataset.serviceId || 'new';
    const serviceTitle = document.getElementById('serviceTitle')?.value || 'untitled';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/upload?serviceId=${encodeURIComponent(serviceId)}&serviceTitle=${encodeURIComponent(serviceTitle)}&fileType=${encodeURIComponent(fileType)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            // Используем относительный путь вместо полного URL с localhost
            const relativeUrl = data.url || `/uploads/${data.filename}`;
            
            console.log('📤 Изображение загружено успешно:', {
                filename: data.filename,
                url: relativeUrl,
                originalUrl: data.originalUrl,
                optimized: data.optimized
            });
            
            // Update image URL input
            const imageUrlInput = document.getElementById(imageUrlInputId);
            if (imageUrlInput) {
                imageUrlInput.value = relativeUrl;
                console.log('✅ image_url обновлен в поле:', imageUrlInputId, '=', relativeUrl);
                
                // Триггерим события, чтобы убедиться, что значение зафиксировано
                imageUrlInput.dispatchEvent(new Event('change', { bubbles: true }));
                imageUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                console.error('❌ Поле image_url не найдено:', imageUrlInputId);
            }
            
            // Update preview (используем полный URL только для превью)
            if (previewId) {
                const preview = document.getElementById(previewId);
                const container = document.getElementById(previewId + 'Container');
                if (preview) {
                    preview.src = `${API_URL}${relativeUrl}`;
                    preview.style.display = 'block';
                    if (container) {
                        container.style.display = 'block';
                    }
                    console.log('✅ Превью обновлено:', previewId);
                }
            }
            
            return relativeUrl;
        } else {
            let errorMessage = 'Ошибка загрузки';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error('❌ Ошибка сервера при загрузке:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });
            } catch (jsonError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                console.error('❌ Ошибка при парсинге ответа сервера:', jsonError);
                console.error('   Статус:', response.status, response.statusText);
            }
            alert('Ошибка при загрузке изображения: ' + errorMessage);
            return null;
        }
    } catch (error) {
        console.error('❌ Ошибка при загрузке файла:', error);
        alert('Ошибка при загрузке изображения: ' + (error.message || 'Неизвестная ошибка'));
        return null;
    }
}

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        verifyToken();
    } else {
        showLoginScreen();
    }
});

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            // Очищаем предыдущие ошибки
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
            
            const response = await fetch(`${API_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Ошибка парсинга JSON:', jsonError);
                errorDiv.textContent = 'Ошибка ответа от сервера';
                errorDiv.classList.add('show');
                return;
            }

            if (response.ok && data.token) {
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('username', data.username || username);
                console.log('Вход выполнен успешно');
                showDashboard();
            } else {
                const errorMessage = data.error || 'Неверное имя пользователя или пароль';
                console.error('Ошибка входа:', errorMessage);
                errorDiv.textContent = errorMessage;
                errorDiv.classList.add('show');
            }
        } catch (error) {
            console.error('Ошибка подключения:', error);
            errorDiv.textContent = 'Ошибка подключения к серверу: ' + error.message;
            errorDiv.classList.add('show');
        }
    });
}

// Verify Token
async function verifyToken() {
    try {
        const response = await fetch(`${API_URL}/api/admin/requests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showDashboard();
        } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            showLoginScreen();
        }
    } catch (error) {
        showLoginScreen();
    }
}

// Show/Hide Screens
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminDashboard) adminDashboard.style.display = 'none';
}

function showDashboard() {
    console.log('Показываем панель администратора...');
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (!loginScreen || !adminDashboard) {
        console.error('Элементы loginScreen или adminDashboard не найдены!');
        return;
    }
    
    loginScreen.style.display = 'none';
    adminDashboard.style.display = 'flex';
    
    const username = localStorage.getItem('username');
    const currentUserEl = document.getElementById('currentUser');
    if (currentUserEl) {
        currentUserEl.textContent = `Привет, ${username || 'Администратор'}!`;
    }
    
    loadCurrentSection();
    console.log('Панель администратора отображена');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        authToken = null;
        showLoginScreen();
    });
}

// Navigation
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        currentSection = item.dataset.section;
        loadCurrentSection();
    });
});

// Load Section
function loadCurrentSection() {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });

    // Update title
    const titles = {
        'homepage': 'Главная страница',
        'services': 'Услуги',
        'reviews': 'Отзывы',
        'requests': 'Заявки'
    };
    document.getElementById('sectionTitle').textContent = titles[currentSection] || 'Главная страница';

    // Show current section
    const sectionId = currentSection + 'Section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    // Load data for section
    switch(currentSection) {
        case 'homepage':
            loadHomepage();
            break;
        case 'services':
            loadServices();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'requests':
            loadRequests();
            break;
    }
}

// Homepage Management
async function loadHomepage() {
    try {
        const response = await fetch(`${API_URL}/api/homepage`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const formHtml = `
            <div class="form-section">
                <h3 class="form-section-title">Hero секция</h3>
                <form id="homepageForm" onsubmit="saveHomepage(event)">
                <div class="form-group">
                        <label for="homepageTitle">Заголовок (H1) *</label>
                        <input type="text" id="homepageTitle" name="title" value="${escapeHtml(data.title || '')}" required placeholder="Поднимем ваши задачи на нужную высоту">
                        <small class="form-hint">Главный заголовок на главной странице</small>
                </div>
                <div class="form-group">
                        <label for="homepageSubtitle">Описание (подзаголовок) *</label>
                        <textarea id="homepageSubtitle" name="subtitle" rows="3" required placeholder="Современный автопарк, опытные операторы и быстрый выезд на объект.">${escapeHtml(data.subtitle || '')}</textarea>
                        <small class="form-hint">Краткое описание под заголовком</small>
                </div>
                <div class="form-group">
                        <label for="homepageVideoUrl">URL видео *</label>
                        <input type="text" id="homepageVideoUrl" name="video_url" value="${escapeHtml(data.video_url || '')}" required placeholder="video.mp4 или https://example.com/video.mp4">
                        <small class="form-hint">Путь к видеофайлу (например: video.mp4 или полный URL)</small>
                </div>
                <div class="form-group">
                        <label>Или загрузите видео</label>
                        <input type="file" id="homepageVideoFile" accept="video/*" onchange="handleVideoUpload(this, 'homepageVideoUrl', 'homepageVideoPreview')">
                        <small class="form-hint">Максимальный размер: 100MB. Форматы: MP4, WebM, OGG</small>
                </div>
                    <div class="form-group" id="homepageVideoPreviewContainer" style="display: ${data.video_url ? 'block' : 'none'};">
                        <label>Превью видео:</label>
                        <video id="homepageVideoPreview" src="${escapeHtml(data.video_url || '')}" controls style="max-width: 100%; max-height: 300px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px;">
                            Ваш браузер не поддерживает видео.
                        </video>
                </div>
                    <div class="modal-footer" style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1.5rem;">
                <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                        <div id="homepageMessage" class="success-message" style="margin-top: 1rem;"></div>
                    </div>
            </form>
            </div>
        `;

        document.getElementById('homepageForm').innerHTML = formHtml;
        
        // Update preview if video exists
        if (data.video_url) {
            const preview = document.getElementById('homepageVideoPreview');
            const container = document.getElementById('homepageVideoPreviewContainer');
            if (preview && container) {
                preview.src = data.video_url;
                container.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading homepage:', error);
        document.getElementById('homepageForm').innerHTML = '<div class="error-message show">Ошибка при загрузке данных главной страницы: ' + error.message + '</div>';
    }
}

async function saveHomepage(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/homepage`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showSuccess('Данные главной страницы успешно сохранены!');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            // Обновляем превью видео
            const preview = document.getElementById('homepageVideoPreview');
            const container = document.getElementById('homepageVideoPreviewContainer');
            if (preview && data.video_url) {
                preview.src = data.video_url;
                if (container) container.style.display = 'block';
            }
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            showError('Ошибка при сохранении: ' + (errorData.error || 'Неизвестная ошибка'));
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    } catch (error) {
        showError('Ошибка при сохранении: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

// Video upload handler
async function handleVideoUpload(fileInput, urlInputId, previewId) {
    const file = fileInput.files[0];
    if (!file) return;
    
    // Проверка размера файла (100MB)
    if (file.size > 100 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 100MB');
        fileInput.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('video', file);
    
    // Получаем информацию об услуге для правильного именования файла
    const serviceId = document.getElementById('serviceForm')?.dataset.serviceId || 'homepage';
    const serviceTitle = document.getElementById('serviceTitle')?.value || 'video';
    
    try {
        const response = await fetch(`${API_URL}/api/admin/upload-video?serviceId=${encodeURIComponent(serviceId)}&serviceTitle=${encodeURIComponent(serviceTitle)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            const fullUrl = data.url.startsWith('http') ? data.url : `${API_URL}${data.url}`;
            
            // Update video URL input
            const videoUrlInput = document.getElementById(urlInputId);
            if (videoUrlInput) {
                videoUrlInput.value = fullUrl;
            }
            
            // Update preview
            if (previewId) {
                const preview = document.getElementById(previewId);
                const container = document.getElementById(previewId + 'Container');
                if (preview) {
                    preview.src = fullUrl;
                    preview.load(); // Перезагружаем видео
                }
                if (container) {
                    container.style.display = 'block';
                }
            }
            
            showSuccess('Видео успешно загружено!');
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Ошибка загрузки' }));
            showError('Ошибка при загрузке видео: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка при загрузке видео: ' + error.message);
    }
}

// Services Management
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/api/admin/services`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const services = await response.json();

        const html = services.map(service => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${escapeHtml(service.title)}</div>
                    <div class="item-description">${escapeHtml(service.description)}</div>
                    <div class="item-meta">
                        <span>${escapeHtml(service.price)}</span>
                        <span class="badge ${service.active ? 'badge-success' : 'badge-danger'}">
                            ${service.active ? 'Активна' : 'Неактивна'}
                        </span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="editService(${service.id})">Редактировать</button>
                    <button class="btn btn-small btn-danger" onclick="deleteService(${service.id})">Удалить</button>
                </div>
            </div>
        `).join('');

        document.getElementById('servicesList').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Нет добавленных услуг</p></div>';
    } catch (error) {
        console.error('Error loading services:', error);
        document.getElementById('servicesList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Ошибка при загрузке услуг</p></div>';
    }
}

// Флаг для предотвращения повторных вызовов loadServiceData
let isLoadingServiceData = false;

function showServiceModal(id = null) {
    // Очищаем массивы при открытии модального окна
    serviceReachDiagramsArray = [];
    serviceImagesArray = [];
    isLoadingServiceData = false;
    
    document.getElementById('modalTitle').textContent = id ? 'Редактировать услугу' : 'Добавить услугу';
    
    const modalBody = document.getElementById('modalBody');
    const serviceId = id || null;
    modalBody.innerHTML = `
        <form id="serviceForm" data-service-id="${serviceId || 'new'}"
            <div class="form-section">
                <h3 class="form-section-title">Основная информация</h3>
            <div class="form-group">
                    <label for="serviceTitle">Название услуги *</label>
                    <input type="text" id="serviceTitle" name="title" required placeholder="Например: Автовышка-платформа 13 метров">
                    <small class="form-hint">Название будет отображаться в каталоге и на странице услуги</small>
            </div>
            <div class="form-group">
                    <label for="serviceDescription">Описание *</label>
                    <textarea id="serviceDescription" name="description" rows="4" required placeholder="Опишите услугу, её особенности и применение"></textarea>
                    <small class="form-hint">Описание будет отображаться на странице услуги</small>
            </div>
            <div class="form-group">
                    <label for="serviceUrl">URL страницы</label>
                    <input type="text" id="serviceUrl" name="url" placeholder="/equipment/avtovyshka-13m.html">
                    <small class="form-hint">Если не указан, будет сгенерирован автоматически из названия</small>
            </div>
            <div class="form-group">
                    <label for="serviceOrder">Порядок отображения</label>
                    <input type="number" id="serviceOrder" name="order_num" value="0" min="0">
                    <small class="form-hint">Чем меньше число, тем выше в списке</small>
            </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">Цены</h3>
            <div class="form-group">
                    <label for="servicePriceHalfShift">Цена за полсмены</label>
                    <div class="input-with-suffix">
                        <input type="number" id="servicePriceHalfShift" name="price_half_shift" placeholder="15000" min="0" step="100">
                        <span class="input-suffix">₽</span>
                    </div>
                    <small class="form-hint">Необязательно. Введите только число</small>
                </div>
                <div class="form-group">
                    <label for="servicePriceShift">Цена за смену *</label>
                    <div class="input-with-suffix">
                        <input type="number" id="servicePriceShift" name="price_shift" placeholder="18000" min="0" step="100" required>
                        <span class="input-suffix">₽</span>
                    </div>
                    <small class="form-hint">Обязательно. Введите только число</small>
                </div>
                <div class="form-group">
                    <label for="serviceDeliveryPerKm">Цена подачи техники за КАД</label>
                    <div class="input-with-suffix">
                        <input type="number" id="serviceDeliveryPerKm" name="delivery_per_km" placeholder="85" min="0" step="1" value="85">
                        <span class="input-suffix">₽/км</span>
                    </div>
                    <small class="form-hint">Стоимость за каждый километр за КАД (в каждую сторону)</small>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">Технические характеристики</h3>
                <div class="specs-grid-form">
                    <div class="form-group">
                        <label for="serviceHeightLift">Высота подъема люльки</label>
                        <input type="text" id="serviceHeightLift" name="height_lift" placeholder="13 метров">
                    </div>
                    <div class="form-group">
                        <label for="serviceMaxReach">Максимальный вылет</label>
                        <input type="text" id="serviceMaxReach" name="max_reach" placeholder="8 метров">
                    </div>
                    <div class="form-group">
                        <label for="serviceMaxCapacity">Максимальная грузоподъемность</label>
                        <input type="text" id="serviceMaxCapacity" name="max_capacity" placeholder="400 кг">
                    </div>
                    <div class="form-group">
                        <label for="serviceLiftType">Тип подъемника</label>
                        <input type="text" id="serviceLiftType" name="lift_type" placeholder="Автовышка">
                    </div>
                    <div class="form-group">
                        <label for="serviceTransportLength">Длина в транспортном положении</label>
                        <input type="text" id="serviceTransportLength" name="transport_length" placeholder="6.5 метров">
                    </div>
                    <div class="form-group">
                        <label for="serviceTransportHeight">Высота в транспортном положении</label>
                        <input type="text" id="serviceTransportHeight" name="transport_height" placeholder="2.5 метров">
                    </div>
                    <div class="form-group">
                        <label for="serviceWidth">Ширина</label>
                        <input type="text" id="serviceWidth" name="width" placeholder="2.2 метров">
                    </div>
                    <div class="form-group">
                        <label for="serviceBoomRotationAngle">Угол поворота стрелы</label>
                        <input type="text" id="serviceBoomRotationAngle" name="boom_rotation_angle" placeholder="360°">
                    </div>
                    <div class="form-group">
                        <label for="serviceBasketRotationAngle">Угол поворота корзины</label>
                        <input type="text" id="serviceBasketRotationAngle" name="basket_rotation_angle" placeholder="360°">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">Популярная техника</h3>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="serviceIsPopular" name="is_popular" value="1">
                        Отображать в секции "Популярная техника" на главной
                    </label>
                </div>
                <div class="form-group" id="popularOrderGroup" style="display: none;">
                    <label for="servicePopularOrder">Порядок в популярных (1-4)</label>
                    <input type="number" id="servicePopularOrder" name="popular_order" min="1" max="10" value="1">
                    <small class="form-hint">Меньшее число = выше в списке</small>
                </div>
                <div class="form-group" id="cardBulletsGroup" style="display: none;">
                    <label for="serviceCardBullets">Пункты для карточки (по одному на строку)</label>
                    <textarea id="serviceCardBullets" name="card_bullets" rows="5" placeholder="Грузоподъёмность корзины: 200 кг
Размеры корзины (платформы): 2х4 м"></textarea>
                    <small class="form-hint">Для карточек на сайте используются только 2 пункта: грузоподъёмность и размер корзины. Остальные характеристики не влияют.</small>
                </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">Изображения</h3>
                <div class="form-group">
                    <label for="serviceImage">Основное изображение (URL)</label>
                <input type="text" id="serviceImage" name="image_url" placeholder="https://example.com/image.jpg">
                    <small class="form-hint">URL основного изображения услуги</small>
            </div>
            <div class="form-group">
                    <label>Или загрузите основное изображение</label>
                <input type="file" id="serviceImageFile" accept="image/*" onchange="handleImageUpload(this, 'serviceImage', 'serviceImagePreview')">
                    <small class="form-hint">Максимальный размер: 30MB. Форматы: JPG, PNG, GIF, WebP</small>
            </div>
            <div class="form-group" id="serviceImagePreviewContainer" style="display: none;">
                    <label>Превью основного изображения:</label>
                <img id="serviceImagePreview" src="" alt="Превью" style="max-width: 300px; max-height: 200px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-group">
                    <label for="serviceImagesUrls">Дополнительные изображения (URL, каждое с новой строки)</label>
                    <textarea id="serviceImagesUrls" name="images_urls" rows="4" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" onchange="updateImagesFromTextarea()"></textarea>
                    <small class="form-hint">Введите URL изображений, каждое с новой строки</small>
            </div>
            <div class="form-group">
                    <label>Или загрузите дополнительные изображения</label>
                    <input type="file" id="serviceImagesFiles" accept="image/*" multiple onchange="handleMultipleImagesUpload(this, 'serviceImagesPreview')">
                    <small class="form-hint">Можно выбрать несколько файлов. Максимальный размер каждого: 30MB. Форматы: JPG, PNG, GIF, WebP</small>
            </div>
            <div class="form-group" id="serviceImagesPreviewContainer" style="display: none;">
                    <label>Превью дополнительных изображений:</label>
                <div id="serviceImagesPreview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
            </div>
            </div>

            <div class="form-section">
                <h3 class="form-section-title">Схемы вылета стрелы</h3>
            <div class="form-group">
                    <label for="serviceReachDiagramsUrls">URL схем вылета стрелы (каждое с новой строки, можно указать название через |)</label>
                    <textarea id="serviceReachDiagramsUrls" name="reach_diagrams_urls" rows="4" placeholder="https://example.com/diagram1.jpg&#10;https://example.com/diagram2.jpg|Схема вылета 2" onchange="updateReachDiagramsFromTextarea()"></textarea>
                    <small class="form-hint">Введите URL схем, каждое с новой строки. Можно указать название через | (например: url.jpg|Название схемы)</small>
            </div>
            <div class="form-group">
                    <label>Или загрузите схемы вылета стрелы</label>
                    <input type="file" id="serviceReachDiagramsFiles" accept="image/*" multiple onchange="handleMultipleReachDiagramsUpload(this, 'serviceReachDiagramsPreview')">
                    <small class="form-hint">Можно выбрать несколько файлов. Максимальный размер каждого: 30MB. Форматы: JPG, PNG, GIF, WebP</small>
            </div>
                <div class="form-group" id="serviceReachDiagramsPreviewContainer" style="display: none;">
                    <label>Превью схем вылета стрелы:</label>
                    <div id="serviceReachDiagramsPreview" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
            </div>
            </div>
            
            <div class="form-group" style="display: none;">
                <label for="serviceSpecs">Характеристики (старое поле, для совместимости)</label>
                <textarea id="serviceSpecs" name="specifications" rows="2"></textarea>
            </div>
            <div class="form-group" style="display: none;">
                <label for="serviceReachDiagram">URL схемы вылета стрелы (старый формат, для совместимости)</label>
                <input type="text" id="serviceReachDiagram" name="reach_diagram_url" placeholder="https://example.com/diagram.jpg">
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить услугу</button>
            </div>
        </form>
    `;

    document.getElementById('modal').classList.add('show');
    
    // Загружаем данные после того, как форма добавлена в DOM
    if (id) {
        setTimeout(() => {
        loadServiceData(id);
        }, 50);
    }
    
    // Устанавливаем обработчики после того, как форма добавлена в DOM
    setTimeout(() => {
        // Функция для автоматической генерации пунктов карточки из характеристик
        function generateCardBulletsFromSpecs() {
            const maxCapacity = document.getElementById('serviceMaxCapacity')?.value.trim() || '';
            const width = document.getElementById('serviceWidth')?.value.trim() || '';
            
            const bullets = [];

            // 1) грузоподъёмность корзины
            if (maxCapacity) {
                bullets.push(`Грузоподъёмность корзины: ${maxCapacity}`);
            }

            // 2) размер корзины (платформы)
            if (width) {
                bullets.push(`Размеры корзины (платформы): ${width}`);
            }

            return bullets.slice(0, 2);
        }
        
        // Функция для обновления поля card_bullets из характеристик
        function updateCardBulletsFromSpecs() {
            const cardBulletsTextarea = document.getElementById('serviceCardBullets');
            if (!cardBulletsTextarea) return;
            
            // Генерируем пункты из характеристик
            const bullets = generateCardBulletsFromSpecs();
            
            // Обновляем textarea только если есть хотя бы один пункт
            if (bullets.length > 0) {
                cardBulletsTextarea.value = bullets.join('\n');
                
                // Триггерим событие change для обновления данных формы
                cardBulletsTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                cardBulletsTextarea.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Обработчик чекбокса "Популярная техника"
        const isPopularCheckbox = document.getElementById('serviceIsPopular');
        const popularOrderGroup = document.getElementById('popularOrderGroup');
        const cardBulletsGroup = document.getElementById('cardBulletsGroup');
        
        if (isPopularCheckbox) {
            isPopularCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                popularOrderGroup.style.display = isChecked ? 'block' : 'none';
                cardBulletsGroup.style.display = isChecked ? 'block' : 'none';
                
                // При включении популярной техники автоматически генерируем пункты
                if (isChecked) {
                    updateCardBulletsFromSpecs();
                }
            });
        }
        
        // Добавляем обработчики событий на все поля характеристик
        const specFields = [
            'serviceMaxCapacity',
            'serviceWidth',
        ];
        
        specFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Обновляем при изменении поля
                field.addEventListener('input', function() {
                    // Обновляем только если популярная техника включена
                    if (isPopularCheckbox && isPopularCheckbox.checked) {
                        updateCardBulletsFromSpecs();
                    }
                });
                
                field.addEventListener('change', function() {
                    // Обновляем только если популярная техника включена
                    if (isPopularCheckbox && isPopularCheckbox.checked) {
                        updateCardBulletsFromSpecs();
                    }
                });
            }
        });
        
        const form = document.getElementById('serviceForm');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        
        if (!form) {
            console.error('Form not found');
            return;
        }
        
        // НЕ клонируем форму, чтобы не потерять обработчики событий на динамически созданных элементах
        // Просто добавляем обработчик submit на форму
        const submitHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submit event triggered, calling saveService with id:', serviceId);
            if (window.saveService) {
                window.saveService(e, serviceId);
            } else {
                console.error('saveService function not found on window');
                alert('Ошибка: функция сохранения не найдена');
            }
            return false;
        };
        
        // Удаляем старый обработчик, если он есть, и добавляем новый
        form.removeEventListener('submit', submitHandler);
        form.addEventListener('submit', submitHandler, false);
        
        // Также добавляем обработчик на кнопку для надежности
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('disabled');
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            
            const clickHandler = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Submit button clicked, calling saveService with id:', serviceId);
                if (window.saveService) {
                    window.saveService(e, serviceId);
                } else {
                    console.error('saveService function not found on window');
                    alert('Ошибка: функция сохранения не найдена');
                }
                return false;
            };
            
            // Удаляем старый обработчик, если он есть, и добавляем новый
            submitBtn.removeEventListener('click', clickHandler);
            submitBtn.addEventListener('click', clickHandler, false);
        }
        
        // Привязываем обработчики для кнопок удаления изображений
        const imagesPreviewContainer = document.getElementById('serviceImagesPreview');
        if (imagesPreviewContainer) {
            setTimeout(() => {
                attachImageRemoveHandlers(imagesPreviewContainer);
            }, 150);
        }
        
        // Добавляем обработчики для автоматического обновления превью при вводе в textarea
        const imagesUrlsTextarea = document.getElementById('serviceImagesUrls');
        if (imagesUrlsTextarea) {
            // Удаляем старые обработчики, если есть
            imagesUrlsTextarea.removeEventListener('input', updateImagesFromTextarea);
            imagesUrlsTextarea.removeEventListener('change', updateImagesFromTextarea);
            // Добавляем обработчики для input (при вводе) и change (при потере фокуса)
            imagesUrlsTextarea.addEventListener('input', updateImagesFromTextarea);
            imagesUrlsTextarea.addEventListener('change', updateImagesFromTextarea);
        }
        
        // Добавляем делегирование событий для кнопок удаления схем вылета стрелы
        const reachDiagramsPreviewContainer = document.getElementById('serviceReachDiagramsPreview');
        if (reachDiagramsPreviewContainer) {
            // Удаляем старый обработчик, если он есть
            const oldHandler = reachDiagramsPreviewContainer._removeDiagramHandler;
            if (oldHandler) {
                reachDiagramsPreviewContainer.removeEventListener('click', oldHandler);
            }
            
            const removeDiagramHandler = function(e) {
                // Проверяем, что клик был по кнопке удаления
                const removeBtn = e.target.closest('.remove-diagram-btn');
                if (removeBtn || (e.target.tagName === 'BUTTON' && e.target.textContent === '×' && e.target.classList.contains('remove-diagram-btn'))) {
                    const targetBtn = removeBtn || e.target;
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Получаем индекс из кнопки или из родительского элемента
                    let index = parseInt(targetBtn.getAttribute('data-diagram-index'));
                    if (isNaN(index)) {
                        const diagramWrapper = targetBtn.closest('[data-diagram-index]');
                        if (diagramWrapper) {
                            index = parseInt(diagramWrapper.getAttribute('data-diagram-index'));
                        }
                    }
                    
                    console.log('=== REMOVING DIAGRAM ===');
                    console.log('Index to remove:', index, 'Array length before:', serviceReachDiagramsArray.length);
                    console.log('Array before removal:', JSON.parse(JSON.stringify(serviceReachDiagramsArray)));
                    
                    if (!isNaN(index) && index >= 0 && index < serviceReachDiagramsArray.length) {
                        const removedDiagram = serviceReachDiagramsArray.splice(index, 1);
                        console.log('Diagram removed:', removedDiagram);
                        console.log('New array length:', serviceReachDiagramsArray.length);
                        console.log('Remaining diagrams:', JSON.parse(JSON.stringify(serviceReachDiagramsArray)));
                        
                        // Временно отключаем onchange на textarea, чтобы избежать вызова updateReachDiagramsFromTextarea
                        const reachDiagramsUrlsTextarea = document.getElementById('serviceReachDiagramsUrls');
                        let oldOnChange = null;
                        if (reachDiagramsUrlsTextarea) {
                            oldOnChange = reachDiagramsUrlsTextarea.getAttribute('onchange');
                            if (oldOnChange) {
                                reachDiagramsUrlsTextarea.removeAttribute('onchange');
                            }
                        }
                        
                        // Синхронизируем textarea с обновленным массивом
                        syncReachDiagramsTextarea();
                        
                        // Очищаем старое поле reach_diagram_url, если массив пустой
                        if (serviceReachDiagramsArray.length === 0) {
                            const oldReachDiagramField = document.getElementById('serviceReachDiagram');
                            if (oldReachDiagramField) {
                                oldReachDiagramField.value = '';
                                console.log('Cleared old reach_diagram_url field');
                            }
                        }
                        
                        // Восстанавливаем onchange
                        if (reachDiagramsUrlsTextarea && oldOnChange) {
                            reachDiagramsUrlsTextarea.setAttribute('onchange', oldOnChange);
                        }
                        
                        // Перерисовываем превью
                        const container = document.getElementById('serviceReachDiagramsPreviewContainer');
                        if (container && reachDiagramsPreviewContainer) {
                            console.log('Calling renderReachDiagramsPreview with array length:', serviceReachDiagramsArray.length);
                            renderReachDiagramsPreview(reachDiagramsPreviewContainer, container);
                            
                            // Дополнительно принудительно скрываем контейнер, если массив пустой
                            if (serviceReachDiagramsArray.length === 0) {
                                container.style.display = 'none';
                                container.style.visibility = 'hidden';
                                container.style.height = '0';
                                container.style.overflow = 'hidden';
                                container.setAttribute('hidden', 'true');
                                reachDiagramsPreviewContainer.innerHTML = '';
                                reachDiagramsPreviewContainer.style.display = 'none';
                                
                                // Принудительно скрываем родительский form-group, если он есть
                                const formGroup = container.closest('.form-group');
                                if (formGroup) {
                                    formGroup.style.display = 'none';
                                    console.log('Parent form-group also hidden');
                                }
                                
                                console.log('Container forcefully hidden after removal');
                                console.log('Container computed style after hiding:', window.getComputedStyle(container).display);
                            } else {
                                container.style.display = 'block';
                                container.style.visibility = 'visible';
                                container.style.height = 'auto';
                                container.removeAttribute('hidden');
                                reachDiagramsPreviewContainer.style.display = 'flex';
                                
                                // Показываем родительский form-group, если он был скрыт
                                const formGroup = container.closest('.form-group');
                                if (formGroup) {
                                    formGroup.style.display = 'block';
                                }
                                
                                console.log('Container shown after removal');
                            }
                        }
                    } else {
                        console.warn('Invalid index for removal:', index, 'Array length:', serviceReachDiagramsArray.length);
                    }
                }
            };
            
            reachDiagramsPreviewContainer._removeDiagramHandler = removeDiagramHandler;
            reachDiagramsPreviewContainer.addEventListener('click', removeDiagramHandler, false);
        }
    }, 100);
}

async function loadServiceData(id) {
    // Защита от повторных вызовов
    if (isLoadingServiceData) {
        console.warn('loadServiceData already in progress, skipping...');
        return;
    }
    
    isLoadingServiceData = true;
    
    // Очищаем массивы ПЕРЕД загрузкой данных, чтобы избежать дублирования
    serviceReachDiagramsArray = [];
    serviceImagesArray = [];
    
    try {
        const response = await fetch(`${API_URL}/api/admin/services`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const services = await response.json();
        const service = services.find(s => s.id === id);

        if (service) {
            document.getElementById('serviceTitle').value = service.title;
            document.getElementById('serviceDescription').value = service.description;
            // Парсим цену из формата "от X ₽/полсмена, от Y ₽/смена" или "от Y ₽/смена"
            const priceStr = service.price || '';
            
            // Ищем цену за полсмену (до запятой или если есть слово "полсмен")
            let halfShiftPrice = null;
            let shiftPrice = null;
            
            // Сначала ищем полсмену
            const halfShiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
            if (halfShiftMatch) {
                halfShiftPrice = parseInt(halfShiftMatch[1].replace(/\s/g, ''));
            } else {
                // Пробуем найти до запятой
                const beforeComma = priceStr.split(',')[0];
                if (beforeComma && beforeComma.includes('полсмен')) {
                    const match = beforeComma.match(/(\d+[\s\d]*)/);
                    if (match) halfShiftPrice = parseInt(match[1].replace(/\s/g, ''));
                }
            }
            
            // Ищем цену за смену (после запятой или если нет полсмены)
            const shiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
            if (shiftMatch) {
                shiftPrice = parseInt(shiftMatch[1].replace(/\s/g, ''));
            } else {
                // Пробуем найти после запятой
                const afterComma = priceStr.split(',')[1] || priceStr;
                if (afterComma && afterComma.includes('смен')) {
                    const match = afterComma.match(/(\d+[\s\d]*)/);
                    if (match) shiftPrice = parseInt(match[1].replace(/\s/g, ''));
                } else if (!halfShiftPrice) {
                    // Если нет полсмены, ищем любое число в строке
                    const match = priceStr.match(/(\d+[\s\d]*)/);
                    if (match) shiftPrice = parseInt(match[1].replace(/\s/g, ''));
                }
            }
            
            const halfShiftInput = document.getElementById('servicePriceHalfShift');
            const shiftInput = document.getElementById('servicePriceShift');
            if (halfShiftInput && halfShiftPrice) halfShiftInput.value = halfShiftPrice;
            if (shiftInput && shiftPrice) shiftInput.value = shiftPrice;
            
            // Загружаем цену подачи за КАД
            const deliveryInput = document.getElementById('serviceDeliveryPerKm');
            if (deliveryInput) {
                deliveryInput.value = service.delivery_per_km || 85;
            }
            
            // Загружаем характеристики
            const heightLiftInput = document.getElementById('serviceHeightLift');
            const maxReachInput = document.getElementById('serviceMaxReach');
            const maxCapacityInput = document.getElementById('serviceMaxCapacity');
            const liftTypeInput = document.getElementById('serviceLiftType');
            const transportLengthInput = document.getElementById('serviceTransportLength');
            const transportHeightInput = document.getElementById('serviceTransportHeight');
            const widthInput = document.getElementById('serviceWidth');
            const boomRotationAngleInput = document.getElementById('serviceBoomRotationAngle');
            const basketRotationAngleInput = document.getElementById('serviceBasketRotationAngle');
            
            if (heightLiftInput) heightLiftInput.value = service.height_lift || '';
            if (maxReachInput) maxReachInput.value = service.max_reach || '';
            if (maxCapacityInput) maxCapacityInput.value = service.max_capacity || '';
            if (liftTypeInput) liftTypeInput.value = service.lift_type || '';
            if (transportLengthInput) transportLengthInput.value = service.transport_length || '';
            if (transportHeightInput) transportHeightInput.value = service.transport_height || '';
            if (widthInput) widthInput.value = service.width || '';
            if (boomRotationAngleInput) boomRotationAngleInput.value = service.boom_rotation_angle || '';
            if (basketRotationAngleInput) basketRotationAngleInput.value = service.basket_rotation_angle || '';
            
            // Загружаем данные популярных карточек
            const isPopularCheckbox = document.getElementById('serviceIsPopular');
            const popularOrderInput = document.getElementById('servicePopularOrder');
            const cardBulletsTextarea = document.getElementById('serviceCardBullets');
            const popularOrderGroup = document.getElementById('popularOrderGroup');
            const cardBulletsGroup = document.getElementById('cardBulletsGroup');
            
            if (isPopularCheckbox) {
                isPopularCheckbox.checked = service.is_popular === 1;
                // Показываем/скрываем дополнительные поля
                const isChecked = service.is_popular === 1;
                if (popularOrderGroup) popularOrderGroup.style.display = isChecked ? 'block' : 'none';
                if (cardBulletsGroup) cardBulletsGroup.style.display = isChecked ? 'block' : 'none';
            }
            if (popularOrderInput) popularOrderInput.value = service.popular_order || 1;
            if (cardBulletsTextarea) {
                // Парсим card_bullets из JSON
                let bullets = [];
                if (service.card_bullets) {
                    try {
                        bullets = typeof service.card_bullets === 'string' 
                            ? JSON.parse(service.card_bullets) 
                            : service.card_bullets;
                    } catch (e) {
                        console.error('Error parsing card_bullets:', e);
                        bullets = [];
                    }
                }
                
                // Если card_bullets пустые или не заполнены, автоматически генерируем из характеристик
                if (!bullets || bullets.length === 0 || bullets.every(b => !b || !b.trim())) {
                    // Генерируем пункты из характеристик (только то, что показываем в карточках)
                    const generatedBullets = [];

                    if (service.max_capacity) {
                        generatedBullets.push(`Грузоподъёмность корзины: ${service.max_capacity}`);
                    }

                    if (service.width) {
                        generatedBullets.push(`Размеры корзины (платформы): ${service.width}`);
                    }

                    bullets = generatedBullets.slice(0, 2);
                }
                
                cardBulletsTextarea.value = Array.isArray(bullets) ? bullets.slice(0, 2).join('\n') : '';
                
                // После загрузки всех данных, если популярная техника включена, 
                // автоматически обновляем пункты из характеристик (если они были изменены)
                if (isPopularCheckbox && isPopularCheckbox.checked) {
                    setTimeout(() => {
                        // Вызываем обновление через событие на одном из полей характеристик
                        const heightLiftField = document.getElementById('serviceHeightLift');
                        if (heightLiftField) {
                            // Создаем и вызываем функцию обновления напрямую
                            const cardBulletsTextareaForUpdate = document.getElementById('serviceCardBullets');
                            if (cardBulletsTextareaForUpdate) {
                                const heightLift = document.getElementById('serviceHeightLift')?.value.trim() || '';
                                const maxReach = document.getElementById('serviceMaxReach')?.value.trim() || '';
                                const maxCapacity = document.getElementById('serviceMaxCapacity')?.value.trim() || '';
                                const width = document.getElementById('serviceWidth')?.value.trim() || '';
                                const transportHeight = document.getElementById('serviceTransportHeight')?.value.trim() || '';
                                const transportLength = document.getElementById('serviceTransportLength')?.value.trim() || '';
                                
                                const generatedBullets = [];
                                if (maxCapacity) generatedBullets.push(`Грузоподъёмность корзины: ${maxCapacity}`);
                                if (width) generatedBullets.push(`Размеры корзины (платформы): ${width}`);
                                
                                // Обновляем только если есть хотя бы один пункт
                                if (generatedBullets.length > 0) {
                                    cardBulletsTextareaForUpdate.value = generatedBullets.slice(0, 2).join('\n');
                                }
                            }
                        }
                    }, 200);
                }
            }
            
            // Старое поле для совместимости
            const specsInput = document.getElementById('serviceSpecs');
            if (specsInput) specsInput.value = service.specifications || '';
            
            document.getElementById('serviceImage').value = service.image_url || '';
            document.getElementById('serviceUrl').value = service.url || '';
            document.getElementById('serviceOrder').value = service.order_num || 0;
            document.getElementById('serviceReachDiagram').value = service.reach_diagram_url || '';
            
            // Update preview if image exists
            if (service.image_url) {
                const preview = document.getElementById('serviceImagePreview');
                const container = document.getElementById('serviceImagePreviewContainer');
                if (preview && container) {
                    preview.src = service.image_url;
                    container.style.display = 'block';
                }
            }
            
            // Load existing reach diagrams
            // Массив уже очищен в начале функции, но очищаем еще раз для безопасности
            serviceReachDiagramsArray = [];
            const reachDiagramsUrlsTextarea = document.getElementById('serviceReachDiagramsUrls');
            
            console.log('Loading service data - reach_diagrams:', service.reach_diagrams);
            console.log('Type:', typeof service.reach_diagrams, Array.isArray(service.reach_diagrams));
            
            // Собираем уникальные схемы (удаляем дубликаты по URL)
            const uniqueUrls = new Set();
            const normalizedDiagrams = [];
            
            if (service.reach_diagrams) {
                let diagramsToProcess = [];
                
                if (Array.isArray(service.reach_diagrams) && service.reach_diagrams.length > 0) {
                    diagramsToProcess = service.reach_diagrams;
                } else if (typeof service.reach_diagrams === 'string' && service.reach_diagrams.trim()) {
                    try {
                        const parsed = JSON.parse(service.reach_diagrams);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            diagramsToProcess = parsed;
                        } else {
                            diagramsToProcess = [{ url: service.reach_diagrams, title: 'Схема вылета стрелы' }];
                        }
                    } catch (e) {
                        diagramsToProcess = [{ url: service.reach_diagrams, title: 'Схема вылета стрелы' }];
                    }
                }
                
                // Нормализуем и удаляем дубликаты
                diagramsToProcess.forEach(d => {
                    let url = null;
                    let title = 'Схема вылета стрелы';
                    
                    if (typeof d === 'string') {
                        url = d.trim();
                    } else if (d && typeof d === 'object' && d.url) {
                        url = d.url.trim();
                        title = d.title || 'Схема вылета стрелы';
                    }
                    
                    if (url && url.length > 0 && !uniqueUrls.has(url)) {
                        uniqueUrls.add(url);
                        normalizedDiagrams.push({ url: url, title: title });
                    }
                });
            }
            
            // Если массив пустой, проверяем старый формат reach_diagram_url
            // НО только если его нет уже в normalizedDiagrams (проверяем на дубликаты)
            if (normalizedDiagrams.length === 0 && service.reach_diagram_url) {
                console.log('Using reach_diagram_url as fallback:', service.reach_diagram_url);
                const fallbackUrl = service.reach_diagram_url.trim();
                if (fallbackUrl.length > 0 && !uniqueUrls.has(fallbackUrl)) {
                    uniqueUrls.add(fallbackUrl);
                    normalizedDiagrams.push({ url: fallbackUrl, title: 'Схема вылета стрелы' });
                }
            } else if (normalizedDiagrams.length > 0 && service.reach_diagram_url) {
                // Если есть и новый формат, и старый - проверяем, не дублируется ли старый
                const fallbackUrl = service.reach_diagram_url.trim();
                if (fallbackUrl.length > 0 && !uniqueUrls.has(fallbackUrl)) {
                    console.log('⚠️ Found both reach_diagrams and reach_diagram_url. reach_diagram_url not in array, adding as fallback');
                    uniqueUrls.add(fallbackUrl);
                    normalizedDiagrams.push({ url: fallbackUrl, title: 'Схема вылета стрелы' });
                } else if (fallbackUrl.length > 0 && uniqueUrls.has(fallbackUrl)) {
                    console.log('ℹ️ reach_diagram_url already exists in reach_diagrams array, skipping to avoid duplication');
                }
            }
            
            serviceReachDiagramsArray = normalizedDiagrams;
            
            // Заполняем textarea URL схем (временно отключаем onchange, чтобы избежать повторной обработки)
            if (reachDiagramsUrlsTextarea) {
                const oldOnChange = reachDiagramsUrlsTextarea.getAttribute('onchange');
                if (oldOnChange) {
                    reachDiagramsUrlsTextarea.removeAttribute('onchange');
                }
                
                if (serviceReachDiagramsArray.length > 0) {
                    const urlsToShow = serviceReachDiagramsArray.map(d => {
                        return d.title && d.title !== 'Схема вылета стрелы' ? `${d.url}|${d.title}` : d.url;
                    });
                    reachDiagramsUrlsTextarea.value = urlsToShow.join('\n');
                } else {
                    reachDiagramsUrlsTextarea.value = '';
                }
                
                // Восстанавливаем onchange после небольшой задержки
                setTimeout(() => {
                    if (oldOnChange) {
                        reachDiagramsUrlsTextarea.setAttribute('onchange', oldOnChange);
                    }
                }, 100);
            }
            
            console.log('Final serviceReachDiagramsArray:', serviceReachDiagramsArray);
            console.log('Final serviceReachDiagramsArray length:', serviceReachDiagramsArray.length);
            
            // Display reach diagrams preview
            const reachDiagramsPreview = document.getElementById('serviceReachDiagramsPreview');
            const reachDiagramsPreviewContainer = document.getElementById('serviceReachDiagramsPreviewContainer');
            if (reachDiagramsPreview && reachDiagramsPreviewContainer) {
                renderReachDiagramsPreview(reachDiagramsPreview, reachDiagramsPreviewContainer);
            }
            
            // Убеждаемся, что кнопка "Сохранить" активна после загрузки данных
            setTimeout(() => {
                const submitBtn = document.querySelector('#serviceForm button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.removeAttribute('disabled');
                    submitBtn.style.pointerEvents = 'auto';
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor = 'pointer';
                }
            }, 100);
            
            // Load existing images (удаляем дубликаты)
            serviceImagesArray = [];
            const imagesUrlsTextarea = document.getElementById('serviceImagesUrls');
            if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                // Удаляем дубликаты и пустые значения
                const uniqueImages = [...new Set(service.images.filter(url => url && url.trim().length > 0))];
                serviceImagesArray = uniqueImages;
                console.log('Loaded images:', uniqueImages.length, 'unique images (was', service.images.length, ')');
                
                // Заполняем textarea URL изображений (исключая основное изображение)
                if (imagesUrlsTextarea) {
                    const urlsToShow = uniqueImages.filter(url => url !== service.image_url);
                    imagesUrlsTextarea.value = urlsToShow.join('\n');
                }
                
                // Display images in preview (используем serviceImagesArray, который уже содержит уникальные изображения)
                const previewContainer = document.getElementById('serviceImagesPreview');
                const container = document.getElementById('serviceImagesPreviewContainer');
                if (previewContainer && container) {
                    renderImagesPreview(previewContainer, container);
                    // Привязываем обработчики после отрисовки
                    setTimeout(() => {
                        attachImageRemoveHandlers(previewContainer);
                    }, 50);
                }
            } else if (imagesUrlsTextarea) {
                // Если нет изображений в базе, очищаем textarea
                imagesUrlsTextarea.value = '';
            }
        }
    } catch (error) {
        console.error('Error loading service data:', error);
    } finally {
        // Сбрасываем флаг после завершения загрузки
        isLoadingServiceData = false;
    }
}

// Делаем функцию доступной глобально
window.saveService = async function(event, id) {
    console.log('saveService called', { event, id, eventType: event ? event.type : 'no event' });
    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const form = event && event.target && event.target.tagName === 'FORM' 
        ? event.target 
        : document.getElementById('serviceForm');
        
    if (!form) {
        console.error('Form not found');
        showError('Ошибка: форма не найдена');
        return;
    }
    
    console.log('Form found, proceeding with save...');
    
    // Валидация обязательных полей
    const title = document.getElementById('serviceTitle')?.value?.trim();
    const description = document.getElementById('serviceDescription')?.value?.trim();
    const priceShift = document.getElementById('servicePriceShift')?.value?.trim();
    
    if (!title) {
        showError('Пожалуйста, укажите название услуги');
        document.getElementById('serviceTitle')?.focus();
        return;
    }
    
    if (!description) {
        showError('Пожалуйста, укажите описание услуги');
        document.getElementById('serviceDescription')?.focus();
        return;
    }
    
    if (!priceShift) {
        showError('Пожалуйста, укажите цену за смену');
        document.getElementById('servicePriceShift')?.focus();
        return;
    }
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // ЯВНО получаем image_url из поля serviceImage (важно для сохранения загруженных изображений)
    const imageUrlInput = document.getElementById('serviceImage');
    if (imageUrlInput) {
        data.image_url = imageUrlInput.value?.trim() || '';
        console.log('📸 image_url из поля serviceImage:', data.image_url);
    } else {
        console.warn('⚠️ Поле serviceImage не найдено!');
        data.image_url = data.image_url || '';
    }

    // Формируем цену из двух полей
    const priceHalfShift = document.getElementById('servicePriceHalfShift')?.value || '';
    
    // Формируем строку цены
    let priceStr = '';
    if (priceHalfShift) {
        const halfShiftNum = parseInt(priceHalfShift.replace(/\s/g, ''));
        const shiftNum = parseInt(priceShift.replace(/\s/g, ''));
        priceStr = `от ${halfShiftNum.toLocaleString('ru-RU')} ₽/полсмена, от ${shiftNum.toLocaleString('ru-RU')} ₽/смена`;
    } else {
        const shiftNum = parseInt(priceShift.replace(/\s/g, ''));
        priceStr = `от ${shiftNum.toLocaleString('ru-RU')} ₽/смена`;
    }
    
    data.price = priceStr;
    
    // Явно берём название из поля (чтобы дефис «Автовышка-платформа» не терялся)
    const titleFromInput = document.getElementById('serviceTitle')?.value?.trim() || '';
    if (titleFromInput) data.title = titleFromInput;

    // Логируем данные перед отправкой для диагностики
    console.log('💾 Данные для сохранения:', {
        title: data.title,
        hasImageUrl: !!data.image_url,
        image_url: data.image_url,
        hasImages: !!data.images,
        imagesCount: Array.isArray(data.images) ? data.images.length : 0
    });
    
    // Добавляем новые поля характеристик
    data.height_lift = document.getElementById('serviceHeightLift')?.value || '';
    data.max_reach = document.getElementById('serviceMaxReach')?.value || '';
    data.max_capacity = document.getElementById('serviceMaxCapacity')?.value || '';
    data.lift_type = document.getElementById('serviceLiftType')?.value || '';
    data.transport_length = document.getElementById('serviceTransportLength')?.value || '';
    data.transport_height = document.getElementById('serviceTransportHeight')?.value || '';
    data.width = document.getElementById('serviceWidth')?.value || '';
    data.boom_rotation_angle = document.getElementById('serviceBoomRotationAngle')?.value || '';
    data.basket_rotation_angle = document.getElementById('serviceBasketRotationAngle')?.value || '';
    data.delivery_per_km = parseInt(document.getElementById('serviceDeliveryPerKm')?.value || '85');
    
    // Добавляем поля популярных карточек
    data.is_popular = document.getElementById('serviceIsPopular')?.checked ? 1 : 0;
    data.popular_order = parseInt(document.getElementById('servicePopularOrder')?.value || '0');
    
    // Обрабатываем card_bullets
    const cardBulletsText = document.getElementById('serviceCardBullets')?.value || '';
    const cardBullets = cardBulletsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    data.card_bullets = cardBullets;

    // Handle images URLs from textarea
    const imagesUrlsText = document.getElementById('serviceImagesUrls')?.value || '';
    const imagesUrls = imagesUrlsText.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
    
    // Combine uploaded images with URLs from textarea
    const allImages = [...serviceImagesArray, ...imagesUrls];
    
    // Add images array to data
    data.images = allImages;

    // Собираем все схемы из превью (включая отредактированные названия)
    // Сначала обновляем массив из превью, если там есть изменения
    const previewContainer = document.getElementById('serviceReachDiagramsPreview');
    if (previewContainer) {
        const previewItems = previewContainer.querySelectorAll('[data-diagram-index]');
        previewItems.forEach(item => {
            const index = parseInt(item.getAttribute('data-diagram-index'));
            const titleInput = item.querySelector('input[type="text"]');
            if (titleInput && serviceReachDiagramsArray[index]) {
                serviceReachDiagramsArray[index].title = titleInput.value || 'Схема вылета стрелы';
            }
        });
    }
    
    // ВАЖНО: Используем ТОЛЬКО данные из serviceReachDiagramsArray
    // НЕ читаем textarea, так как данные уже должны быть в массиве через updateReachDiagramsFromTextarea
    // НЕ вызываем updateReachDiagramsFromTextarea здесь, чтобы не перезаписать удаленные элементы
    // Удаляем все дубликаты по URL перед сохранением
    const uniqueUrls = new Map(); // Используем Map для хранения последнего значения для каждого URL
    
    console.log('=== SAVING REACH DIAGRAMS ===');
    console.log('serviceReachDiagramsArray before saving:', JSON.stringify(serviceReachDiagramsArray, null, 2));
    
    serviceReachDiagramsArray.forEach(diagram => {
        if (diagram && diagram.url) {
            const url = diagram.url.trim();
            if (url && url.length > 0) {
                // Сохраняем последнее значение для каждого URL (если есть дубликаты)
                uniqueUrls.set(url, {
                    url: url,
                    title: (diagram.title && diagram.title.trim()) || 'Схема вылета стрелы'
                });
            }
        }
    });
    
    // Преобразуем Map в массив
    const allReachDiagrams = Array.from(uniqueUrls.values());
    
    // Debug logging
    console.log('=== SAVING REACH DIAGRAMS ===');
    console.log('serviceReachDiagramsArray before saving:', JSON.stringify(serviceReachDiagramsArray, null, 2));
    console.log('Final reach_diagrams to save:', JSON.stringify(allReachDiagrams, null, 2));
    
    // Add reach_diagrams array to data
    data.reach_diagrams = allReachDiagrams;
    console.log('Total unique diagrams to save:', allReachDiagrams.length);
    console.log('data.reach_diagrams:', data.reach_diagrams);
    
    // Проверка на дубликаты перед сохранением
    const urlsInData = allReachDiagrams.map(d => d.url);
    const uniqueUrlsInData = new Set(urlsInData);
    if (urlsInData.length !== uniqueUrlsInData.size) {
        console.error('⚠️ WARNING: Duplicates detected! Removing them...', {
            total: urlsInData.length,
            unique: uniqueUrlsInData.size,
            duplicates: urlsInData.length - uniqueUrlsInData.size
        });
        // Удаляем дубликаты еще раз
        const finalUnique = new Map();
        allReachDiagrams.forEach(d => {
            if (d && d.url) {
                finalUnique.set(d.url.trim(), d);
            }
        });
        data.reach_diagrams = Array.from(finalUnique.values());
    }
    
    // Keep reach_diagram_url for backward compatibility (use first diagram if exists)
    // И ОЧИЩАЕМ его, если массив пустой
    if (data.reach_diagrams.length > 0) {
        data.reach_diagram_url = data.reach_diagrams[0].url;
        console.log('Setting reach_diagram_url to:', data.reach_diagram_url);
    } else {
        data.reach_diagram_url = ''; // Очищаем старое поле, если массив пустой
        console.log('Clearing reach_diagram_url (no diagrams to save)');
        console.warn('⚠️ No valid reach diagrams to save!');
    }

    const url = id ? `${API_URL}/api/admin/services/${id}` : `${API_URL}/api/admin/services`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            showSuccess('Услуга успешно сохранена!');
            setTimeout(() => {
            closeModal();
                loadServices();
            }, 1000);
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            showError('Ошибка при сохранении: ' + (errorData.error || 'Неизвестная ошибка'));
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    } catch (error) {
        showError('Ошибка при сохранении: ' + error.message);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
}

// Функции для показа сообщений
function showError(message) {
    // Удаляем предыдущие сообщения
    const existing = document.querySelectorAll('.error-message.show[style*="position: fixed"]');
    existing.forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.right = '20px';
    errorDiv.style.zIndex = '10000';
    errorDiv.style.padding = '1rem 1.5rem';
    errorDiv.style.borderRadius = '8px';
    errorDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    errorDiv.style.maxWidth = '400px';
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
}

function showSuccess(message) {
    // Удаляем предыдущие сообщения
    const existing = document.querySelectorAll('.success-message.show[style*="position: fixed"]');
    existing.forEach(el => el.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.textContent = message;
    successDiv.style.position = 'fixed';
    successDiv.style.top = '20px';
    successDiv.style.right = '20px';
    successDiv.style.zIndex = '10000';
    successDiv.style.padding = '1rem 1.5rem';
    successDiv.style.borderRadius = '8px';
    successDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    successDiv.style.maxWidth = '400px';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

function editService(id) {
    showServiceModal(id);
}

async function deleteService(id) {
    if (!confirm('Вы уверены, что хотите удалить эту услугу?')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            loadServices();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            alert('Ошибка при удалении: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка при удалении: ' + error.message);
    }
}

// Reviews Management
async function loadReviews() {
    try {
        const response = await fetch(`${API_URL}/api/admin/reviews`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const reviews = await response.json();

        const html = reviews.map(review => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${escapeHtml(review.client_name)}</div>
                    <div class="item-description">${escapeHtml(review.text)}</div>
                    <div class="item-meta">
                        <span>${escapeHtml(review.company || '')}</span>
                        <span>${'★'.repeat(review.rating)}</span>
                        <span>${escapeHtml(review.date)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-small btn-primary" onclick="editReview(${review.id})">Редактировать</button>
                    <button class="btn btn-small btn-danger" onclick="deleteReview(${review.id})">Удалить</button>
                </div>
            </div>
        `).join('');

        document.getElementById('reviewsList').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">💬</div><p>Нет добавленных отзывов</p></div>';
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Ошибка при загрузке отзывов</p></div>';
    }
}

function showReviewModal(id = null) {
    document.getElementById('modalTitle').textContent = id ? 'Редактировать отзыв' : 'Добавить отзыв';
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <form id="reviewForm" onsubmit="saveReview(event, ${id})">
            <div class="form-group">
                <label for="reviewName">Имя клиента</label>
                <input type="text" id="reviewName" name="client_name" required>
            </div>
            <div class="form-group">
                <label for="reviewCompany">Компания</label>
                <input type="text" id="reviewCompany" name="company">
            </div>
            <div class="form-group">
                <label for="reviewRating">Оценка (1-5)</label>
                <input type="number" id="reviewRating" name="rating" min="1" max="5" value="5" required>
            </div>
            <div class="form-group">
                <label for="reviewText">Текст отзыва</label>
                <textarea id="reviewText" name="text" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="reviewImageUrl">URL изображения (опционально)</label>
                <input type="text" id="reviewImageUrl" name="image_url" placeholder="https://example.com/image.jpg">
            </div>
            <div class="form-group">
                <label>Или загрузите изображение</label>
                <input type="file" id="reviewImageFile" accept="image/*" onchange="handleImageUpload(this, 'reviewImageUrl', 'reviewImagePreview')">
                <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">Максимальный размер: 30MB. Форматы: JPG, PNG, GIF, WebP</small>
            </div>
            <div class="form-group" id="reviewImagePreviewContainer" style="display: none;">
                <label>Превью изображения:</label>
                <img id="reviewImagePreview" src="" alt="Превью" style="max-width: 300px; max-height: 200px; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div class="form-group">
                <label for="reviewDate">Дата</label>
                <input type="date" id="reviewDate" name="date" required>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Отмена</button>
                <button type="submit" class="btn btn-primary">Сохранить</button>
            </div>
        </form>
    `;

    if (id) {
        loadReviewData(id);
    } else {
        // Set today's date as default
        document.getElementById('reviewDate').valueAsDate = new Date();
    }

    document.getElementById('modal').classList.add('show');
}

async function loadReviewData(id) {
    try {
        const response = await fetch(`${API_URL}/api/reviews`);
        const reviews = await response.json();
        const review = reviews.find(r => r.id === id);

        if (review) {
            document.getElementById('reviewName').value = review.client_name;
            document.getElementById('reviewCompany').value = review.company || '';
            document.getElementById('reviewRating').value = review.rating;
            document.getElementById('reviewText').value = review.text;
            document.getElementById('reviewDate').value = review.date;
            document.getElementById('reviewImageUrl').value = review.image_url || '';
            
            // Update preview if image exists
            if (review.image_url) {
                const preview = document.getElementById('reviewImagePreview');
                const container = document.getElementById('reviewImagePreviewContainer');
                if (preview && container) {
                    preview.src = review.image_url;
                    container.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error loading review data:', error);
    }
}

async function saveReview(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const url = id ? `${API_URL}/api/admin/reviews/${id}` : `${API_URL}/api/admin/reviews`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            loadReviews();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            alert('Ошибка при сохранении: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка при сохранении: ' + error.message);
    }
}

function editReview(id) {
    showReviewModal(id);
}

async function deleteReview(id) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            loadReviews();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            alert('Ошибка при удалении: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка при удалении: ' + error.message);
    }
}

// Requests Management
async function loadRequests() {
    try {
        const response = await fetch(`${API_URL}/api/admin/requests`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const requests = await response.json();

        const html = requests.map(request => {
            const statusClass = {
                'new': 'badge-warning',
                'in_progress': 'badge-info',
                'completed': 'badge-success',
                'cancelled': 'badge-danger'
            }[request.status] || 'badge-info';

            const statusText = {
                'new': 'Новая',
                'in_progress': 'В работе',
                'completed': 'Завершена',
                'cancelled': 'Отменена'
            }[request.status] || request.status;

            return `
                <div class="item-card">
                    <div class="item-info">
                        <div class="item-title">${escapeHtml(request.name)}</div>
                        <div class="item-description">${escapeHtml(request.message || 'Без сообщения')}</div>
                        <div class="item-meta">
                            <span>📞 ${escapeHtml(request.phone)}</span>
                            ${request.email ? `<span>✉️ ${escapeHtml(request.email)}</span>` : ''}
                            <span>${new Date(request.created_at).toLocaleString('ru-RU')}</span>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <select onchange="updateRequestStatus(${request.id}, this.value)" class="form-control">
                            <option value="new" ${request.status === 'new' ? 'selected' : ''}>Новая</option>
                            <option value="in_progress" ${request.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                            <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>Завершена</option>
                            <option value="cancelled" ${request.status === 'cancelled' ? 'selected' : ''}>Отменена</option>
                        </select>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('requestsList').innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📩</div><p>Нет новых заявок</p></div>';
    } catch (error) {
        console.error('Error loading requests:', error);
        document.getElementById('requestsList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p>Ошибка при загрузке заявок</p></div>';
    }
}

async function updateRequestStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/api/admin/requests/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadRequests();
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
            alert('Ошибка при обновлении статуса: ' + (errorData.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        alert('Ошибка при обновлении статуса: ' + error.message);
    }
}

// Handle image upload
async function handleImageUpload(fileInput, imageUrlInputId, previewId) {
    const file = fileInput.files[0];
    if (!file) {
        // Reset preview if file was removed
        const preview = document.getElementById(previewId);
        const container = document.getElementById(previewId + 'Container');
        if (preview && container) {
            const imageUrlInput = document.getElementById(imageUrlInputId);
            if (!imageUrlInput || !imageUrlInput.value) {
                preview.style.display = 'none';
                container.style.display = 'none';
            }
        }
        return;
    }
    
    // Validate file size (30MB)
    if (file.size > 30 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 30MB');
        fileInput.value = '';
        return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Недопустимый формат файла. Разрешены: JPG, PNG, GIF, WebP');
        fileInput.value = '';
        return;
    }
    
    // Show loading state
    const preview = document.getElementById(previewId);
    const container = document.getElementById(previewId + 'Container');
    if (preview && container) {
        preview.src = '';
        preview.style.display = 'block';
        container.style.display = 'block';
        preview.alt = 'Загрузка...';
        preview.style.opacity = '0.5';
    }
    
    // Upload file (основное изображение услуги)
    const uploadedUrl = await uploadImage(file, imageUrlInputId, previewId, 'main-image');
    
    if (uploadedUrl && preview) {
        preview.style.opacity = '1';
    } else if (!uploadedUrl && preview) {
        preview.style.display = 'none';
        if (container) container.style.display = 'none';
        fileInput.value = '';
    }
}

// Handle multiple images upload
let serviceImagesArray = []; // Store array of image URLs
let serviceReachDiagramsArray = []; // Store array of reach diagrams with {url, title}

// Функция для отрисовки превью изображений
function renderImagesPreview(previewContainer, container) {
    if (!previewContainer || !container) {
        console.error('❌ renderImagesPreview: containers not found', { previewContainer, container });
        return;
    }
    
    previewContainer.innerHTML = '';
    
    if (serviceImagesArray.length > 0) {
        serviceImagesArray.forEach((url, index) => {
            // Обрабатываем URL - преобразуем localhost в относительный путь
            let imageUrl = url;
            if (url && (url.startsWith('http://localhost:3000/') || url.startsWith('http://127.0.0.1:3000/'))) {
                imageUrl = url.replace(/^https?:\/\/[^\/]+/, '');
            }
            
            const imgWrapper = document.createElement('div');
            imgWrapper.style.position = 'relative';
            imgWrapper.style.width = '150px';
            imgWrapper.style.height = '150px';
            imgWrapper.style.marginBottom = '10px';
            imgWrapper.style.marginRight = '10px';
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Фото ${index + 1}`;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            img.style.backgroundColor = '#f5f5f5';
            
            // Обработка ошибок загрузки изображения
            img.onerror = function() {
                console.error('❌ Failed to load image:', imageUrl);
                this.style.backgroundColor = '#ffebee';
                this.style.border = '2px solid #f44336';
                // Добавляем текст ошибки
                const errorText = document.createElement('div');
                errorText.textContent = 'Ошибка загрузки';
                errorText.style.position = 'absolute';
                errorText.style.bottom = '5px';
                errorText.style.left = '5px';
                errorText.style.right = '5px';
                errorText.style.background = 'rgba(244, 67, 54, 0.9)';
                errorText.style.color = 'white';
                errorText.style.padding = '2px 5px';
                errorText.style.fontSize = '10px';
                errorText.style.borderRadius = '3px';
                errorText.style.textAlign = 'center';
                imgWrapper.appendChild(errorText);
            };
            
            img.onload = function() {
                console.log('✅ Image loaded successfully:', imageUrl);
            };
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.type = 'button';
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.right = '5px';
            removeBtn.style.background = '#ff4444';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '24px';
            removeBtn.style.height = '24px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '18px';
            removeBtn.style.lineHeight = '1';
            removeBtn.style.zIndex = '10';
            removeBtn.setAttribute('data-image-index', index);
            removeBtn.className = 'remove-image-btn';
            
            imgWrapper.appendChild(img);
            imgWrapper.appendChild(removeBtn);
            previewContainer.appendChild(imgWrapper);
        });
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Функция для привязки обработчиков удаления изображений
function attachImageRemoveHandlers(previewContainer) {
    if (!previewContainer) return;
    
    // Удаляем старый обработчик, если он есть
    const oldHandler = previewContainer._removeImageHandler;
    if (oldHandler) {
        previewContainer.removeEventListener('click', oldHandler);
    }
    
    const removeImageHandler = function(e) {
        const removeBtn = e.target.closest('.remove-image-btn');
        if (removeBtn || (e.target.tagName === 'BUTTON' && e.target.textContent === '×' && e.target.classList.contains('remove-image-btn'))) {
            const targetBtn = removeBtn || e.target;
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(targetBtn.getAttribute('data-image-index'));
            console.log('🗑️ Removing image at index:', index, 'Array length:', serviceImagesArray.length);
            if (!isNaN(index) && index >= 0 && index < serviceImagesArray.length) {
                serviceImagesArray.splice(index, 1);
                console.log('✅ Image removed. New array length:', serviceImagesArray.length);
                
                // Обновляем textarea
                const imagesUrlsTextarea = document.getElementById('serviceImagesUrls');
                if (imagesUrlsTextarea) {
                    if (serviceImagesArray.length > 0) {
                        const urlsToShow = serviceImagesArray.filter(url => url !== document.getElementById('serviceImage')?.value);
                        imagesUrlsTextarea.value = urlsToShow.join('\n');
                    } else {
                        imagesUrlsTextarea.value = '';
                    }
                }
                
                // Перерисовываем превью
                const container = document.getElementById('serviceImagesPreviewContainer');
                if (container) {
                    renderImagesPreview(previewContainer, container);
                    // Привязываем обработчики снова после перерисовки
                    setTimeout(() => {
                        attachImageRemoveHandlers(previewContainer);
                    }, 50);
                }
            } else {
                console.warn('⚠️ Invalid index:', index, 'Array length:', serviceImagesArray.length);
            }
        }
    };
    
    previewContainer._removeImageHandler = removeImageHandler;
    previewContainer.addEventListener('click', removeImageHandler, false);
    console.log('✅ Image remove handlers attached');
}

async function handleMultipleImagesUpload(fileInput, previewContainerId) {
    const files = Array.from(fileInput.files);
    if (!files || files.length === 0) {
        return;
    }
    
    const previewContainer = document.getElementById(previewContainerId);
    const container = document.getElementById(previewContainerId + 'Container');
    
    if (!previewContainer || !container) return;
    
    // Clear existing previews
    previewContainer.innerHTML = '';
    container.style.display = 'none';
    
    // Validate all files
    const validFiles = [];
    for (const file of files) {
        // Validate file size (30MB)
        if (file.size > 30 * 1024 * 1024) {
            alert(`Файл "${file.name}" слишком большой. Максимальный размер: 30MB`);
            continue;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert(`Файл "${file.name}" имеет недопустимый формат. Разрешены: JPG, PNG, GIF, WebP`);
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
        fileInput.value = '';
        return;
    }
    
    // Show loading state
    container.style.display = 'block';
    previewContainer.innerHTML = '<p>Загрузка изображений...</p>';
    
    // Upload all files
    const uploadedUrls = [];
    for (const file of validFiles) {
        try {
            const url = await uploadImage(file, null, null, 'gallery');
            if (url) {
                uploadedUrls.push(url);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    }
    
    // Update images array (удаляем дубликаты и обрабатываем localhost URL)
    const uniqueUrls = new Set();
    serviceImagesArray.forEach(url => {
        if (url && url.trim().length > 0) {
            // Преобразуем localhost URL в относительные пути
            let processedUrl = url.trim();
            if (processedUrl.startsWith('http://localhost:3000/') || processedUrl.startsWith('http://127.0.0.1:3000/')) {
                processedUrl = processedUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            uniqueUrls.add(processedUrl);
        }
    });
    uploadedUrls.forEach(url => {
        if (url && url.trim().length > 0) {
            // Преобразуем localhost URL в относительные пути
            let processedUrl = url.trim();
            if (processedUrl.startsWith('http://localhost:3000/') || processedUrl.startsWith('http://127.0.0.1:3000/')) {
                processedUrl = processedUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            if (!uniqueUrls.has(processedUrl)) {
                uniqueUrls.add(processedUrl);
            }
        }
    });
    serviceImagesArray = Array.from(uniqueUrls);
    
    console.log('📸 Images array updated. Total unique images:', serviceImagesArray.length);
    
    // Display previews
    renderImagesPreview(previewContainer, container);
    
    // Привязываем обработчики после отрисовки
    setTimeout(() => {
        attachImageRemoveHandlers(previewContainer);
    }, 50);
}

// Handle multiple reach diagrams upload
async function handleMultipleReachDiagramsUpload(fileInput, previewContainerId) {
    const files = Array.from(fileInput.files);
    if (!files || files.length === 0) {
        return;
    }
    
    const previewContainer = document.getElementById(previewContainerId);
    const container = document.getElementById(previewContainerId + 'Container');
    
    if (!previewContainer || !container) return;
    
    // Validate all files
    const validFiles = [];
    for (const file of files) {
        // Validate file size (30MB)
        if (file.size > 30 * 1024 * 1024) {
            alert(`Файл "${file.name}" слишком большой. Максимальный размер: 30MB`);
            continue;
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert(`Файл "${file.name}" имеет недопустимый формат. Разрешены: JPG, PNG, GIF, WebP`);
            continue;
        }
        
        validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
        fileInput.value = '';
        return;
    }
    
    // Show loading state
    container.style.display = 'block';
    previewContainer.innerHTML = '<p>Загрузка схем...</p>';
    
    // Upload all files
    const uploadedDiagrams = [];
    const uploadErrors = [];
    
    for (const file of validFiles) {
        try {
            console.log(`📤 Загрузка схемы: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
            const url = await uploadImage(file, null, null, 'reach-diagram');
            if (url) {
                console.log(`✅ Схема загружена успешно: ${url}`);
                uploadedDiagrams.push({ url: url, title: `Схема вылета стрелы ${serviceReachDiagramsArray.length + uploadedDiagrams.length + 1}` });
            } else {
                console.error(`❌ Схема не загружена: ${file.name}`);
                uploadErrors.push({ name: file.name, error: 'Загрузка вернула null' });
            }
        } catch (error) {
            console.error(`❌ Ошибка при загрузке схемы ${file.name}:`, error);
            uploadErrors.push({ name: file.name, error: error.message || 'Неизвестная ошибка' });
        }
    }
    
    // Показываем ошибки, если есть
    if (uploadErrors.length > 0) {
        const errorMessages = uploadErrors.map(e => `${e.name}: ${e.error}`).join('\n');
        console.error('❌ Ошибки загрузки:', errorMessages);
        alert(`Не удалось загрузить ${uploadErrors.length} файл(ов):\n\n${errorMessages}`);
    }
    
    // Если ничего не загрузилось, скрываем контейнер
    if (uploadedDiagrams.length === 0 && uploadErrors.length > 0) {
        container.style.display = 'none';
        previewContainer.innerHTML = '<div style="color: red; padding: 10px;">Ошибка загрузки файлов. Проверьте консоль браузера (F12) для деталей.</div>';
        fileInput.value = '';
        return;
    }
    
    // Update diagrams array, avoiding duplicates
    const uniqueUrls = new Set();
    // Сначала добавляем существующие URL
    serviceReachDiagramsArray.forEach(d => {
        if (d && d.url) {
            const url = d.url.trim();
            if (url) {
                uniqueUrls.add(url);
            }
        }
    });
    
    // Затем добавляем только новые загруженные схемы
    uploadedDiagrams.forEach(diagram => {
        if (diagram && diagram.url) {
            const url = diagram.url.trim();
            if (url && url.length > 0 && !uniqueUrls.has(url)) {
                uniqueUrls.add(url);
                serviceReachDiagramsArray.push({
                    url: url,
                    title: (diagram.title && diagram.title.trim()) || 'Схема вылета стрелы'
                });
            }
        }
    });
    
    // Display previews
    renderReachDiagramsPreview(previewContainer, container);
}

// Update images from textarea
function updateImagesFromTextarea() {
    const imagesUrlsText = document.getElementById('serviceImagesUrls')?.value || '';
    const imagesFromUrls = imagesUrlsText.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        // Преобразуем localhost URL в относительные пути
        .map(url => {
            // Если URL содержит localhost, преобразуем в относительный путь
            if (url.startsWith('http://localhost:3000/') || url.startsWith('http://127.0.0.1:3000/')) {
                return url.replace(/^https?:\/\/[^\/]+/, '');
            }
            // Если это полный URL (не localhost), оставляем как есть
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            // Если это относительный путь без начального слэша, добавляем его
            if (!url.startsWith('/')) {
                return '/' + url;
            }
            return url;
        });
    
    // Собираем уникальные изображения: сначала из textarea, затем добавляем загруженные файлы, которых нет в textarea
    const uniqueUrls = new Set();
    
    // Сначала добавляем изображения из textarea
    imagesFromUrls.forEach(url => {
        if (url && url.trim().length > 0) {
            uniqueUrls.add(url.trim());
        }
    });
    
    // Затем добавляем загруженные файлы, которых нет в textarea
    serviceImagesArray.forEach(url => {
        // Также обрабатываем URL из массива
        let processedUrl = url;
        if (url && (url.startsWith('http://localhost:3000/') || url.startsWith('http://127.0.0.1:3000/'))) {
            processedUrl = url.replace(/^https?:\/\/[^\/]+/, '');
        }
        if (processedUrl && processedUrl.trim().length > 0 && !uniqueUrls.has(processedUrl.trim())) {
            uniqueUrls.add(processedUrl.trim());
        }
    });
    
    // Преобразуем Set в массив
    serviceImagesArray = Array.from(uniqueUrls);
    
    console.log('📸 Updated images array from textarea. Total unique images:', serviceImagesArray.length);
    
    // Display images in preview
    const previewContainer = document.getElementById('serviceImagesPreview');
    const container = document.getElementById('serviceImagesPreviewContainer');
    if (previewContainer && container) {
        // Показываем контейнер, если есть изображения
        if (serviceImagesArray.length > 0) {
            container.style.display = 'block';
        }
        renderImagesPreview(previewContainer, container);
        // Привязываем обработчики после отрисовки
        setTimeout(() => {
            attachImageRemoveHandlers(previewContainer);
        }, 50);
    } else {
        console.error('❌ Preview container not found:', { previewContainer, container });
    }
}

// Update reach diagrams from textarea
function updateReachDiagramsFromTextarea() {
    const reachDiagramsUrlsText = document.getElementById('serviceReachDiagramsUrls')?.value || '';
    const reachDiagramsFromUrls = reachDiagramsUrlsText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const parts = line.split('|').map(p => p.trim());
            return {
                url: parts[0],
                title: parts[1] || 'Схема вылета стрелы'
            };
        });
    
    // Собираем уникальные схемы: сначала из textarea, затем добавляем загруженные файлы, которых нет в textarea
    const uniqueUrls = new Map(); // Используем Map для гарантированного удаления дубликатов
    
    // Сначала добавляем схемы из textarea
    reachDiagramsFromUrls.forEach(diagram => {
        if (diagram && diagram.url && diagram.url.trim().length > 0) {
            const url = diagram.url.trim();
            uniqueUrls.set(url, {
                url: url,
                title: (diagram.title && diagram.title.trim()) || 'Схема вылета стрелы'
            });
        }
    });
    
    // Затем добавляем загруженные файлы, которых нет в textarea
    serviceReachDiagramsArray.forEach(diagram => {
        if (diagram && diagram.url && diagram.url.trim().length > 0) {
            const url = diagram.url.trim();
            if (!uniqueUrls.has(url)) {
                uniqueUrls.set(url, {
                    url: url,
                    title: (diagram.title && diagram.title.trim()) || 'Схема вылета стрелы'
                });
            }
        }
    });
    
    // Преобразуем Map в массив
    serviceReachDiagramsArray = Array.from(uniqueUrls.values());
    
    const previewContainer = document.getElementById('serviceReachDiagramsPreview');
    const container = document.getElementById('serviceReachDiagramsPreviewContainer');
    if (previewContainer && container) {
        renderReachDiagramsPreview(previewContainer, container);
    }
}

// Синхронизирует textarea с текущим состоянием serviceReachDiagramsArray
function syncReachDiagramsTextarea(skipUpdate = false) {
    const reachDiagramsUrlsTextarea = document.getElementById('serviceReachDiagramsUrls');
    if (reachDiagramsUrlsTextarea) {
        console.log('syncReachDiagramsTextarea: array length:', serviceReachDiagramsArray.length);
        
        // Временно удаляем обработчик onchange, чтобы избежать вызова updateReachDiagramsFromTextarea
        const oldOnChange = reachDiagramsUrlsTextarea.getAttribute('onchange');
        if (oldOnChange) {
            console.log('syncReachDiagramsTextarea: temporarily removing onchange handler');
            reachDiagramsUrlsTextarea.removeAttribute('onchange');
        }
        
        if (serviceReachDiagramsArray.length > 0) {
            const urlsToShow = serviceReachDiagramsArray.map(d => {
                return d.title && d.title !== 'Схема вылета стрелы' ? `${d.url}|${d.title}` : d.url;
            });
            reachDiagramsUrlsTextarea.value = urlsToShow.join('\n');
            console.log('syncReachDiagramsTextarea: updated textarea with', urlsToShow.length, 'URLs:', urlsToShow);
        } else {
            reachDiagramsUrlsTextarea.value = '';
            console.log('syncReachDiagramsTextarea: cleared textarea');
        }
        
        // Восстанавливаем обработчик onchange
        if (oldOnChange) {
            console.log('syncReachDiagramsTextarea: restoring onchange handler');
            reachDiagramsUrlsTextarea.setAttribute('onchange', oldOnChange);
        }
    }
}

// Render reach diagrams preview
function renderReachDiagramsPreview(previewContainer, container) {
    if (!previewContainer) {
        console.warn('renderReachDiagramsPreview: previewContainer is null');
        return;
    }
    
    // Всегда очищаем контейнер перед рендерингом
        previewContainer.innerHTML = '';
    
    // Удаляем дубликаты перед рендерингом (по URL) используя Map для гарантии
    const uniqueUrls = new Map();
    
    serviceReachDiagramsArray.forEach(diagram => {
        if (diagram && diagram.url) {
            const url = diagram.url.trim();
            if (url && url.length > 0) {
                // Map автоматически удаляет дубликаты по ключу (URL)
                uniqueUrls.set(url, {
                    url: url,
                    title: (diagram.title && diagram.title.trim()) || 'Схема вылета стрелы'
                });
            }
        }
    });
    
    // Преобразуем Map в массив и обновляем serviceReachDiagramsArray
    const previousLength = serviceReachDiagramsArray.length;
    const newArray = Array.from(uniqueUrls.values());
    
    console.log('renderReachDiagramsPreview: previous length:', previousLength, 'new length:', newArray.length);
    console.log('renderReachDiagramsPreview: previous array:', JSON.parse(JSON.stringify(serviceReachDiagramsArray)));
    console.log('renderReachDiagramsPreview: new array:', JSON.parse(JSON.stringify(newArray)));
    
    // Обновляем массив
    serviceReachDiagramsArray = newArray;
    
    console.log('renderReachDiagramsPreview: rendering', serviceReachDiagramsArray.length, 'diagrams');
    
    if (serviceReachDiagramsArray.length > 0) {
        container.style.display = 'block';
        serviceReachDiagramsArray.forEach((diagram, index) => {
            const diagramWrapper = document.createElement('div');
            diagramWrapper.setAttribute('data-diagram-index', index);
            diagramWrapper.className = 'reach-diagram-wrapper';
            diagramWrapper.style.position = 'relative';
            diagramWrapper.style.width = '200px';
            diagramWrapper.style.marginBottom = '10px';
            diagramWrapper.style.border = '1px solid #ddd';
            diagramWrapper.style.borderRadius = '4px';
            
            let imageUrl = diagram.url || diagram;
            
            // Преобразуем localhost URL в относительный путь
            if (imageUrl.startsWith('http://localhost:3000/') || imageUrl.startsWith('http://127.0.0.1:3000/')) {
                imageUrl = imageUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
            
            // Если это относительный путь без начального слэша, добавляем его
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            diagramWrapper.style.padding = '8px';
            diagramWrapper.style.backgroundColor = '#f9f9f9';
            
            const img = document.createElement('img');
            // Для превью в админке используем полный URL, но сохраняем относительный путь
            const previewUrl = imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            img.src = previewUrl;
            img.alt = diagram.title || `Схема ${index + 1}`;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';
            img.style.marginBottom = '8px';
            img.style.objectFit = 'cover';
            img.style.backgroundColor = '#f5f5f5';
            
            // Обработка ошибок загрузки изображения
            img.onerror = function() {
                console.error('❌ Failed to load reach diagram:', previewUrl, 'Original URL:', imageUrl);
                this.style.backgroundColor = '#ffebee';
                this.style.border = '2px solid #f44336';
                
                // Удаляем предыдущие сообщения об ошибках
                const existingError = diagramWrapper.querySelector('.diagram-error-text');
                if (existingError) {
                    existingError.remove();
                }
                
                const errorText = document.createElement('div');
                errorText.className = 'diagram-error-text';
                errorText.textContent = 'Ошибка загрузки';
                errorText.style.position = 'absolute';
                errorText.style.bottom = '5px';
                errorText.style.left = '5px';
                errorText.style.right = '5px';
                errorText.style.background = 'rgba(244, 67, 54, 0.9)';
                errorText.style.color = 'white';
                errorText.style.padding = '2px 5px';
                errorText.style.fontSize = '10px';
                errorText.style.borderRadius = '3px';
                errorText.style.textAlign = 'center';
                errorText.style.zIndex = '10';
                diagramWrapper.appendChild(errorText);
            };
            
            img.onload = function() {
                console.log('✅ Reach diagram loaded successfully:', previewUrl);
                // Удаляем сообщения об ошибках при успешной загрузке
                const existingError = diagramWrapper.querySelector('.diagram-error-text');
                if (existingError) {
                    existingError.remove();
                }
            };
            
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = diagram.title || `Схема вылета стрелы ${index + 1}`;
            titleInput.placeholder = 'Название схемы';
            titleInput.style.width = '100%';
            titleInput.style.padding = '4px 8px';
            titleInput.style.border = '1px solid #ddd';
            titleInput.style.borderRadius = '4px';
            titleInput.style.fontSize = '12px';
            titleInput.onchange = (e) => {
                if (serviceReachDiagramsArray[index]) {
                    serviceReachDiagramsArray[index].title = e.target.value || 'Схема вылета стрелы';
                    // Синхронизируем textarea при изменении названия
                    syncReachDiagramsTextarea();
                }
            };
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.type = 'button';
            removeBtn.className = 'remove-diagram-btn';
            removeBtn.setAttribute('data-diagram-index', index);
            removeBtn.style.position = 'absolute';
            removeBtn.style.top = '5px';
            removeBtn.style.right = '5px';
            removeBtn.style.background = '#ff4444';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '24px';
            removeBtn.style.height = '24px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.fontSize = '18px';
            removeBtn.style.lineHeight = '1';
            removeBtn.style.zIndex = '10';
            
            diagramWrapper.appendChild(img);
            diagramWrapper.appendChild(titleInput);
            diagramWrapper.appendChild(removeBtn);
            previewContainer.appendChild(diagramWrapper);
        });
        if (container) {
            container.style.display = 'block';
            console.log('renderReachDiagramsPreview: container displayed');
        }
    } else {
        if (container) {
            // Принудительно скрываем контейнер несколькими способами
        container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.height = '0';
            container.style.overflow = 'hidden';
            container.setAttribute('hidden', 'true');
            console.log('renderReachDiagramsPreview: container hidden (no diagrams)');
            console.log('renderReachDiagramsPreview: container computed style:', window.getComputedStyle(container).display);
        }
        // Также очищаем превью, если массив пустой
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'none';
            console.log('renderReachDiagramsPreview: preview container cleared');
        }
    }
    
    console.log('renderReachDiagramsPreview: rendered', serviceReachDiagramsArray.length, 'diagrams');
    console.log('renderReachDiagramsPreview: container display style:', container ? container.style.display : 'container is null');
    console.log('renderReachDiagramsPreview: container computed display:', container ? window.getComputedStyle(container).display : 'container is null');
}

// Modal Management
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('show');
        // Reset file inputs
        serviceImagesArray = []; // Reset images array
        serviceReachDiagramsArray = []; // Reset reach diagrams array
        const imagesPreview = document.getElementById('serviceImagesPreview');
        const imagesPreviewContainer = document.getElementById('serviceImagesPreviewContainer');
        if (imagesPreview) imagesPreview.innerHTML = '';
        if (imagesPreviewContainer) imagesPreviewContainer.style.display = 'none';
        const reachDiagramsPreview = document.getElementById('serviceReachDiagramsPreview');
        const reachDiagramsPreviewContainer = document.getElementById('serviceReachDiagramsPreviewContainer');
        if (reachDiagramsPreview) reachDiagramsPreview.innerHTML = '';
        if (reachDiagramsPreviewContainer) reachDiagramsPreviewContainer.style.display = 'none';
        const fileInputs = modal.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.value = '';
        });
        // Hide previews
        const previews = modal.querySelectorAll('[id$="PreviewContainer"]');
        previews.forEach(container => {
            container.style.display = 'none';
        });
    }
}

// Close modal on overlay click
const modal = document.getElementById('modal');
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            closeModal();
        }
    });
}

// Make functions globally accessible for HTML onchange handlers
window.handleImageUpload = handleImageUpload;
window.handleMultipleImagesUpload = handleMultipleImagesUpload;
window.handleMultipleReachDiagramsUpload = handleMultipleReachDiagramsUpload;
window.updateImagesFromTextarea = updateImagesFromTextarea;
window.updateReachDiagramsFromTextarea = updateReachDiagramsFromTextarea;
window.syncReachDiagramsTextarea = syncReachDiagramsTextarea;
window.renderReachDiagramsPreview = renderReachDiagramsPreview;
window.renderImagesPreview = renderImagesPreview;
window.attachImageRemoveHandlers = attachImageRemoveHandlers;
window.closeModal = closeModal;
window.showServiceModal = showServiceModal;
window.editService = editService;
window.deleteService = deleteService;
window.showReviewModal = showReviewModal;
window.editReview = editReview;
window.deleteReview = deleteReview;
window.updateRequestStatus = updateRequestStatus;
window.handleVideoUpload = handleVideoUpload;


