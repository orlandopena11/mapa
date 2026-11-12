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

        // Consultar perfil maestro en usuario_autenticado
        const { data: perfilBd, error: errorPerfil } = await cliente
            .from('usuario_autenticado')
            .select('usuario_id, rol_id_fk, nombre, apellido, correo, estado_cuenta, verificado')
            .eq('correo', correo)
            .maybeSingle();

        if (errorPerfil) throw errorPerfil;

        // [INICIO DE LLAVES]: Procesa perfil hallado en base de datos
        if (perfilBd) {
            window.APP_AUTH.usuarioActual = {
                id: user.id,
                usuario_id_bd: perfilBd.usuario_id,
                correo: perfilBd.correo,
                nombre: perfilBd.nombre,
                apellido: perfilBd.apellido,
                rol_id_fk: Number(perfilBd.rol_id_fk),
                estado_cuenta: String(perfilBd.estado_cuenta || 'pendiente').toLowerCase().trim(),
                verificado: Boolean(perfilBd.verificado)
            };

            // Invocar RPC exacta con p_usuario_id tal como opera en tu app.js
            const { data: resPermisos, error: errorPerm } = await cliente.rpc('obtener_permisos_usuario', {
                p_usuario_id: user.id
            });

            // [INICIO DE LLAVES]: Mapea arreglo de permisos devuelto por PostgreSQL
            if (!errorPerm && Array.isArray(resPermisos) && resPermisos.length > 0) {
                const pRow = resPermisos[0];
                window.APP_AUTH.permisosActuales = {
                    rol_id: Number(pRow.rol_id || perfilBd.rol_id_fk),
                    nombres_rol: pRow.nombres_rol || 'usuario',
                    permiso_leer: Boolean(pRow.permiso_leer ?? true),
                    permiso_insertar: Boolean(pRow.permiso_insertar),
                    permiso_modificar: Boolean(pRow.permiso_modificar),
                    permiso_eliminar: Boolean(pRow.permiso_eliminar),
                    permiso_aprobar: Boolean(pRow.permiso_aprobar)
                };
            } // [FIN DE LLAVES]: Cierra mapeo de permisos
        } // [FIN DE LLAVES]: Cierra procesamiento de perfilBd

        // [INICIO DE LLAVES]: Guardián de seguridad para rutas protegidas (/admin/)
        if (opciones.exigirAccesoCrud) {
            const p = window.APP_AUTH.permisosActuales;
            const u = window.APP_AUTH.usuarioActual;
            const tieneAcceso = u && u.estado_cuenta === 'activo' && (p.permiso_insertar || p.permiso_modificar || p.permiso_eliminar || p.permiso_aprobar);

            if (!tieneAcceso && opciones.urlRedireccion) {
                alert('Acceso restringido: Su cuenta debe estar activa y contar con permisos de mantenimiento.');
                window.location.href = opciones.urlRedireccion;
            }
        } // [FIN DE LLAVES]: Cierra guardián de seguridad

        return window.APP_AUTH;

    } catch (err) {
        console.error('[Shared Auth Error]:', err);
        return window.APP_AUTH;
    }
}; // [FIN DE LLAVES]: Cierra inicializarSesionCompartida


