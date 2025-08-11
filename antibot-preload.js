// Preload script for anti-bot evasion
try {
  // 1. Basic webdriver property masking
  if (navigator.webdriver) {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  }

  // 2. Chrome runtime simulation
  window.chrome = { runtime: {} };

  // 3. Plugin spoofing
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
    ],
  });

  // 4. Language spoofing
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en'],
  });

  // 5. Permissions API spoofing for notifications
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications'
      ? Promise.resolve({ state: Notification.permission })
      : originalQuery(parameters)
  );

  // 6. WebGL Vendor and Renderer Spoofing
  try {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) return 'Google Inc. (Intel)';
      // UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) return 'ANGLE (Intel, Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)';
      return getParameter(parameter);
    };
  } catch (e) {
    console.error('WebGL spoofing failed:', e);
  }

  // 7. Remove "Headless" from user-agent
  const originalUserAgent = navigator.userAgent;
  Object.defineProperty(navigator, 'userAgent', {
    get: () => originalUserAgent.replace('HeadlessChrome/', 'Chrome/'),
  });

} catch (e) {
  console.error('Anti-bot evasion measures failed:', e);
}
