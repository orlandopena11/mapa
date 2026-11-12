/* jshint esversion: 11 */

// ==========================================================================
// NÚCLEO COMPARTIDO: GESTIÓN DE SESIÓN, ROLES Y PERMISOS DE USUARIO
// ==========================================================================

window.APP_AUTH = {
    usuarioActual: null,
    permisosActuales: {
        rol_id: 1,
        nombres_rol: 'visitante',
        permiso_leer: true,
        permiso_insertar: false,
        permiso_modificar: false,
        permiso_eliminar: false,
        permiso_aprobar: false
    }
};

/**
 * Espera a que el cliente de Supabase restaure la sesión desde localStorage
 * usando onAuthStateChange (evitando condiciones de carrera entre pestañas).
 */
// [INICIO DE LLAVES]: Abre obtenerUsuarioAutenticadoSeguro
function obtenerUsuarioAutenticadoSeguro(cliente) {
    return new Promise((resolve) => {
        let resuelto = false;
        const finalizar = (user) => {
            if (resuelto) return;
            resuelto = true;
            resolve(user || null);
        };

        // Escucha INITIAL_SESSION o SIGNED_IN apenas Supabase lee localStorage
        const { data: authListener } = cliente.auth.onAuthStateChange((evento, session) => {
            if (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN' || evento === 'TOKEN_REFRESHED') {
                setTimeout(() => authListener?.subscription?.unsubscribe(), 0);
                finalizar(session?.user || null);
            }
        });

        // Respaldo por si INITIAL_SESSION ya ocurrió antes de suscribirse
        cliente.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
                setTimeout(() => authListener?.subscription?.unsubscribe(), 0);
                finalizar(data.session.user);
            }
        }).catch(() => {});

        // Tiempo máximo de espera de seguridad (3.5 segundos)
        setTimeout(() => {
            authListener?.subscription?.unsubscribe();
            finalizar(null);
        }, 3500);
    });
} // [FIN DE LLAVES]: Cierra obtenerUsuarioAutenticadoSeguro

/**
 * Consulta la sesión actual, obtiene permisos desde la RPC SECURITY DEFINER
 * y protege el acceso a pantallas administrativas.
 */
// [INICIO DE LLAVES]: Abre inicializarSesionCompartida
window.inicializarSesionCompartida = async function (opciones = {}) {
    const cliente = window.getSupabaseShared();
    if (!cliente) return window.APP_AUTH;

    try {
        const user = await obtenerUsuarioAutenticadoSeguro(cliente);

        // [INICIO DE LLAVES]: Si definitivamente no hay usuario autenticado
        if (!user) {
            console.warn('[Shared Auth]: No se encontró sesión activa en este navegador.');
            window.APP_AUTH.usuarioActual = null;
            if (opciones.exigirAccesoCrud && opciones.urlRedireccion) {
                window.location.href = opciones.urlRedireccion;
            }
            return window.APP_AUTH;
        } // [FIN DE LLAVES]: Cierra validación sin usuario

        const correo = String(user.email || '').trim().toLowerCase();

        // [INICIO DE LLAVES]: Consulta directa a RPC SECURITY DEFINER
        const { data: resPermisos, error: errorPerm } = await cliente.rpc('obtener_permisos_usuario', {
            p_usuario_id: user.id
        });

        if (errorPerm) {
            console.error('[Shared Auth RPC Error]:', errorPerm);
        }

        const pRow = Array.isArray(resPermisos) ? resPermisos[0] : resPermisos;

        window.APP_AUTH.usuarioActual = {
            id: user.id,
            correo: correo,
            rol_id_fk: Number(pRow?.rol_id || 2),
            estado_cuenta: String(pRow?.estado_cuenta || 'activo').toLowerCase().trim()
        };

        if (pRow) {
            window.APP_AUTH.permisosActuales = {
                rol_id: Number(pRow.rol_id || 2),
                nombres_rol: pRow.nombres_rol || 'usuario',
                permiso_leer: Boolean(pRow.permiso_leer ?? true),
                permiso_insertar: Boolean(pRow.permiso_insertar),
                permiso_modificar: Boolean(pRow.permiso_modificar),
                permiso_eliminar: Boolean(pRow.permiso_eliminar),
                permiso_aprobar: Boolean(pRow.permiso_aprobar)
            };
        } // [FIN DE LLAVES]: Cierra mapeo de permisos

        // [INICIO DE LLAVES]: Guardián de seguridad para rutas protegidas (/admin/)
        if (opciones.exigirAccesoCrud) {
            const p = window.APP_AUTH.permisosActuales;
            const tieneAcceso = p.permiso_insertar || p.permiso_modificar || p.permiso_eliminar || p.permiso_aprobar;

            if (!tieneAcceso && opciones.urlRedireccion) {
                alert('Acceso restringido: Su cuenta (' + correo + ') tiene rol "' + p.nombres_rol + '" sin permisos de escritura.');
                window.location.href = opciones.urlRedireccion;
            }
        } // [FIN DE LLAVES]: Cierra guardián de seguridad

        return window.APP_AUTH;

    } catch (err) {
        console.error('[Shared Auth Error]:', err);
        return window.APP_AUTH;
    }
}; // [FIN DE LLAVES]: Cierra inicializarSesionCompartida

