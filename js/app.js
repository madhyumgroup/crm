'use strict';
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
window.navigate=navigate;window.closeModal=closeModal;window.logout=logout;
if(restoreSession())startApp().catch(()=>logout(true));
