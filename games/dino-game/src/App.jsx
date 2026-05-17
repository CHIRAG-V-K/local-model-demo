import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

function DinoGame() {
  const [gameState, setGameState] = useState('menu') // menu, playing, gameover
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [screenShake, setScreenShake] = useState(0)

  // Game constants
  const GAME_WIDTH = 800
  const GAME_HEIGHT = 450
  const GROUND_Y = 380
  const DINO_X = 50
  const GRAVITY = 1.2
  const JUMP_STRENGTH = -22
  const GAME_SPEED_START = 6
  const SPAWN_RATE_MIN = 90
  const SPAWN_RATE_MAX = 180

  // Game state refs for animation loop
  const gameLoopRef = useRef(null)
  const scoreRef = useRef(0)
  const gameSpeedRef = useRef(GAME_SPEED_START)
  const dinoRef = useRef({ y: GROUND_Y, vy: 0, width: 46, height: 47, isJumping: false, frame: 0, scaleX: 1, scaleY: 1 })
  const obstaclesRef = useRef([])
  const cloudsRef = useRef([])
  const particlesRef = useRef([])
  const parallaxLayersRef = useRef([])
  const lastSpawnRef = useRef(0)
  const frameCountRef = useRef(0)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('dinoHighScore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('dinoHighScore', score.toString())
    }
  }, [score, highScore])

  const spawnObstacle = useCallback(() => {
    const types = [
      { width: 25, height: 45, type: 'small', x: GAME_WIDTH + 50 }, // Small cactus
      { width: 35, height: 60, type: 'big', x: GAME_WIDTH + 50 }, // Big cactus
      { width: 70, height: 40, type: 'group', x: GAME_WIDTH + 50 }, // Group of cacti
    ]
    const type = types[Math.floor(Math.random() * types.length)]
    obstaclesRef.current.push({
      ...type,
      y: GROUND_Y - type.height + 5,
      passed: false,
    })
  }, [])

  const spawnCloud = useCallback(() => {
    cloudsRef.current.push({
      x: GAME_WIDTH + 50,
      y: 30 + Math.random() * 120,
      speed: 1 + Math.random() * 1.5,
      scale: 0.6 + Math.random() * 0.8,
      opacity: 0.6 + Math.random() * 0.4,
    })
  }, [])

  const spawnParticle = useCallback((x, y, type) => {
    const colors = type === 'dust' ? ['#d4a574', '#c49a6c', '#b8956a'] : ['#f1c40f', '#f39c12', '#e67e22']
    particlesRef.current.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: type === 'dust' ? -Math.random() * 2 : (Math.random() - 0.5) * 2,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      type,
    })
  }, [])

  const resetGame = useCallback(() => {
    setGameState('menu')
    scoreRef.current = 0
    gameSpeedRef.current = GAME_SPEED_START
    dinoRef.current = { y: GROUND_Y, vy: 0, width: 46, height: 47, isJumping: false, frame: 0, scaleX: 1, scaleY: 1 }
    obstaclesRef.current = []
    cloudsRef.current = []
    particlesRef.current = []
    parallaxLayersRef.current = []
    lastSpawnRef.current = 0
    frameCountRef.current = 0
    setScreenShake(0)
    setScore(0)
  }, [])

  const startGame = useCallback(() => {
    resetGame()
    setGameState('playing')
  }, [resetGame])

  const jump = useCallback(() => {
    if (!dinoRef.current.isJumping && gameState === 'playing') {
      dinoRef.current.vy = JUMP_STRENGTH
      dinoRef.current.isJumping = true
    }
  }, [gameState])

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        if (gameState === 'menu' || gameState === 'gameover') {
          startGame()
        } else if (gameState === 'playing') {
          jump()
        }
      }
    }

    const handleTouch = (e) => {
      e.preventDefault()
      if (gameState === 'menu' || gameState === 'gameover') {
        startGame()
      } else if (gameState === 'playing') {
        jump()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('touchstart', handleTouch, { passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [gameState, startGame, jump])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    let animationFrameId
    let isPlaying = true
    const canvas = document.getElementById('game-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1
    canvas.width = GAME_WIDTH * dpr
    canvas.height = GAME_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    const drawDino = (x, y, frame) => {
      const dino = dinoRef.current
      const isRunning = !dino.isJumping && gameState === 'playing'
      const legCycle = isRunning ? Math.floor(frame / 3) % 2 : 0
      const squash = dino.isJumping ? 0.9 : 1
      const stretch = dino.isJumping ? 1.1 : 1

      // Shadow (stays on ground surface)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
      ctx.beginPath()
      ctx.ellipse(x + dino.width / 2, GROUND_Y + 38, 22, 6, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.translate(x + dino.width / 2, y + dino.height / 2)
      ctx.scale(dino.scaleX * squash, dino.scaleY * stretch)
      ctx.translate(-(x + dino.width / 2), -(y + dino.height / 2))

      // Dino body gradient
      const bodyGradient = ctx.createLinearGradient(x, y, x + dino.width, y + dino.height)
      bodyGradient.addColorStop(0, '#34495e')
      bodyGradient.addColorStop(1, '#2c3e50')
      ctx.fillStyle = bodyGradient

      // Legs with animation
      const legOffset = legCycle === 0 ? 0 : -3
      ctx.fillRect(x + 10, y + 35 + legOffset, 8, 12)
      ctx.fillRect(x + 28, y + 35 - legOffset, 8, 12)

      // Body
      ctx.fillRect(x + 10, y + 18, 26, 24)

      // Head
      ctx.fillRect(x + 15, y, 28, 18)

      // Eye with shine
      ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(x + 32, y + 4, 4, 4)
      ctx.fillStyle = '#fff'
      ctx.fillRect(x + 33, y + 5, 2, 2)

      // Arm
      ctx.fillStyle = '#34495e'
      ctx.fillRect(x + 28, y + 14, 8, 6)

      // Mouth
      ctx.fillStyle = '#2c3e50'
      ctx.fillRect(x + 20, y + 14, 8, 2)

      // Spikes on back
      ctx.fillStyle = '#2c3e50'
      ctx.beginPath()
      ctx.moveTo(x + 12, y + 20)
      ctx.lineTo(x + 10, y + 12)
      ctx.lineTo(x + 14, y + 18)
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(x + 18, y + 22)
      ctx.lineTo(x + 16, y + 14)
      ctx.lineTo(x + 20, y + 20)
      ctx.fill()

      ctx.restore()
    }

    const drawCactus = (x, y, width, height, type) => {
      // Cactus gradient
      const cactusGradient = ctx.createLinearGradient(x, y, x + width, y + height)
      cactusGradient.addColorStop(0, '#27ae60')
      cactusGradient.addColorStop(0.5, '#2ecc71')
      cactusGradient.addColorStop(1, '#27ae60')
      ctx.fillStyle = cactusGradient

      // Main stem
      ctx.fillRect(x + width/3, y, width/3, height)

      // Arms based on type
      if (type === 'small') {
        ctx.fillRect(x, y + height/3, width/3, height/4)
        ctx.fillRect(x, y + height/6, width/3, height/4)
      } else if (type === 'big') {
        ctx.fillRect(x, y + height/4, width/3, height/3)
        ctx.fillRect(x, y + height/8, width/3, height/4)
        ctx.fillRect(x + width*2/3, y + height/3, width/3, height/4)
      } else {
        // Group
        ctx.fillRect(x, y + height/4, width/3, height/3)
        ctx.fillRect(x + width/3, y + height/5, width/3, height/4)
        ctx.fillRect(x + width*2/3, y + height/3, width/3, height/3)
      }

      // Shadow detail
      ctx.fillStyle = '#1e8449'
      ctx.fillRect(x + width/2 - 2, y + height/2, 4, height/3)

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(x + width/3 + 2, y, 4, height)
    }

    const drawCloud = (x, y, scale, opacity) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.beginPath()
      ctx.arc(x, y, 15 * scale, 0, Math.PI * 2)
      ctx.arc(x + 18 * scale, y - 5 * scale, 18 * scale, 0, Math.PI * 2)
      ctx.arc(x + 35 * scale, y, 14 * scale, 0, Math.PI * 2)
      ctx.arc(x + 10 * scale, y + 5 * scale, 10 * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawGround = () => {
      // Ground gradient
      const groundGradient = ctx.createLinearGradient(0, GROUND_Y + 38, 0, GROUND_Y + 50)
      groundGradient.addColorStop(0, '#27ae60')
      groundGradient.addColorStop(0.3, '#2ecc71')
      groundGradient.addColorStop(1, '#27ae60')
      ctx.fillStyle = groundGradient
      ctx.fillRect(0, GROUND_Y + 38, GAME_WIDTH, 12)

      // Ground texture
      ctx.fillStyle = '#229954'
      for (let i = 0; i < GAME_WIDTH; i += 20) {
        ctx.fillRect(i, GROUND_Y + 40, 2, 8)
      }
    }

    const updateAndDraw = () => {
      if (!isPlaying) return

      // Check if game is still playing
      if (gameState !== 'playing') {
        isPlaying = false
        return
      }

      // Screen shake effect
      let shakeX = 0, shakeY = 0
      if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake
        shakeY = (Math.random() - 0.5) * screenShake
        setScreenShake(prev => prev * 0.9)
      }

      ctx.save()
      ctx.translate(shakeX, shakeY)

      // Clear canvas with gradient sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
      skyGradient.addColorStop(0, '#87CEEB')
      skyGradient.addColorStop(0.6, '#B0E0E6')
      skyGradient.addColorStop(1, '#E0F6FF')
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Draw sun with glow
      const sunGradient = ctx.createRadialGradient(650, 80, 10, 650, 80, 50)
      sunGradient.addColorStop(0, '#fff9c4')
      sunGradient.addColorStop(0.3, '#f1c40f')
      sunGradient.addColorStop(1, 'rgba(241, 196, 15, 0)')
      ctx.fillStyle = sunGradient
      ctx.beginPath()
      ctx.arc(650, 80, 50, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#f39c12'
      ctx.beginPath()
      ctx.arc(650, 80, 35, 0, Math.PI * 2)
      ctx.fill()

      // Parallax layers
      const parallaxSpeed = gameSpeedRef.current * 0.3
      if (parallaxLayersRef.current.length === 0) {
        for (let i = 0; i < 5; i++) {
          parallaxLayersRef.current.push({
            x: Math.random() * GAME_WIDTH,
            y: 100 + Math.random() * 200,
            size: 30 + Math.random() * 50,
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.1 + Math.random() * 0.2
          })
        }
      }

      parallaxLayersRef.current.forEach((layer, i) => {
        layer.x -= layer.speed * (parallaxSpeed / 3)
        if (layer.x < -layer.size) layer.x = GAME_WIDTH + layer.size

        ctx.fillStyle = `rgba(255, 255, 255, ${layer.opacity})`
        ctx.beginPath()
        ctx.arc(layer.x, layer.y, layer.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw clouds
      if (Math.random() < 0.005) spawnCloud()

      cloudsRef.current.forEach((cloud, i) => {
        cloud.x -= cloud.speed
        drawCloud(cloud.x, cloud.y, cloud.scale, cloud.opacity)
        if (cloud.x < -100) cloudsRef.current.splice(i, 1)
      })

      drawGround()

      // Spawn particles when running
      if (!dinoRef.current.isJumping && gameState === 'playing' && frameCountRef.current % 3 === 0) {
        spawnParticle(DINO_X + 10, GROUND_Y + 42, 'dust')
      }

      // Update and draw particles
      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life -= particle.decay

        ctx.fillStyle = particle.color
        ctx.globalAlpha = particle.life
        const radius = Math.max(0.5, particle.size * particle.life)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1

        if (particle.life <= 0) {
          particlesRef.current.splice(i, 1)
        }
      })

      // Update and draw dino
      if (dinoRef.current.isJumping) {
        dinoRef.current.vy += GRAVITY
        dinoRef.current.y += dinoRef.current.vy

        // Squash and stretch during jump
        dinoRef.current.scaleX = 1 + (dinoRef.current.vy * 0.01)
        dinoRef.current.scaleY = 1 - (dinoRef.current.vy * 0.01)

        if (dinoRef.current.y >= GROUND_Y) {
          dinoRef.current.y = GROUND_Y
          dinoRef.current.vy = 0
          dinoRef.current.isJumping = false
          dinoRef.current.scaleX = 1
          dinoRef.current.scaleY = 1
        }
      } else {
        // Squash and stretch when running
        const runCycle = Math.sin(frameCountRef.current * 0.3) * 0.05
        dinoRef.current.scaleX = 1 + runCycle
        dinoRef.current.scaleY = 1 - runCycle
      }

      drawDino(DINO_X, dinoRef.current.y, frameCountRef.current)

      // Update and draw obstacles
      if (frameCountRef.current - lastSpawnRef.current > Math.random() * (SPAWN_RATE_MAX - SPAWN_RATE_MIN) + SPAWN_RATE_MIN) {
        spawnObstacle()
        lastSpawnRef.current = frameCountRef.current
      }

      obstaclesRef.current.forEach((obs, i) => {
        obs.x -= gameSpeedRef.current
        const type = obs.type || 'small'
        drawCactus(obs.x, obs.y, obs.width, obs.height, type)

        // Collision detection
        if (
          DINO_X < obs.x + obs.width &&
          DINO_X + dinoRef.current.width > obs.x &&
          dinoRef.current.y < obs.y + obs.height &&
          dinoRef.current.y + dinoRef.current.height > obs.y
        ) {
          // Collision!
          setScreenShake(15)
          setGameState('gameover')
          if (!obs.passed) {
            obs.passed = true
          }
          return
        }

        // Score increment when passing obstacle
        if (!obs.passed && DINO_X > obs.x + obs.width) {
          obs.passed = true
          scoreRef.current += 10
        }

        if (obs.x < -100) {
          obstaclesRef.current.splice(i, 1)
        }
      })

      // Update score and game speed
      if (frameCountRef.current % 5 === 0) {
        scoreRef.current += 1
        if (scoreRef.current % 50 === 0) {
          gameSpeedRef.current += 0.2
        }
      }

      // Update score state periodically
      if (frameCountRef.current % 10 === 0) {
        setScore(scoreRef.current)
      }

      // Update frame counter
      if (!dinoRef.current.isJumping) {
        dinoRef.current.frame++
      }
      frameCountRef.current++

      ctx.restore()

      animationFrameId = requestAnimationFrame(updateAndDraw)
    }

    updateAndDraw()

    return () => {
      isPlaying = false
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [gameState])

  return (
    <div className="game-container">
      <div className="canvas-wrapper">
        <canvas id="game-canvas" width={GAME_WIDTH} height={GAME_HEIGHT} />

        <div className="ui-layer">
          <div className="score-board">
            Score: {score} | High: {highScore}
          </div>

          {gameState === 'menu' && (
            <div className="menu-overlay">
              <div className="menu-content">
                <h1 className="title">DINO RUN</h1>
                <p className="subtitle">Escape the cacti and set a high score!</p>
                <button className="start-btn" onClick={startGame}>
                  START GAME
                </button>
                <div className="controls-hint">
                  Press <span className="key">Space</span> or tap to jump
                </div>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="menu-overlay" style={{ display: 'flex' }}>
              <div className="menu-content">
                <h1 className="title" style={{ color: '#e74c3c' }}>GAME OVER</h1>
                <p className="subtitle">Final Score: {score}</p>
                <button className="start-btn" onClick={resetGame}>
                  PLAY AGAIN
                </button>
                <div className="controls-hint">
                  Press <span className="key">Space</span> to restart
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DinoGame
