// Experience/Utils/Physics.js  (solo reemplaza/ajusta)
import * as CANNON from 'cannon-es'

export default class Physics {
    constructor() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, -9.82, 0)
        this.world.broadphase = new CANNON.SAPBroadphase(this.world)
        this.world.allowSleep = true

        // MÁS ITERACIONES y tolerancia menor
        this.world.solver.iterations = 40   // SUBE esto si aún ves picos (costo CPU)
        this.world.solver.tolerance = 1e-5

        this.defaultMaterial = new CANNON.Material('default')
        const defaultContact = new CANNON.ContactMaterial(this.defaultMaterial, this.defaultMaterial, {
            friction: 0.6,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 3
        })
        this.world.defaultContactMaterial = defaultContact
        this.world.addContactMaterial(defaultContact)

        this.robotMaterial = new CANNON.Material('robot')
        this.obstacleMaterial = new CANNON.Material('obstacle')
        this.wallMaterial = new CANNON.Material('wall')

        const robotObstacleContact = new CANNON.ContactMaterial(this.robotMaterial, this.obstacleMaterial, {
            friction: 0.6,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 3
        })
        this.world.addContactMaterial(robotObstacleContact)

        const robotWallContact = new CANNON.ContactMaterial(this.robotMaterial, this.wallMaterial, {
            friction: 0.6,
            restitution: 0.0,
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 2,
            frictionEquationStiffness: 1e7,
            frictionEquationRelaxation: 2
        })
        this.world.addContactMaterial(robotWallContact)

        // Seguridad: más estricta para clamping de picos
        this._safety = {
            enabled: true,
            speedClampThreshold: 18,   // ahora más bajo (antes 30)
            clampToSpeed: 5,           // reducimos la velocidad objetivo (antes 8)
            maxVerticalSpeed: 6,       // menos subida vertical (antes 12)
            clampAngularVelocity: 6
        }
    }

    update(delta) {
        const fixedTimeStep = 1 / 60
        const maxSubSteps = 8  // aumentar substeps para evitar tunneling

        const dt = typeof delta === 'number' && delta > 0 ? delta : fixedTimeStep
        try {
            this.world.step(fixedTimeStep, dt, maxSubSteps)
        } catch (err) {
            // Suprimir warnings de Cannon (errores conocidos que no afectan el juego)
            if (err?.message?.includes('wakeUpAfterNarrowphase')) {
                // Silencioso: este error es común y no afecta el gameplay
                return
            } else {
                console.error('🚫 Cannon step error:', err)
            }
        }

        // POST-STEP: clamp más agresivo
        if (this._safety && this._safety.enabled) {
            const thr = this._safety.speedClampThreshold
            const clampTo = this._safety.clampToSpeed
            const maxY = this._safety.maxVerticalSpeed
            const maxAng = this._safety.clampAngularVelocity

            for (const body of this.world.bodies) {
                if (!body || !body.velocity) continue

                const vx = body.velocity.x || 0
                const vy = body.velocity.y || 0
                const vz = body.velocity.z || 0
                const speed = Math.sqrt(vx*vx + vy*vy + vz*vz)

                if (speed > thr) {
                    const scale = clampTo / Math.max(speed, 1e-6)
                    body.velocity.x = vx * scale
                    body.velocity.y = vy * scale
                    body.velocity.z = vz * scale

                    if (Math.abs(body.velocity.y) > maxY) {
                        body.velocity.y = Math.sign(body.velocity.y) * maxY
                    }

                    if (body.angularVelocity) {
                        const av = body.angularVelocity
                        const angSpeed = Math.sqrt(av.x*av.x + av.y*av.y + av.z*av.z)
                        if (angSpeed > maxAng) {
                            const s = maxAng / angSpeed
                            body.angularVelocity.x *= s
                            body.angularVelocity.y *= s
                            body.angularVelocity.z *= s
                        }
                    }

                    if (body.position && body.position.y < 0.06) {
                        body.position.y = 0.06
                    }
                } else {
                    if (Math.abs(vy) > maxY) {
                        body.velocity.y = Math.sign(vy) * maxY
                    }
                }
            }
        }
    }
}
