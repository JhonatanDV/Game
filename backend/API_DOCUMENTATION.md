# API de Autenticación y Puntajes - Juego 3D

## Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/juego3d
JWT_SECRET=tu_clave_secreta_muy_segura
```

### 3. Iniciar el servidor
```bash
node app.js
```

---

## Endpoints de Autenticación

### Registrar Usuario
**POST** `/api/auth/register`

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "123456"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "_id": "123abc...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "highestScore": 0,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Iniciar Sesión
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "_id": "123abc...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "highestScore": 1500,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Obtener Perfil
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "123abc...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "highestScore": 1500,
    "scores": [
      {
        "score": 1500,
        "level": 3,
        "date": "2025-11-05T10:30:00.000Z"
      }
    ],
    "createdAt": "2025-11-01T08:00:00.000Z"
  }
}
```

---

### Verificar Token
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "123abc...",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "highestScore": 1500
  }
}
```

---

## Endpoints de Puntajes

### Guardar Puntaje
**POST** `/api/scores`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "score": 1500,
  "level": 3
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Puntaje guardado exitosamente",
  "data": {
    "score": 1500,
    "level": 3,
    "highestScore": 1500,
    "isNewRecord": true
  }
}
```

---

### Obtener Mis Puntajes
**GET** `/api/scores/my-scores`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "name": "Juan Pérez",
    "highestScore": 1500,
    "scores": [
      {
        "score": 1500,
        "level": 3,
        "date": "2025-11-05T10:30:00.000Z"
      },
      {
        "score": 1200,
        "level": 2,
        "date": "2025-11-04T15:20:00.000Z"
      }
    ],
    "totalGames": 2
  }
}
```

---

### Obtener Tabla de Clasificación
**GET** `/api/scores/leaderboard?limit=10`

**Headers:**
```
Authorization: Bearer <token>
```

**Query params:**
- `limit` (opcional): Número de usuarios a mostrar (por defecto: 10)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "name": "Juan Pérez",
      "highestScore": 2500,
      "userId": "123abc..."
    },
    {
      "rank": 2,
      "name": "María García",
      "highestScore": 2300,
      "userId": "456def..."
    }
  ]
}
```

---

### Obtener Estadísticas del Usuario
**GET** `/api/scores/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "name": "Juan Pérez",
    "stats": {
      "totalGames": 15,
      "highestScore": 2500,
      "lowestScore": 800,
      "averageScore": 1650,
      "totalScore": 24750
    },
    "recentScores": [
      {
        "score": 2500,
        "level": 5,
        "date": "2025-11-05T10:30:00.000Z"
      }
    ]
  }
}
```

---

## Códigos de Error Comunes

- **400 Bad Request**: Datos inválidos en la petición
- **401 Unauthorized**: Token inválido o no proporcionado
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

## Ejemplo de uso en JavaScript

```javascript
// Registrar usuario
const register = async (name, email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    // Guardar token en localStorage
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('userName', data.data.name);
  }
  return data;
};

// Iniciar sesión
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('userName', data.data.name);
  }
  return data;
};

// Guardar puntaje
const saveScore = async (score, level) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ score, level })
  });
  
  return await response.json();
};

// Obtener leaderboard
const getLeaderboard = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:3001/api/scores/leaderboard?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

---

## Notas Importantes

1. **El email puede ser ficticio** - No se requiere verificación de email
2. **El token expira en 30 días** - Después de ese tiempo, el usuario debe volver a iniciar sesión
3. **Los puntajes se guardan automáticamente** - El sistema actualiza el `highestScore` si el nuevo puntaje es mayor
4. **Todos los endpoints de puntajes requieren autenticación** - Debes enviar el token en el header `Authorization`
