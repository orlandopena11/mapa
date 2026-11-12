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
 * Consulta la sesión actual en Supabase Auth, verifica su estado en usuario_autenticado
 * y carga los permisos desde obtener_permisos_usuario usando p_usuario_id.
 *
 * @param {Object} opciones - { exigirAccesoCrud: boolean, urlRedireccion: string }
 * @returns {Promise<Object>} Estado resuelto con usuarioActual y permisosActuales
 */
// [INICIO DE LLAVES]: Abre inicializarSesionCompartida
window.inicializarSesionCompartida = async function (opciones = {}) {
    const cliente = window.getSupabaseShared();
    if (!cliente) return window.APP_AUTH;

    try {
        // [INICIO DE LLAVES]: Espera la restauración real de sesión desde localStorage
        const user = await new Promise((resolve) => {
            cliente.auth.getSession().then(({ data }) => {
                if (data?.session?.user) {
                    resolve(data.session.user);
                } else {
                    const { data: listener } = cliente.auth.onAuthStateChange((_event, session) => {
                        listener?.subscription?.unsubscribe();
                        resolve(session?.user || null);
                    });
                    setTimeout(() => {
                        listener?.subscription?.unsubscribe();
                        resolve(null);
                    }, 1500);
                }
            });
        }); // [FIN DE LLAVES]: Cierra espera segura de sesión

        // [INICIO DE LLAVES]: Manejo cuando definitivamente no existe sesión activa
        if (!user) {
            window.APP_AUTH.usuarioActual = null;
            if (opciones.exigirAccesoCrud && opciones.urlRedireccion) {
                window.location.href = opciones.urlRedireccion;
            }
            return window.APP_AUTH;
        } // [FIN DE LLAVES]: Cierra validación sin sesión

        
        const correo = String(user.email || '').trim().toLowerCase();

        // [INICIO DE LLAVES]: Consulta directa a RPC SECURITY DEFINER (evita bloqueos RLS)
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
        } // [FIN DE LLAVES]: Cierra carga de permisos desde RPC

        // [INICIO DE LLAVES]: Guardián de seguridad para rutas protegidas (/admin/)
        if (opciones.exigirAccesoCrud) {
            const p = window.APP_AUTH.permisosActuales;
            const tieneAcceso = p.permiso_insertar || p.permiso_modificar || p.permiso_eliminar || p.permiso_aprobar;

            if (!tieneAcceso && opciones.urlRedireccion) {
                alert('Acceso restringido: Su cuenta no cuenta con permisos de mantenimiento.');
                window.location.href = opciones.urlRedireccion;
            }
        } // [FIN DE LLAVES]: Cierra guardián de seguridad

        
        return window.APP_AUTH;

    } catch (err) {
        console.error('[Shared Auth Error]:', err);
        return window.APP_AUTH;
    }
}; // [FIN DE LLAVES]: Cierra inicializarSesionCompartida


