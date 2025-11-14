# Guía de Despliegue en VPS

## Prerrequisitos

- VPS con Ubuntu/Debian (o similar)
- Node.js 18+ instalado
- nginx instalado
- Dominio apuntando a la IP del VPS

## Pasos de Despliegue

### 1. Construir la Aplicación (local)

```bash
npm run build
```

Esto genera el directorio `.output/` con:

- `.output/public/` - Archivos estáticos frontend
- `.output/server/` - Servidor Nitro (backend)

### 2. Subir al VPS

```bash
# Crear directorio en el VPS
ssh user@tu-vps "mkdir -p /var/www/tu-app"

# Subir archivos construidos
scp -r .output user@tu-vps:/var/www/tu-app/
```

### 3. Instalar nginx (en el VPS)

```bash
sudo apt update
sudo apt install nginx
```

### 4. Configurar nginx

```bash
# Copiar configuración
sudo cp nginx.conf /etc/nginx/sites-available/tu-app

# Editar dominio y rutas
sudo nano /etc/nginx/sites-available/tu-app

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/tu-app /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

### 5. Ejecutar el Servidor Nitro

Elige un método:

#### Opción A: PM2 (Recomendado)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Copiar config PM2 al VPS
scp ecosystem.config.js user@tu-vps:/var/www/tu-app/

# Iniciar servidor en el VPS
cd /var/www/tu-app
pm2 start ecosystem.config.js

# Guardar procesos
pm2 save

# Arranque automático
pm2 startup
```

#### Opción B: systemd

```bash
# Copiar archivo de servicio
sudo cp nitro.service /etc/systemd/system/

# Editar rutas y usuario
sudo nano /etc/systemd/system/nitro.service

# Habilitar e iniciar
sudo systemctl enable nitro
sudo systemctl start nitro

# Ver estado
sudo systemctl status nitro
```

### 6. Configurar SSL (Opcional pero recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificados SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## Notas de Configuración nginx

La `nginx.conf` incluida provee:

- Servido de archivos estáticos desde `.output/public/`
- Proxy de API al servidor Nitro en puerto 3000
- Soporte de rutas cliente (SPA fallback a `index.html`)
- Compresión gzip
- Encabezados de seguridad
- Caché para assets

## Variables de Entorno

Crea un archivo `.env` en el VPS si lo necesitas:

```bash
# /var/www/tu-app/.env
NODE_ENV=production
NITRO_PORT=3000
NITRO_HOST=127.0.0.1
```

## Monitorización

### Comandos PM2

```bash
pm2 status               # Ver estado
pm2 logs nitro-server    # Logs
pm2 restart nitro-server # Reiniciar
pm2 stop nitro-server    # Detener
```

### Comandos systemd

```bash
sudo systemctl status nitro   # Estado
sudo journalctl -u nitro -f   # Logs en tiempo real
sudo systemctl restart nitro  # Reiniciar
```

## Actualizar la Aplicación

```bash
# 1. Construir local
npm run build

# 2. Subir al VPS
scp -r .output user@tu-vps:/var/www/tu-app/

# 3. Reiniciar servidor
# Con PM2:
pm2 restart nitro-server

# Con systemd:
sudo systemctl restart nitro
```

## Resolución de Problemas

### Revisar logs nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Revisar servidor Nitro

```bash
# PM2
pm2 logs nitro-server

# systemd
sudo journalctl -u nitro -n 50
```

### Probar Nitro directamente

```bash
curl http://localhost:3000/api/hello
```

### Verificar configuración nginx

```bash
sudo nginx -t
```

## Lista de Seguridad

- [ ] Configurar firewall (ufw/iptables)
- [ ] Activar SSL
- [ ] Usar usuario no root
- [ ] Mantener Node.js y nginx actualizados
- [ ] Limitar peticiones (rate limiting) si es necesario
- [ ] Añadir monitorización y alertas
