# 🚀 Inicio Rápido - Juego 3D

## ✅ Estado Actual del Sistema

### Base de Datos MongoDB
- **Base de datos:** `threejs_blocks`
- **Estado:** ✅ Inicializada y corriendo
- **Bloques cargados:** 1102 bloques en 3 niveles
  - Nivel 1: 196 bloques
  - Nivel 2: 373 bloques
  - Nivel 3: 533 bloques

### Servidores en Ejecución
- **Backend API:** http://localhost:3001 ✅
- **Frontend (Vite):** http://localhost:5173 ✅
- **Red local:** http://192.168.0.12:5173

---

## 🔑 Configuración del Archivo .env

### Backend (backend/.env)
```bash
# Puerto del servidor
PORT=3001

# MongoDB URI
MONGO_URI=mongodb://127.0.0.1:27017/threejs_blocks

# JWT Secret
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_cambiala
```

### Frontend (game-project/.env)
```bash
VITE_API_URL=http://localhost:3001
```

---

## 🎮 Cómo Iniciar el Juego

### 1. Iniciar MongoDB (ya está corriendo)
MongoDB está corriendo como servicio de Windows.

Para verificar:
```powershell
Get-Service -Name MongoDB
```

### 2. Iniciar Backend
```powershell
cd backend
node app.js
```

### 3. Iniciar Frontend
```powershell
cd game-project
npm run dev
```

### 4. Abrir el Juego
Navega a: http://localhost:5173

---

## 🔧 Comandos Útiles

### Reiniciar Base de Datos
```powershell
node backend/scripts/init_database.js
```

### Verificar Datos
```powershell
node backend/scripts/verify_database.js
```

### Ver Logs del Backend
El backend muestra los logs en la consola donde se ejecutó `node app.js`

---

## 🌐 Endpoints API Disponibles

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Bloques
- `GET /api/blocks` - Obtener todos los bloques
- `GET /api/blocks?level=1` - Obtener bloques del nivel 1
- `POST /api/blocks` - Crear un nuevo bloque
- `POST /api/blocks/batch` - Crear múltiples bloques

### Puntajes
- `GET /api/scores` - Obtener todos los puntajes
- `GET /api/scores/user/:userId` - Obtener puntajes de un usuario
- `POST /api/scores` - Guardar un nuevo puntaje

---

## 🎯 Características Implementadas

- ✅ Sistema de autenticación (JWT)
- ✅ Gestión de bloques por niveles
- ✅ Sistema de puntajes
- ✅ Modo multijugador con Socket.IO
- ✅ Integración con MongoDB
- ✅ API REST completa
- ✅ Frontend con React + Three.js
- ✅ Física con Cannon.js

---

## 📞 Soporte

Si necesitas reiniciar todo desde cero:

1. Detener los servidores (Ctrl+C en ambas terminales)
2. Ejecutar: `node backend/scripts/init_database.js`
3. Reiniciar backend y frontend

---

**¡Disfruta del juego!** 🎮
