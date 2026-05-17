import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

function DinoGame() {
  const [gameState, setGameState] = useState('menu') // menu, playing, gameover
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

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
  const dinoRef = useRef({ y: GROUND_Y, vy: 0, width: 46, height: 47, isJumping: false, frame: 0 })
  const obstaclesRef = useRef([])
  const cloudsRef = useRef([])
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
      { width: 25, height: 45, x: GAME_WIDTH + 50 }, // Small cactus
      { width: 35, height: 60, x: GAME_WIDTH + 50 }, // Big cactus
      { width: 70, height: 40, x: GAME_WIDTH + 50 }, // Group of cacti
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
    })
  }, [])

  const resetGame = useCallback(() => {
    setGameState('menu')
    scoreRef.current = 0
    gameSpeedRef.current = GAME_SPEED_START
    dinoRef.current = { y: GROUND_Y, vy: 0, width: 46, height: 47, isJumping: false, frame: 0 }
    obstaclesRef.current = []
    cloudsRef.current = []
    lastSpawnRef.current = 0
    frameCountRef.current = 0
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
      ctx.fillStyle = '#2c3e50'

      // Dino body
      const legOffset = frame % 2 === 0 ? 0 : -5

      // Legs
      ctx.fillRect(x + 8, y + 35, 8, 12)
      ctx.fillRect(x + 26, y + 35, 8, 12)

      // Body
      ctx.fillRect(x + 10, y + 18, 26, 24)

      // Head
      ctx.fillRect(x + 15, y, 28, 18)

      // Eye
      ctx.fillStyle = '#ecf0f1'
      ctx.fillRect(x + 32, y + 4, 4, 4)

      // Arm
      ctx.fillStyle = '#2c3e50'
      ctx.fillRect(x + 28, y + 14, 8, 6)

      // Mouth
      ctx.fillRect(x + 20, y + 14, 8, 2)
    }

    const drawCactus = (x, y, width, height) => {
      ctx.fillStyle = '#27ae60'

      // Main stem
      ctx.fillRect(x + width/3, y, width/3, height)

      // Left arm
      ctx.fillRect(x, y + height/3, width/3, height/4)
      ctx.fillRect(x, y + height/6, width/3, height/4)

      // Right arm
      ctx.fillRect(x + width*2/3, y + height/4, width/3, height/5)
      ctx.fillRect(x + width*2/3, y + height/8, width/3, height/5)

      // Add some shadow detail
      ctx.fillStyle = '#1e8449'
      ctx.fillRect(x + width/2 - 2, y + height/2, 4, height/3)
    }

    const drawCloud = (x, y, scale) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, 15 * scale, 0, Math.PI * 2)
      ctx.arc(x + 18 * scale, y - 5 * scale, 18 * scale, 0, Math.PI * 2)
      ctx.arc(x + 35 * scale, y, 14 * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    const drawGround = () => {
      // Ground line
      ctx.fillStyle = '#8B4513'
      ctx.fillRect(0, GROUND_Y + 42, GAME_WIDTH, 8)

      // Ground top
      ctx.fillStyle = '#654321'
      ctx.fillRect(0, GROUND_Y + 40, GAME_WIDTH, 5)

      // Grass
      ctx.fillStyle = '#27ae60'
      ctx.fillRect(0, GROUND_Y + 38, GAME_WIDTH, 2)
    }

    const updateAndDraw = () => {
      // Clear canvas
      ctx.fillStyle = '#87CEEB'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      // Draw sun
      const gradient = ctx.createRadialGradient(650, 80, 10, 650, 80, 40)
      gradient.addColorStop(0, '#f1c40f')
      gradient.addColorStop(1, '#e67e22')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(650, 80, 40, 0, Math.PI * 2)
      ctx.fill()

      // Draw clouds
      if (Math.random() < 0.01) spawnCloud()

      cloudsRef.current.forEach((cloud, i) => {
        cloud.x -= cloud.speed
        drawCloud(cloud.x, cloud.y, cloud.scale)
        if (cloud.x < -100) cloudsRef.current.splice(i, 1)
      })

      drawGround()

      // Update and draw dino
      if (dinoRef.current.isJumping) {
        dinoRef.current.vy += GRAVITY
        dinoRef.current.y += dinoRef.current.vy

        if (dinoRef.current.y >= GROUND_Y) {
          dinoRef.current.y = GROUND_Y
          dinoRef.current.vy = 0
          dinoRef.current.isJumping = false
        }
      }

      drawDino(DINO_X, dinoRef.current.y, frameCountRef.current)

      // Update and draw obstacles
      if (frameCountRef.current - lastSpawnRef.current > Math.random() * (SPAWN_RATE_MAX - SPAWN_RATE_MIN) + SPAWN_RATE_MIN) {
        spawnObstacle()
        lastSpawnRef.current = frameCountRef.current
      }

      obstaclesRef.current.forEach((obs, i) => {
        obs.x -= gameSpeedRef.current
        drawCactus(obs.x, obs.y, obs.width, obs.height)

        // Collision detection
        if (
          DINO_X < obs.x + obs.width &&
          DINO_X + dinoRef.current.width > obs.x &&
          dinoRef.current.y < obs.y + obs.height &&
          dinoRef.current.y + dinoRef.current.height > obs.y
        ) {
          // Collision!
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

      animationFrameId = requestAnimationFrame(updateAndDraw)
    }

    updateAndDraw()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [gameState, spawnObstacle, spawnCloud])

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
