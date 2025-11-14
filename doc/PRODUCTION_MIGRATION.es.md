# Guía de Migración a Producción: IDs Enteros a UUIDs

## ⚠️ Impacto Crítico en Producción

### 1. Todos los usuarios serán cerrados de sesión

- Las sesiones existentes quedan inválidas
- Los IDs de usuario cambian de enteros a UUIDs
- Las sesiones guardan los IDs antiguos, que ya no existirán
- Acción: Usuarios deben iniciar sesión nuevamente tras la migración

### 2. Integridad de Datos

- ✅ Datos existentes preservados
- ✅ Relaciones (FK) mantenidas
- ⚠️ Todos los IDs cambian (usuarios, proyectos, tareas, archivos, clientes)
- ⚠️ Sistemas externos que usen IDs antiguos fallarán

### 3. Características de la Migración

- Migración de un solo sentido (rollback complejo)
- Pequeña ventana de inactividad (1–5 minutos típico)
- Corre en transacción (rollback automático ante error)

## 🚀 Pasos de Despliegue en Railway

### Opción 1: Usar Migraciones (Recomendado)

```bash
# 1. Desplegar código primero (nuevo esquema UUID)
railway up

# 2. Ejecutar migración
railway run npm run db:migrate
```

Razón para usar `db:migrate` y no `db:push`:

- `db:migrate` ejecuta el archivo de migración diseñado para convertir datos con seguridad
- `db:push` intentará generar cambios y fallará con el mismo error visto previamente

### Opción 2: Migración Manual

```bash
# Conectar a la base de datos
railway connect postgres

# Ejecutar archivo SQL
\i drizzle/0001_convert_ids_to_uuid.sql
```

## 📋 Checklist Pre-Migración

- [ ] Respaldar la base de datos (verificar backups Railway)
- [ ] Notificar mantenimiento a usuarios
- [ ] Definir ventana de mantenimiento (bajo tráfico)
- [ ] Probar migración en staging (si existe)
- [ ] Verificar variables de entorno
- [ ] Confirmar conexión a BD en Railway

## 🔄 Pasos Post-Migración

1. Verificar éxito:
   ```bash
   railway run npm run db:push
   # Debe mostrar "No changes detected"
   ```
2. Probar aplicación (login, crear proyecto/tarea, acceso a datos previos)
3. Monitorizar logs y errores

## 🛡️ Plan de Rollback (Si fuera necesario)

Rollback es difícil porque:

- Todos los IDs cambiaron
- Claves foráneas actualizadas
- Sesiones invalidadas

Si se requiere rollback:

1. Restaurar backup previo
2. Revertir despliegue de código
3. Se pierde cualquier dato nuevo post-migración

## 📊 Rendimiento de la Migración

- BD pequeña (< 1,000 registros): ~10–30 s
- BD media (1,000–10,000): ~1–3 min
- BD grande (10,000+): ~5–15 min

Usa columnas temporales y actualizaciones seguras; en grandes volúmenes puede tardar más.

## 🔍 Qué se Migra

- ✅ `users.id` entero → UUID
- ✅ `projects.id` entero → UUID
- ✅ `projects.user_id` entero → UUID
- ✅ `tasks.id` entero → UUID
- ✅ `tasks.user_id` entero → UUID
- ✅ `tasks.project_id` entero → UUID
- ✅ `files.id` entero → UUID
- ✅ `files.user_id` entero → UUID
- ✅ `files.project_id` entero → UUID
- ✅ `clients.id` entero → UUID
- ✅ `clients.user_id` entero → UUID

## ⚡ Referencia Rápida

```bash
# Desplegar código
railway up

# Ejecutar migración
railway run npm run db:migrate

# Verificar esquema
railway run npm run db:push
```

## 🆘 Troubleshooting

### Error: "column cannot be cast"

- Causa: Archivo de migración ausente o incorrecto
- Solución: Confirmar que `drizzle/0001_convert_ids_to_uuid.sql` existe y está committeado

### Usuarios no pueden iniciar sesión

- Causa: Sesiones invalidadas (esperado)
- Solución: Solicitar nuevo login

### Errores de claves foráneas

- Causa: Migración incompleta
- Solución: Revisar logs; posible restaurar backup

### "No changes detected" tras migrar

- Causa: Migración exitosa
- Solución: Estado correcto

## ✅ Validación Posterior

Revisar:

- Login funcional
- Relaciones correctas
- Creación de nuevos registros con UUID
- Sin referencias rotas en logs
