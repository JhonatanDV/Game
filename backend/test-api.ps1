# TEST DE LA API - Juego 3D
# Usa estos comandos en PowerShell o en un archivo .http en VS Code

# ==========================
# 1. REGISTRAR USUARIO
# ==========================

# PowerShell:
$body = @{
    name = "Juan Pérez"
    email = "juan@ejemplo.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $body -ContentType "application/json"

# ==========================
# 2. INICIAR SESIÓN
# ==========================

$body = @{
    email = "juan@ejemplo.com"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Token guardado: $token"

# ==========================
# 3. VERIFICAR TOKEN
# ==========================

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/verify" -Method GET -Headers $headers

# ==========================
# 4. OBTENER PERFIL
# ==========================

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/profile" -Method GET -Headers $headers

# ==========================
# 5. GUARDAR PUNTAJE
# ==========================

$body = @{
    score = 1500
    level = 3
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/scores" -Method POST -Body $body -ContentType "application/json" -Headers $headers

# ==========================
# 6. GUARDAR MÁS PUNTAJES
# ==========================

# Puntaje 1
$body = @{
    score = 1800
    level = 4
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/scores" -Method POST -Body $body -ContentType "application/json" -Headers $headers

# Puntaje 2
$body = @{
    score = 2100
    level = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/scores" -Method POST -Body $body -ContentType "application/json" -Headers $headers

# ==========================
# 7. OBTENER MIS PUNTAJES
# ==========================

Invoke-RestMethod -Uri "http://localhost:3001/api/scores/my-scores" -Method GET -Headers $headers

# ==========================
# 8. OBTENER LEADERBOARD
# ==========================

Invoke-RestMethod -Uri "http://localhost:3001/api/scores/leaderboard?limit=10" -Method GET -Headers $headers

# ==========================
# 9. OBTENER ESTADÍSTICAS
# ==========================

Invoke-RestMethod -Uri "http://localhost:3001/api/scores/stats" -Method GET -Headers $headers

# ==========================
# SCRIPT COMPLETO DE PRUEBA
# ==========================

Write-Host "`n=== PRUEBA COMPLETA DE LA API ===" -ForegroundColor Cyan

# 1. Registrar usuario
Write-Host "`n1. Registrando usuario..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User $(Get-Random)"
    email = "test$(Get-Random)@ejemplo.com"
    password = "123456"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $token = $registerResponse.data.token
    Write-Host "✅ Usuario registrado: $($registerResponse.data.name)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en registro" -ForegroundColor Red
    exit
}

# 2. Crear headers con token
$headers = @{
    "Authorization" = "Bearer $token"
}

# 3. Guardar varios puntajes
Write-Host "`n2. Guardando puntajes..." -ForegroundColor Yellow
$scores = @(1000, 1500, 1200, 1800, 2100)
foreach ($score in $scores) {
    $scoreBody = @{
        score = $score
        level = [math]::Floor($score / 500)
    } | ConvertTo-Json
    
    $scoreResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/scores" -Method POST -Body $scoreBody -ContentType "application/json" -Headers $headers
    
    if ($scoreResponse.data.isNewRecord) {
        Write-Host "✅ Nuevo récord: $score puntos" -ForegroundColor Green
    } else {
        Write-Host "   Puntaje guardado: $score puntos" -ForegroundColor Gray
    }
}

# 4. Obtener estadísticas
Write-Host "`n3. Obteniendo estadísticas..." -ForegroundColor Yellow
$stats = Invoke-RestMethod -Uri "http://localhost:3001/api/scores/stats" -Method GET -Headers $headers
Write-Host "📊 Estadísticas:" -ForegroundColor Cyan
Write-Host "   Juegos totales: $($stats.data.stats.totalGames)"
Write-Host "   Puntaje más alto: $($stats.data.stats.highestScore)"
Write-Host "   Puntaje promedio: $($stats.data.stats.averageScore)"

# 5. Ver leaderboard
Write-Host "`n4. Obteniendo leaderboard..." -ForegroundColor Yellow
$leaderboard = Invoke-RestMethod -Uri "http://localhost:3001/api/scores/leaderboard?limit=5" -Method GET -Headers $headers
Write-Host "🏆 Top 5 Jugadores:" -ForegroundColor Cyan
foreach ($player in $leaderboard.data) {
    Write-Host "   #$($player.rank) - $($player.name): $($player.highestScore) puntos"
}

Write-Host "`n✅ ¡Prueba completada exitosamente!" -ForegroundColor Green
