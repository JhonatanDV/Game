# 🎮 Sistema de CoinGoal Dinámico

## 📋 Resumen
El sistema ahora carga el número de monedas por nivel (`coinGoal`) desde MongoDB en lugar de estar hardcodeado.

## 🗄️ Estructura de Base de Datos

### Modelo: LevelConfig
```javascript
{
  level: Number,        // Número del nivel (1, 2, 3)
  coinGoal: Number,     // Meta de monedas a recolectar
  enemyCount: Number,   // Cantidad de enemigos
  description: String   // Descripción del nivel
}
```

## 🚀 Instrucciones de Configuración

### 1. Inicializar configuraciones por defecto

En el terminal del backend, ejecuta:

```bash
cd backend
node scripts/init_level_configs.js
```

Este script creará las siguientes configuraciones:
- **Nivel 1**: 10 monedas, 1 enemigo
- **Nivel 2**: 15 monedas, 3 enemigos
- **Nivel 3**: 20 monedas, 3 enemigos

### 2. Reiniciar el servidor backend

```bash
cd backend
node app.js
```

### 3. Verificar la API

Puedes verificar que funciona visitando:
- http://localhost:3001/api/levels/config?level=1
- http://localhost:3001/api/levels/config?level=2
- http://localhost:3001/api/levels/config?level=3

## 🔧 Endpoints de la API

### GET `/api/levels/config?level={nivel}`
Obtiene la configuración de un nivel específico.

**Respuesta:**
```json
{
  "level": 1,
  "coinGoal": 10,
  "enemyCount": 1,
  "description": "Nivel 1 - Tutorial",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET `/api/levels/configs`
Obtiene todas las configuraciones de niveles.

### POST `/api/levels/config`
Actualiza o crea una configuración de nivel.

**Body:**
```json
{
  "level": 1,
  "coinGoal": 15,
  "enemyCount": 2,
  "description": "Nivel modificado"
}
```

### POST `/api/levels/init`
Inicializa todas las configuraciones por defecto (alternativa al script).

## 📊 Cómo Funciona

1. **Frontend (World.js)**:
   - Al cargar un nivel, hace `fetch` a `/api/levels/config?level={nivel}`
   - Si obtiene datos, usa `levelConfig.coinGoal`
   - Si falla, usa valores hardcodeados como fallback (10, 15, 20)

2. **Backend**:
   - Si el nivel no existe en BD, crea uno automáticamente
   - Permite actualizar dinámicamente sin reiniciar

3. **Consola del Juego**:
   - Muestra si cargó desde API o usó fallback:
     ```
     📊 Meta de monedas desde API para Nivel 1: 10
     ```

## ✅ Ventajas

- ✨ **Dinámico**: Cambios sin modificar código
- 🔄 **Flexible**: Actualiza metas en tiempo real
- 🛡️ **Robusto**: Fallback si falla la conexión
- 📈 **Escalable**: Fácil agregar más niveles

## 🧪 Probar Cambios

Para probar que funciona dinámicamente:

1. Inicializa las configuraciones
2. Inicia el juego y verifica la meta de monedas
3. Cambia el valor con Postman o curl:
   ```bash
   curl -X POST http://localhost:3001/api/levels/config \
     -H "Content-Type: application/json" \
     -d '{"level": 1, "coinGoal": 25, "enemyCount": 1}'
   ```
4. Reinicia el nivel y verás la nueva meta

## 📝 Notas

- Los valores hardcodeados siguen existiendo como fallback
- El sistema funciona offline con los valores por defecto
- Puedes agregar más propiedades al modelo (tiempo límite, power-ups, etc.)
