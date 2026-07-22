// Servidor de Inyección Directa para Supabase Client Auth
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.supabase = {}));
})(this, (function (exports) { 'use strict';
    var _supabaseJs = require('@supabase/supabase-js');
    exports.createClient = _supabaseJs.createClient;
    Object.defineProperty(exports, '__esModule', { value: true });
}));
