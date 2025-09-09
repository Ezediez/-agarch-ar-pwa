// Desregistrar Service Workers viejos para evitar cache de Supabase
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => r.unregister());
  }).catch(()=>{});
}
