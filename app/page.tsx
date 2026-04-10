'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type Stage = 'locked' | 'gift' | 'chase' | 'finale'

type Obstacle = {
  gapSize: number
  gapY: number
  id: number
  passed: boolean
  x: number
}

const confetti = Array.from({ length: 24 }, (_, index) => index)
const giftSparkles = Array.from({ length: 12 }, (_, index) => index)
const stageBulbs = Array.from({ length: 20 }, (_, index) => index)
const runnerTrails = Array.from({ length: 8 }, (_, index) => index)

const RUNNER_X = 72
const STARTING_CHASER_X = 48
const CHASE_DURATION_MS = 20000

const birthdayMessage = [
  'Happy birthday, beb, may your year bloom with bold joy and gentle peace.',
  'May every little dream you whisper at night wake up and come true in daylight.',
  'You make ordinary moments feel magical, and that magic deserves celebration today.',
  'May your heart stay brave, your laugh stay loud, and your days stay full of color.',
  'You are deeply loved, endlessly cherished, and forever my favorite reason to smile.',
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export default function Page() {
  const [stage, setStage] = useState<Stage>('locked')
  const [secondsLeft, setSecondsLeft] = useState(20)
  const [isAltChaserFrame, setIsAltChaserFrame] = useState(false)
  const [isAltRunnerFrame, setIsAltRunnerFrame] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [nearMiss, setNearMiss] = useState(false)
  const [dodgeCount, setDodgeCount] = useState(0)
  const [runnerY, setRunnerY] = useState(52)
  const [chaserY, setChaserY] = useState(44)
  const [runnerTilt, setRunnerTilt] = useState(0)
  const [chaserTilt, setChaserTilt] = useState(0)
  const [chaserX, setChaserX] = useState(STARTING_CHASER_X)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])

  const runnerYRef = useRef(52)
  const chaserYRef = useRef(44)
  const runnerVelocityRef = useRef(0)
  const chaserVelocityRef = useRef(0)
  const lastGapYRef = useRef(52)
  const obstaclesRef = useRef<Obstacle[]>([])
  const nextObstacleIdRef = useRef(1)
  const nearMissTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (stage !== 'chase') {
      setSecondsLeft(20)
      setIsAltChaserFrame(false)
      setIsAltRunnerFrame(false)
      setSceneIndex(0)
      setNearMiss(false)
      setDodgeCount(0)
      setRunnerY(52)
      setChaserY(44)
      setRunnerTilt(0)
      setChaserTilt(0)
      setChaserX(STARTING_CHASER_X)
      setObstacles([])
      runnerYRef.current = 52
      chaserYRef.current = 44
      runnerVelocityRef.current = 0
      chaserVelocityRef.current = 0
      lastGapYRef.current = 52
      obstaclesRef.current = []
      return
    }

    const createObstacle = (x: number): Obstacle => ({
      gapSize: 36 + Math.random() * 9,
      gapY: (() => {
        const nextGap = clamp(lastGapYRef.current + (Math.random() * 20 - 10), 33, 67)
        lastGapYRef.current = nextGap
        return nextGap
      })(),
      id: nextObstacleIdRef.current++,
      passed: false,
      x,
    })

    let lastTick = Date.now()
    const startedAt = Date.now()
    const initialObstacles = [createObstacle(110), createObstacle(168)]

    setSecondsLeft(20)
    setSceneIndex(0)
    setNearMiss(false)
    setDodgeCount(0)
    setRunnerY(52)
    setChaserY(44)
    setRunnerTilt(0)
    setChaserTilt(0)
    setChaserX(STARTING_CHASER_X)
    setObstacles(initialObstacles)
    obstaclesRef.current = initialObstacles
    runnerYRef.current = 52
    chaserYRef.current = 44
    runnerVelocityRef.current = 0
    chaserVelocityRef.current = 0

    const frameTimer = window.setInterval(() => {
      setIsAltChaserFrame((current) => !current)
      setIsAltRunnerFrame((current) => !current)
    }, 500)

    const gameTimer = window.setInterval(() => {
      const now = Date.now()
      const elapsed = now - startedAt
      const delta = now - lastTick
      lastTick = now
      const dt = delta / 16.67

      const remaining = Math.max(0, 20 - Math.floor(elapsed / 1000))
      setSecondsLeft(remaining)
      setSceneIndex(Math.min(3, Math.floor(elapsed / 5000)))

      const chaseProgress = clamp(elapsed / CHASE_DURATION_MS, 0, 1)
      const chaseGap = 24 - chaseProgress * 12
      const chaseSway = Math.sin(elapsed / 520) * 1.2 + Math.sin(elapsed / 180) * 0.45
      const nextChaserX = clamp(
        RUNNER_X - chaseGap + chaseSway,
        STARTING_CHASER_X - 2,
        RUNNER_X - 10
      )
      setChaserX(nextChaserX)

      const speed = 0.55 + elapsed / 54000 + delta * 0.00022
      let updatedObstacles = obstaclesRef.current
        .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed }))
        .filter((obstacle) => obstacle.x > -16)

      const lastObstacle = updatedObstacles[updatedObstacles.length - 1]
      if (!lastObstacle || lastObstacle.x < 68) {
        updatedObstacles = [...updatedObstacles, createObstacle(128)]
      }

      const nearestAhead = (x: number) =>
        updatedObstacles
          .filter((obstacle) => obstacle.x + 8 >= x - 8)
          .sort((a, b) => a.x - b.x)[0]

      const runnerObstacle = nearestAhead(RUNNER_X)
      const chaserObstacle = nearestAhead(nextChaserX)

      let runnerTarget = 52 + Math.sin(elapsed / 390) * 5
      if (runnerObstacle && runnerObstacle.x < RUNNER_X + 30) {
        const gapHalf = runnerObstacle.gapSize / 2
        const safeTop = runnerObstacle.gapY + gapHalf - 4
        const safeBottom = runnerObstacle.gapY - gapHalf + 4
        const centered = runnerObstacle.gapY + Math.sin(elapsed / 240) * 1.6
        runnerTarget = clamp(centered, safeBottom, safeTop)
      }
      runnerTarget = clamp(runnerTarget, 24, 78)

      let chaserTarget = runnerYRef.current - 2 + Math.sin(elapsed / 450) * 2
      if (chaserObstacle && chaserObstacle.x < nextChaserX + 30) {
        const gapHalf = chaserObstacle.gapSize / 2
        const safeTop = chaserObstacle.gapY + gapHalf - 5
        const safeBottom = chaserObstacle.gapY - gapHalf + 5
        chaserTarget = clamp(chaserObstacle.gapY - 0.5, safeBottom, safeTop)
      }
      chaserTarget = clamp(chaserTarget, 22, 76)

      let runnerVelocity = runnerVelocityRef.current + 0.24 * dt
      if (runnerTarget < runnerYRef.current - 2.5) {
        runnerVelocity = -2.35 - Math.random() * 0.35
      } else if (runnerTarget > runnerYRef.current + 8 && runnerVelocity < 2) {
        runnerVelocity += 0.26 * dt
      }

      runnerYRef.current = clamp(runnerYRef.current + runnerVelocity * dt, 24, 78)
      if (runnerYRef.current <= 24 || runnerYRef.current >= 78) {
        runnerVelocity *= -0.12
      }
      runnerVelocityRef.current = runnerVelocity * 0.98

      let chaserVelocity = chaserVelocityRef.current + 0.22 * dt
      if (chaserTarget < chaserYRef.current - 2) {
        chaserVelocity = -2.15 - Math.random() * 0.25
      } else if (chaserTarget > chaserYRef.current + 7 && chaserVelocity < 1.8) {
        chaserVelocity += 0.22 * dt
      }

      chaserYRef.current = clamp(chaserYRef.current + chaserVelocity * dt, 22, 76)
      if (chaserYRef.current <= 22 || chaserYRef.current >= 76) {
        chaserVelocity *= -0.12
      }
      chaserVelocityRef.current = chaserVelocity * 0.98

      setRunnerY(runnerYRef.current)
      setChaserY(chaserYRef.current)
      setRunnerTilt(clamp(-runnerVelocityRef.current * 9, -25, 25))
      setChaserTilt(clamp(-chaserVelocityRef.current * 8, -22, 22))

      let cleared = 0
      updatedObstacles = updatedObstacles.map((obstacle) => {
        if (!obstacle.passed && obstacle.x < RUNNER_X - 7) {
          cleared += 1
          return { ...obstacle, passed: true }
        }
        return obstacle
      })

      if (cleared > 0) {
        setDodgeCount((count) => count + cleared)
      }

      const isNearMiss = (obstacle: Obstacle | undefined, x: number, y: number) => {
        if (!obstacle) {
          return false
        }
        const horizontalClose = obstacle.x < x + 7 && obstacle.x > x - 7
        const verticalRisk = Math.abs(y - obstacle.gapY) > obstacle.gapSize * 0.28
        return horizontalClose && verticalRisk
      }

      if (
        isNearMiss(runnerObstacle, RUNNER_X, runnerYRef.current) ||
        isNearMiss(chaserObstacle, nextChaserX, chaserYRef.current)
      ) {
        setNearMiss(true)
        if (nearMissTimerRef.current) {
          window.clearTimeout(nearMissTimerRef.current)
        }
        nearMissTimerRef.current = window.setTimeout(() => {
          setNearMiss(false)
        }, 160)
      }

      obstaclesRef.current = updatedObstacles
      setObstacles(updatedObstacles)
    }, 60)

    const finaleTimer = window.setTimeout(() => {
      setStage('finale')
    }, CHASE_DURATION_MS)

    return () => {
      window.clearInterval(frameTimer)
      window.clearInterval(gameTimer)
      window.clearTimeout(finaleTimer)
      if (nearMissTimerRef.current) {
        window.clearTimeout(nearMissTimerRef.current)
      }
    }
  }, [stage])

  return (
    <main className={`birthday-page birthday-${stage}`}>
      <div className="party-pattern" aria-hidden="true" />

      <div className="confetti-field" aria-hidden="true">
        {confetti.map((piece) => (
          <span key={piece} style={{ '--piece': piece } as CSSProperties} />
        ))}
      </div>

      <div className="stage-bulbs" aria-hidden="true">
        {stageBulbs.map((bulb) => (
          <span key={bulb} style={{ '--bulb': bulb } as CSSProperties} />
        ))}
      </div>

      <section className={`curtain ${stage !== 'locked' ? 'curtain-open' : ''}`}>
        <div className="curtain-panel curtain-panel-left" />
        <div className="curtain-panel curtain-panel-right" />
        <div className="curtain-valance" />

        {stage === 'locked' ? (
          <div className="unlock-stage">
            <p className="unlock-subtitle">Today&apos;s secret birthday show</p>
            <button className="unlock-button" onClick={() => setStage('gift')}>
              <span className="chain chain-left" aria-hidden="true" />
              <span className="lock-plate">Unlock</span>
              <span className="chain chain-right" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>

      {stage === 'gift' ? (
        <section className="gift-scene" aria-label="Birthday gift">
          <div className="gift-sparkles" aria-hidden="true">
            {giftSparkles.map((sparkle) => (
              <span
                key={sparkle}
                style={{ '--sparkle': sparkle } as CSSProperties}
              />
            ))}
          </div>

          <button className="gift-button" onClick={() => setStage('chase')}>
            <span className="gift-ring gift-ring-one" aria-hidden="true" />
            <span className="gift-ring gift-ring-two" aria-hidden="true" />
            <img
              className="gift-art"
              src="/birthday/gift.svg"
              alt="A big bouncing birthday gift"
            />
            <span className="gift-cta">Tap To Open, Beb</span>
          </button>
        </section>
      ) : null}

      {stage === 'chase' || stage === 'finale' ? (
        <section
          className={`chase-scene flappy-run scene-${sceneIndex} ${
            nearMiss ? 'near-miss' : ''
          }`}
          aria-label="Birthday chase scene"
        >
          <div className="scene-wash" aria-hidden="true" />
          <div className="flappy-scroll" aria-hidden="true">
            <span className="scroll-layer clouds" />
            <span className="scroll-layer hills" />
            <span className="scroll-layer skyline" />
          </div>
          <div className="stage-road" aria-hidden="true" />

          <div className="flappy-pipes" aria-hidden="true">
            {obstacles.map((obstacle) => {
              const topHeight = clamp(100 - (obstacle.gapY + obstacle.gapSize / 2), 8, 92)
              const bottomHeight = clamp(obstacle.gapY - obstacle.gapSize / 2, 8, 92)

              return (
                <div
                  key={obstacle.id}
                  className="pipe-set"
                  style={{ left: `${obstacle.x}%` }}
                >
                  <span className="pipe pipe-top" style={{ height: `${topHeight}%` }} />
                  <span
                    className="pipe-cap pipe-cap-top"
                    style={{ top: `${topHeight}%` }}
                  />
                  <span
                    className="pipe pipe-bottom"
                    style={{ height: `${bottomHeight}%` }}
                  />
                  <span
                    className="pipe-cap pipe-cap-bottom"
                    style={{ bottom: `${bottomHeight}%` }}
                  />
                </div>
              )
            })}
          </div>

          {stage === 'chase' ? (
            <div className="countdown-chip" role="status">
              Catch in {secondsLeft}s
            </div>
          ) : null}

          {stage === 'chase' ? (
            <div className="dodge-chip" role="status">
              Pipes Cleared {dodgeCount}
            </div>
          ) : null}

          <div className="joy-banner" aria-hidden="true">
            flappy love run
          </div>

          <div className="speech speech-chaser">
            <span>Happy birthday beb!</span>
          </div>

          <div className="speech speech-runner">
            <span>Aaaah, she is too cute!</span>
          </div>

          <div
            className="character character-chaser"
            style={{
              bottom: `${stage === 'finale' ? 22 : chaserY}%`,
              left: `${stage === 'finale' ? 50 : chaserX}%`,
              transform: `translateX(-50%) rotate(${stage === 'finale' ? 0 : chaserTilt}deg)`,
            }}
          >
            <div className="photo-wrap chaser-photo">
              <img
                src={isAltChaserFrame ? '/birthday/image3.png' : '/birthday/image1.jpg'}
                alt="Image 1 sending birthday kisses"
              />
              <span className="kiss-mouth" aria-hidden="true" />
              <span className="heart heart-one" aria-hidden="true" />
              <span className="heart heart-two" aria-hidden="true" />
              <span className="heart heart-three" aria-hidden="true" />
            </div>
          </div>

          <div
            className="character character-runner"
            style={{
              bottom: `${stage === 'finale' ? 22 : runnerY}%`,
              left: `${stage === 'finale' ? 53 : RUNNER_X}%`,
              transform: `translateX(-50%) rotate(${stage === 'finale' ? 0 : runnerTilt}deg)`,
            }}
          >
            <div className="photo-wrap runner-photo">
              <img
                src={isAltRunnerFrame ? '/birthday/image4.png' : '/birthday/image2.jpg'}
                alt="Image 2 running away playfully"
              />
              <span className="disgust-stamp" aria-hidden="true">
                eww
              </span>
              <span className="panic-line panic-one" aria-hidden="true" />
              <span className="panic-line panic-two" aria-hidden="true" />
              <span className="sweat-drop sweat-one" aria-hidden="true" />
              <span className="sweat-drop sweat-two" aria-hidden="true" />
              <div className="puke-splash" aria-hidden="true">
                <span className="puke-wave" />
                <span className="puke-dot puke-dot-one" />
                <span className="puke-dot puke-dot-two" />
                <span className="puke-dot puke-dot-three" />
              </div>
            </div>
          </div>

          <div className="runner-trails" aria-hidden="true">
            {runnerTrails.map((trail) => (
              <span key={trail} style={{ '--trail': trail } as CSSProperties} />
            ))}
          </div>

          {stage === 'finale' ? (
            <div className="finale-message" role="status">
              <div className="finale-photo-row" aria-hidden="true">
                <div className="finale-mini-photo">
                  <img src="/birthday/image1.jpg" alt="" />
                </div>
                <div className="finale-mini-photo">
                  <img src="/birthday/image2.jpg" alt="" />
                </div>
              </div>
              <div className="kiss-burst" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <h1>Happy birthday, Fiona.</h1>
              {birthdayMessage.map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
              <button className="restart-button" onClick={() => setStage('locked')}>
                Replay The Surprise
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  )
}
