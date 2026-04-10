'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

type Stage = 'locked' | 'gift' | 'chase' | 'finale'
type Lane = 0 | 1 | 2

const confetti = Array.from({ length: 24 }, (_, index) => index)
const giftSparkles = Array.from({ length: 12 }, (_, index) => index)
const stageBulbs = Array.from({ length: 20 }, (_, index) => index)
const runnerTrails = Array.from({ length: 8 }, (_, index) => index)
const speedLines = Array.from({ length: 16 }, (_, index) => index)
const coinRush = Array.from({ length: 12 }, (_, index) => index)
const lanePositions = [18, 50, 82]

const birthdayMessage = [
  'Happy birthday, beb, may your year bloom with bold joy and gentle peace.',
  'May every little dream you whisper at night wake up and come true in daylight.',
  'You make ordinary moments feel magical, and that magic deserves celebration today.',
  'May your heart stay brave, your laugh stay loud, and your days stay full of color.',
  'You are deeply loved, endlessly cherished, and forever my favorite reason to smile.',
]

export default function Page() {
  const [stage, setStage] = useState<Stage>('locked')
  const [secondsLeft, setSecondsLeft] = useState(20)
  const [isAltChaserFrame, setIsAltChaserFrame] = useState(false)
  const [isAltRunnerFrame, setIsAltRunnerFrame] = useState(false)
  const [chaserLane, setChaserLane] = useState<Lane>(0)
  const [runnerLane, setRunnerLane] = useState<Lane>(2)
  const [runnerMove, setRunnerMove] = useState<'run' | 'jump' | 'slide'>('run')
  const [sceneIndex, setSceneIndex] = useState(0)
  const [nearMiss, setNearMiss] = useState(false)
  const [dodgeCount, setDodgeCount] = useState(0)
  const chaserLaneRef = useRef<Lane>(0)
  const runnerLaneRef = useRef<Lane>(2)
  const runnerMoveTimerRef = useRef<number | null>(null)
  const nearMissTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (stage !== 'chase') {
      setSecondsLeft(20)
      setIsAltChaserFrame(false)
      setIsAltRunnerFrame(false)
      setChaserLane(0)
      setRunnerLane(2)
      setRunnerMove('run')
      setSceneIndex(0)
      setNearMiss(false)
      setDodgeCount(0)
      chaserLaneRef.current = 0
      runnerLaneRef.current = 2
      return
    }

    const startedAt = Date.now()
    setSecondsLeft(20)
    setSceneIndex(0)
    setDodgeCount(0)
    setChaserLane(0)
    setRunnerLane(2)
    setRunnerMove('run')
    chaserLaneRef.current = 0
    runnerLaneRef.current = 2

    const tickTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, 20 - Math.floor(elapsed / 1000))
      setSecondsLeft(remaining)
      setSceneIndex(Math.min(3, Math.floor(elapsed / 5000)))
    }, 120)

    const runnerTimer = window.setInterval(() => {
      const currentRunner = runnerLaneRef.current
      const laneOptions = ([0, 1, 2] as Lane[]).filter(
        (lane) => lane !== currentRunner
      )

      const nextLane =
        laneOptions[Math.floor(Math.random() * laneOptions.length)] ?? currentRunner

      runnerLaneRef.current = nextLane
      setRunnerLane(nextLane)
      setDodgeCount((count) => count + 1)

      const moveRoll = Math.random()
      const nextMove = moveRoll < 0.33 ? 'jump' : moveRoll < 0.66 ? 'slide' : 'run'
      setRunnerMove(nextMove)

      if (runnerMoveTimerRef.current) {
        window.clearTimeout(runnerMoveTimerRef.current)
      }

      runnerMoveTimerRef.current = window.setTimeout(() => {
        setRunnerMove('run')
      }, 320)
    }, 650)

    const chaserTimer = window.setInterval(() => {
      const targetLane = runnerLaneRef.current
      const currentChaser = chaserLaneRef.current
      let nextLane: Lane = currentChaser

      if (targetLane > currentChaser) {
        nextLane = (currentChaser + 1) as Lane
      } else if (targetLane < currentChaser) {
        nextLane = (currentChaser - 1) as Lane
      }

      chaserLaneRef.current = nextLane
      setChaserLane(nextLane)

      if (Math.abs(nextLane - targetLane) <= 1) {
        setNearMiss(true)

        if (nearMissTimerRef.current) {
          window.clearTimeout(nearMissTimerRef.current)
        }

        nearMissTimerRef.current = window.setTimeout(() => {
          setNearMiss(false)
        }, 180)
      }
    }, 520)

    const frameTimer = window.setInterval(() => {
      setIsAltChaserFrame((current) => !current)
      setIsAltRunnerFrame((current) => !current)
    }, 500)

    const finaleTimer = window.setTimeout(() => {
      setStage('finale')
    }, 20000)

    return () => {
      window.clearTimeout(finaleTimer)
      window.clearInterval(tickTimer)
      window.clearInterval(frameTimer)
      window.clearInterval(runnerTimer)
      window.clearInterval(chaserTimer)

      if (runnerMoveTimerRef.current) {
        window.clearTimeout(runnerMoveTimerRef.current)
      }

      if (nearMissTimerRef.current) {
        window.clearTimeout(nearMissTimerRef.current)
      }
    }
  }, [stage])

  const chaserLeft = stage === 'finale' ? 50 : lanePositions[chaserLane] - 6
  const runnerLeft = stage === 'finale' ? 57 : lanePositions[runnerLane] + 6

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
            <p className="unlock-subtitle">Tonight&apos;s secret birthday show</p>
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
          className={`chase-scene temple-run scene-${sceneIndex} ${
            nearMiss ? 'near-miss' : ''
          }`}
          aria-label="Birthday chase scene"
        >
          <div className="scene-wash" aria-hidden="true" />
          <div className="stage-road" aria-hidden="true" />
          <div className="lane-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          {stage === 'chase' ? (
            <div className="countdown-chip" role="status">
              Catch in {secondsLeft}s
            </div>
          ) : null}

          {stage === 'chase' ? (
            <div className="dodge-chip" role="status">
              Dodges {dodgeCount}
            </div>
          ) : null}

          <div className="joy-banner" aria-hidden="true">
            temple love run
          </div>

          <div className="speed-lines" aria-hidden="true">
            {speedLines.map((line) => (
              <span key={line} style={{ '--line': line } as CSSProperties} />
            ))}
          </div>

          <div className="coin-rush" aria-hidden="true">
            {coinRush.map((coin) => (
              <span key={coin} style={{ '--coin': coin } as CSSProperties} />
            ))}
          </div>

          <div className="speech speech-chaser">
            <span>Happy birthday beb!</span>
          </div>

          <div className="speech speech-runner">
            <span>Aaaah, she is too cute!</span>
          </div>

          <div className="character character-chaser" style={{ left: `${chaserLeft}%` }}>
            <div className="photo-wrap chaser-photo">
              <img
                src={isAltChaserFrame ? '/birthday/image3.png' : '/birthday/image1.jpg'}
                alt="Image 1 sending birthday kisses"
              />
              <span className="smile-mouth" aria-hidden="true" />
              <span className="smile-teeth" aria-hidden="true" />
              <span className="kiss-mouth" aria-hidden="true" />
              <span className="heart heart-one" aria-hidden="true" />
              <span className="heart heart-two" aria-hidden="true" />
              <span className="heart heart-three" aria-hidden="true" />
            </div>
          </div>

          <div
            className={`character character-runner runner-${runnerMove}`}
            style={{ left: `${runnerLeft}%` }}
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
