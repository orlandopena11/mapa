/* jshint esversion: 11 */

// ==========================================================================
// NÚCLEO COMPARTIDO: CONFIGURACIÓN GLOBAL DE SUPABASE Y CLOUDINARY
// ==========================================================================

// [INICIO DE LLAVES]: Objeto global de configuración compartido por toda la aplicación
window.APP_CONFIG = {
    SUPABASE_URL: 'https://aohizylvnnrjhgplsods.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_uNtOayIxxDaxozSL4uA7Qw_j8adfYS1',
    CLOUDINARY_BASE_URL: 'https://res.cloudinary.com/obw6ciov/image/upload/f_auto,q_auto/',

    ROL_ID_ADMIN: 8
}; // [FIN DE LLAVES]: Cierra objeto global APP_CONFIG

let _instanciaSupabaseGlobal = null;

/**
 * Inicializa o devuelve una única instancia compartida del cliente de Supabase.
 * Evita crear múltiples conexiones duplicadas en la misma página.
 */
// [INICIO DE LLAVES]: Abre getSupabaseShared
window.getSupabaseShared = function () {
    if (_instanciaSupabaseGlobal) return _instanciaSupabaseGlobal;

    // [INICIO DE LLAVES]: Verifica que el SDK de Supabase esté cargado en window
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        _instanciaSupabaseGlobal = window.supabase.createClient(
            window.APP_CONFIG.SUPABASE_URL,
            window.APP_CONFIG.SUPABASE_ANON_KEY
        );
    } // [FIN DE LLAVES]: Cierra verificación SDK

    return _instanciaSupabaseGlobal;
}; // [FIN DE LLAVES]: Cierra getSupabaseShared

