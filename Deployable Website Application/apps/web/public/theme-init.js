(function () {
  try {
    var saved = localStorage.getItem('scamhisn-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
    var savedLang = localStorage.getItem('scamhisn-locale');
    if (savedLang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar-AE';
    }
  } catch (e) {}
})();
