// Cookie consent banner (client-side only).
// Stores choice in localStorage so the banner is not shown again.
(function () {
  const STORAGE_KEY = 'cookie_consent_v1';

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }

    // Redundant persistence as a regular cookie (optional).
    try {
      document.cookie =
        'cookie_consent=' +
        encodeURIComponent(value) +
        '; max-age=' +
        60 * 60 * 24 * 365 +
        '; path=/; samesite=lax';
    } catch (e) {
      // Ignore cookie errors
    }

    const banner = document.getElementById('cookie-consent-banner');
    if (banner) banner.remove();
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.className = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-modal', 'false');

    banner.innerHTML = `
      <div class="cookie-consent-card">
        <div class="cookie-consent-row">
          <div class="cookie-consent-text">
            <strong>Cookies</strong>
            <span>Мы используем файлы cookie для работы сайта и улучшения сервиса. Вы можете принять все или выбрать необходимые.</span>
            <a class="cookie-consent-policy" href="#" data-cookie-policy aria-label="Политика cookies">Политика cookies</a>
            <div class="cookie-consent-policy-body" hidden>
              <p>
                Здесь должна быть ваша Политика cookies. Сейчас отображается краткое пояснение: сайт может использовать
                файлы cookie для функционирования, аналитики и персонализации в зависимости от вашего выбора.
              </p>
            </div>
          </div>
          <div class="cookie-consent-actions">
            <button type="button" class="cookie-consent-btn cookie-consent-btn-secondary" data-consent="necessary">
              Только необходимые
            </button>
            <button type="button" class="cookie-consent-btn cookie-consent-btn-primary" data-consent="all">
              Принять все
            </button>
          </div>
          <button type="button" class="cookie-consent-close" aria-label="Закрыть" data-consent="necessary">×</button>
        </div>
      </div>
    `;

    return banner;
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return;
    } catch (e) {
      // If storage is blocked - show the banner.
    }

    if (document.getElementById('cookie-consent-banner')) return;

    const banner = buildBanner();
    document.body.appendChild(banner);

    banner.addEventListener('click', (e) => {
      const policyLink = e.target && e.target.closest && e.target.closest('[data-cookie-policy]');
      if (policyLink) {
        e.preventDefault();
        const body = banner.querySelector('.cookie-consent-policy-body');
        if (body) body.hidden = !body.hidden;
        return;
      }

      const btn = e.target && e.target.closest && e.target.closest('[data-consent]');
      if (!btn) return;
      e.preventDefault();
      const value = btn.getAttribute('data-consent') || 'necessary';
      setConsent(value);
    });
  });
})();

