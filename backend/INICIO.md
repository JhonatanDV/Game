# 🎮 Guía de Inicio - Sistema de Autenticación

## ✅ Requisitos Previos

1. **Node.js** instalado (versión 14 o superior)
2. **MongoDB** instalado y corriendo
   - Descarga: https://www.mongodb.com/try/download/community
   - O usa MongoDB Atlas (nube): https://www.mongodb.com/cloud/atlas

---

## 🚀 Pasos para Iniciar

### 1️⃣ Instalar Dependencias

Abre PowerShell en la carpeta `backend` y ejecuta:

```powershell
npm install
```

### 2️⃣ Configurar MongoDB

**Opción A: MongoDB Local**
- Asegúrate de que MongoDB esté corriendo en tu computadora
- Por defecto se conecta a: `mongodb://localhost:27017/juego3d`

**Opción B: MongoDB Atlas (Recomendado)**
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratis
3. Crea un cluster
4. Obtén tu URI de conexión
5. Actualiza el archivo `.env` con tu URI:
   ```
   MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/juego3d
   ```

### 3️⃣ Verificar el archivo .env

Abre el archivo `.env` y asegúrate de que tenga:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/juego3d
JWT_SECRET=juego3d_secret_key_2025_cambiar_en_produccion
```

> ⚠️ **IMPORTANTE**: Cambia `JWT_SECRET` por una clave única y segura

### 4️⃣ Iniciar el Servidor

```powershell
npm start
```

Deberías ver:
```
✅ Conectado a MongoDB
✅ Servidor corriendo en puerto 3001
```

---

## 🧪 Probar la API

### Método 1: Navegador (Más Fácil)

1. Abre el archivo `test-api.html` en tu navegador
2. Usa la interfaz para registrarte, iniciar sesión y guardar puntajes

### Método 2: PowerShell

```powershell
# Ejecutar el script de pruebas
.\test-api.ps1
```

### Método 3: Postman o Insomnia

Importa estos endpoints:

- **POST** `http://localhost:3001/api/auth/register`
- **POST** `http://localhost:3001/api/auth/login`
- **GET** `http://localhost:3001/api/auth/profile`
- **POST** `http://localhost:3001/api/scores`
- **GET** `http://localhost:3001/api/scores/leaderboard`

Ver `API_DOCUMENTATION.md` para más detalles.

---

## 🎯 Flujo Básico de Uso

### 1. Registrar un Usuario

```javascript
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com"
  }
}
```

### 2. Guardar el Token

Guarda el token que recibes para usarlo en las siguientes peticiones:

```javascript
localStorage.setItem('token', data.data.token);
```

### 3. Guardar Puntaje

```javascript
POST http://localhost:3001/api/scores
Authorization: Bearer <tu_token_aqui>
Content-Type: application/json

{
  "score": 1500,
  "level": 3
}
```

### 4. Ver Tabla de Clasificación

```javascript
GET http://localhost:3001/api/scores/leaderboard?limit=10
Authorization: Bearer <tu_token_aqui>
```

---

## 🔧 Integración con el Juego

### Paso 1: Copiar la Clase GameAuthManager

Copia la clase `GameAuthManager` del archivo `ejemplos-uso-api.js` a tu proyecto del juego.

### Paso 2: Inicializar en tu Juego

```javascript
// En tu archivo principal del juego
import { GameAuthManager } from './GameAuthManager.js';

// Crear instancia
const authManager = new GameAuthManager('http://localhost:3001/api');

// Verificar si el usuario ya inició sesión
if (authManager.isAuthenticated()) {
    console.log('Usuario:', authManager.getUserName());
    // Iniciar juego
    startGame();
} else {
    // Mostrar pantalla de login
    showLoginScreen();
}
```

### Paso 3: Guardar Puntajes al Terminar el Juego

```javascript
// Cuando el jugador termina el juego
async function onGameOver(finalScore, level) {
    if (authManager.isAuthenticated()) {
        const result = await authManager.saveScore(finalScore, level);
        
        if (result.data.isNewRecord) {
            showNotification('🎉 ¡Nuevo récord personal!');
        }
    }
}
```

---

## 📁 Estructura de Archivos Creados

```
backend/
├── models/
│   ├── Block.js              # Modelo existente
│   └── User.js               # ✨ NUEVO: Modelo de usuario
├── controllers/
│   ├── blockController.js    # Controlador existente
│   ├── authController.js     # ✨ NUEVO: Autenticación
│   └── scoreController.js    # ✨ NUEVO: Puntajes
├── middleware/
│   └── auth.js               # ✨ NUEVO: Verificación JWT
├── routes/
│   ├── blockRoutes.js        # Rutas existentes
│   ├── authRoutes.js         # ✨ NUEVO: Rutas auth
│   └── scoreRoutes.js        # ✨ NUEVO: Rutas puntajes
├── app.js                    # ✨ ACTUALIZADO
├── package.json              # ✨ ACTUALIZADO
├── .env                      # ✨ NUEVO: Variables de entorno
├── .env.example              # ✨ NUEVO: Ejemplo de .env
├── API_DOCUMENTATION.md      # ✨ NUEVO: Documentación completa
├── ejemplos-uso-api.js       # ✨ NUEVO: Ejemplos de código
├── test-api.html             # ✨ NUEVO: Interfaz de prueba
├── test-api.ps1              # ✨ NUEVO: Script de pruebas
└── INICIO.md                 # Este archivo
```

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Verifica que MongoDB esté corriendo:
   ```powershell
   # Iniciar MongoDB (si está instalado localmente)
   mongod
   ```
2. O usa MongoDB Atlas y actualiza `MONGO_URI` en `.env`

### Error: "Port 3001 is already in use"

**Solución:**
1. Cambia el puerto en `.env`:
   ```
   PORT=3002
   ```
2. O cierra el proceso que está usando el puerto 3001

### Error: "Token inválido o expirado"

**Solución:**
1. Inicia sesión nuevamente para obtener un nuevo token
2. Los tokens expiran después de 30 días

### No puedo ver los puntajes

**Solución:**
1. Asegúrate de estar enviando el token en el header:
   ```javascript
   Authorization: Bearer <tu_token>
   ```
2. Verifica que el token sea válido en `/api/auth/verify`

---

## 📚 Recursos Adicionales

- **API Completa**: Ver `API_DOCUMENTATION.md`
- **Ejemplos de Código**: Ver `ejemplos-uso-api.js`
- **Interfaz de Prueba**: Abrir `test-api.html` en el navegador

---

## 🎉 ¡Listo!

Ahora tienes un sistema completo de:
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Autenticación con JWT
- ✅ Guardado de puntajes
- ✅ Tabla de clasificación
- ✅ Estadísticas de jugadores

¡Disfruta desarrollando tu juego! 🚀
