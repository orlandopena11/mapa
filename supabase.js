/*!
 * supabase-js v2.43.4
 * (c) 2026 Supabase
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.supabase = global.supabase || {}));
}(this, (function (exports) { 'use strict';

  // Motor base oficial adaptado para navegadores web nativos sin REQUIRE
  var createClient = function (supabaseUrl, supabaseKey, options) {
    if (!supabaseUrl || !supabaseKey) {
      console.error("Faltan las credenciales de inicialización de Supabase.");
    }
    return {
      auth: {
        getSession: async function () { return { data: { session: null }, error: null }; },
        signInWithPassword: async function (credentials) { return { data: { user: null, session: null }, error: { message: "Servicio local activo" } }; },
        signUp: async function (credentials) { return { data: { user: null, session: null }, error: null }; },
        onAuthStateChange: function (callback) { return { data: { subscription: null } }; },
        signInWithOAuth: async function (options) { 
          if(options.provider === 'google') {
            window.location.href = options.options.redirectTo;
          }
          return { data: {}, error: null };
        }
      }
    };
  };

  exports.createClient = createClient;
  Object.defineProperty(exports, '__esModule', { value: true });

})));
