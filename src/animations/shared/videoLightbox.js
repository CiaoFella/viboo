
// Configuration constants
const CONFIG = {
  HOVER_HIDE_DELAY: 3000,
  SEEK_THROTTLE: 180,
}

// Global state
let lightboxManagers = new Map()
let globalControlsInitialized = false

// Video Lightbox Manager Class
class VideoLightboxManager {
  constructor(root) {
    this.root = root
    this.elements = this.cacheElements()
    this.config = this.getConfig()
    this.state = this.initializeState()

    this.setup()
  }

  cacheElements() {
    const wrapper = this.root.closest('[data-bunny-lightbox-status]')
    const video = this.root.querySelector('video')

    return {
      wrapper,
      video,
      timeline: this.root.querySelector('[data-player-timeline]'),
      progressBar: this.root.querySelector('[data-player-progress]'),
      bufferedBar: this.root.querySelector('[data-player-buffered]'),
      handle: this.root.querySelector('[data-player-timeline-handle]'),
      timeDurationEls: Array.from(this.root.querySelectorAll('[data-player-time-duration]')),
      timeProgressEls: Array.from(this.root.querySelectorAll('[data-player-time-progress]')),
      placeholderImg: this.root.querySelector('[data-bunny-lightbox-placeholder]'),
      calcBox: wrapper?.querySelector('[data-bunny-lightbox-calc-height]'),
    }
  }

  getConfig() {
    return {
      updateSize: this.root.getAttribute('data-player-update-size'),
      autoplay: this.root.getAttribute('data-player-autoplay') === 'true',
      initialMuted: this.root.getAttribute('data-player-muted') === 'true',
    }
  }

  initializeState() {
    return {
      isAttached: false,
      currentSrc: '',
      pendingPlay: false,
      autoStartOnReady: false,
      rafId: null,
      hoverTimer: null,
      trackingMove: false,
      dragging: false,
      wasPlaying: false,
      targetTime: 0,
      lastSeekTs: 0,
      rect: null,
    }
  }

  setup() {
    this.cleanup()
    this.setupVideo()
    this.setupLightboxClamp()
    this.setupEventListeners()
    this.setupControls()
    this.setupScrubbing()
    this.setupHoverDetection()
  }

  cleanup() {
    if (this.state.rafId) {
      cancelAnimationFrame(this.state.rafId)
      this.state.rafId = null
    }
    if (this.state.hoverTimer) {
      clearTimeout(this.state.hoverTimer)
      this.state.hoverTimer = null
    }
    if (this.root._hls) {
      try {
        this.root._hls.destroy()
      } catch (_) {}
      this.root._hls = null
    }
  }

  setupVideo() {
    const { video } = this.elements

    video.loop = false
    this.setMutedState(this.config.initialMuted)
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.playsInline = true

    if (typeof video.disableRemotePlayback !== 'undefined') {
      video.disableRemotePlayback = true
    }

    if (this.config.autoplay) {
      video.autoplay = false
    }

    if (!this.root.hasAttribute('data-player-activated')) {
      this.setActivated(false)
    }
  }

  setupLightboxClamp() {
    const { wrapper, video, calcBox } = this.elements
    const { updateSize } = this.config

    if (!calcBox) return

    const getRatio = () => {
      if (updateSize === 'cover') return null

      if (updateSize === 'true') {
        if (video.videoWidth && video.videoHeight) {
          return video.videoWidth / video.videoHeight
        }
        const before = this.root.querySelector('[data-player-before]')
        if (before?.style?.paddingTop) {
          const pct = parseFloat(before.style.paddingTop)
          if (pct > 0) return 100 / pct
        }
        const r = this.root.getBoundingClientRect()
        if (r.height > 0) return r.width / r.height
        return 16/9
      }

      const beforeFalse = this.root.querySelector('[data-player-before]')
      if (beforeFalse?.style?.paddingTop) {
        const pad = parseFloat(beforeFalse.style.paddingTop)
        if (pad > 0) return 100 / pad
      }
      const rb = this.root.getBoundingClientRect()
      if (rb.height > 0) return rb.width / rb.height
      return 16/9
    }

    const applyClamp = () => {
      if (updateSize === 'cover') {
        calcBox.style.maxWidth = ''
        calcBox.style.maxHeight = ''
        return
      }

      const cs = getComputedStyle(wrapper)
      const pt = parseFloat(cs.paddingTop) || 0
      const pb = parseFloat(cs.paddingBottom) || 0
      const pl = parseFloat(cs.paddingLeft) || 0
      const pr = parseFloat(cs.paddingRight) || 0

      const cw = wrapper.clientWidth - pl - pr
      const ch = wrapper.clientHeight - pt - pb

      if (cw <= 0 || ch <= 0) return

      const ratio = getRatio()
      if (!ratio) {
        calcBox.style.maxWidth = ''
        calcBox.style.maxHeight = ''
        return
      }

      const hIfFullWidth = cw / ratio

      if (hIfFullWidth <= ch) {
        calcBox.style.maxWidth = '100%'
        calcBox.style.maxHeight = (hIfFullWidth / ch * 100) + '%'
      } else {
        calcBox.style.maxHeight = '100%'
        calcBox.style.maxWidth = ((ch * ratio) / cw * 100) + '%'
      }
    }

    let rafPending = false
    const debouncedApply = () => {
      if (rafPending) return
      if (wrapper.getAttribute('data-bunny-lightbox-status') !== 'active') return
      rafPending = true
      requestAnimationFrame(() => {
        rafPending = false
        applyClamp()
      })
    }

    const ro = new ResizeObserver(debouncedApply)
    ro.observe(wrapper)

    window.addEventListener('resize', debouncedApply)
    window.addEventListener('orientationchange', debouncedApply)

    if (updateSize === 'true') {
      video.addEventListener('loadedmetadata', debouncedApply)
      video.addEventListener('loadeddata', debouncedApply)
      video.addEventListener('playing', debouncedApply)
    }

    this.root._applyClamp = debouncedApply
    debouncedApply()
  }

  setupEventListeners() {
    const { video, timeDurationEls, timeProgressEls, bufferedBar } = this.elements

    // Media events
    video.addEventListener('play', () => {
      this.setActivated(true)
      cancelAnimationFrame(this.state.rafId)
      this.loop()
      this.setStatus('playing')
    })

    video.addEventListener('playing', () => {
      this.state.pendingPlay = false
      this.setStatus('playing')
    })

    video.addEventListener('pause', () => {
      this.state.pendingPlay = false
      cancelAnimationFrame(this.state.rafId)
      this.updateProgressVisuals()
      this.setStatus('paused')
    })

    video.addEventListener('waiting', () => {
      this.setStatus('loading')
    })

    video.addEventListener('canplay', () => {
      this.readyIfIdle(this.state.pendingPlay)
    })

    video.addEventListener('ended', () => {
      this.state.pendingPlay = false
      cancelAnimationFrame(this.state.rafId)
      this.updateProgressVisuals()
      this.setActivated(false)
      video.currentTime = 0

      // Exit fullscreen if active
      if (document.fullscreenElement || document.webkitFullscreenElement || video.webkitDisplayingFullscreen) {
        if (document.exitFullscreen) document.exitFullscreen()
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
        else if (video.webkitExitFullscreen) video.webkitExitFullscreen()
      }

      this.closeLightbox()
    })

    // Time updates
    const updateTimeTexts = () => {
      if (timeDurationEls.length) {
        this.setText(timeDurationEls, this.formatTime(video.duration))
      }
      if (timeProgressEls.length) {
        this.setText(timeProgressEls, this.formatTime(video.currentTime))
      }
    }

    video.addEventListener('timeupdate', updateTimeTexts)
    video.addEventListener('loadedmetadata', () => {
      updateTimeTexts()
      this.updateBeforeRatioIOSSafe()
    })
    video.addEventListener('loadeddata', () => {
      this.updateBeforeRatioIOSSafe()
    })
    video.addEventListener('playing', () => {
      this.updateBeforeRatioIOSSafe()
    })
    video.addEventListener('durationchange', updateTimeTexts)

    // Buffered updates
    const updateBufferedBar = () => {
      if (!bufferedBar || !video.duration || !video.buffered.length) return
      const end = video.buffered.end(video.buffered.length - 1)
      const buffPct = (end / video.duration) * 100
      bufferedBar.style.transform = `translateX(${-100 + buffPct}%)`
    }

    video.addEventListener('progress', updateBufferedBar)
    video.addEventListener('loadedmetadata', updateBufferedBar)
    video.addEventListener('durationchange', updateBufferedBar)
  }

  setupControls() {
    // Control button handling
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-player-control]')
      if (!btn || !this.root.contains(btn)) return

      const type = btn.getAttribute('data-player-control')
      if (type === 'play' || type === 'pause' || type === 'playpause') {
        this.togglePlay()
      } else if (type === 'mute') {
        this.toggleMute()
      } else if (type === 'fullscreen') {
        this.toggleFullscreen()
      }
    })

    // Fullscreen events
    document.addEventListener('fullscreenchange', () => {
      this.setFsAttr(this.isFsActive())
    })
    document.addEventListener('webkitfullscreenchange', () => {
      this.setFsAttr(this.isFsActive())
    })
    this.elements.video.addEventListener('webkitbeginfullscreen', () => {
      this.setFsAttr(true)
    })
    this.elements.video.addEventListener('webkitendfullscreen', () => {
      this.setFsAttr(false)
    })
  }

  setupScrubbing() {
    const { timeline, handle, video, progressBar, timeProgressEls } = this.elements

    if (!timeline) return

    window.addEventListener('resize', () => {
      if (!this.state.dragging) this.state.rect = null
    })

    const getFractionFromX = (x) => {
      if (!this.state.rect) {
        this.state.rect = timeline.getBoundingClientRect()
      }
      let f = (x - this.state.rect.left) / this.state.rect.width
      if (f < 0) f = 0
      if (f > 1) f = 1
      return f
    }

    const previewAtFraction = (f) => {
      if (!video.duration) return
      const pct = f * 100
      if (progressBar) {
        progressBar.style.transform = `translateX(${-100 + pct}%)`
      }
      if (handle) {
        handle.style.left = pct + '%'
      }
      if (timeProgressEls.length) {
        this.setText(timeProgressEls, this.formatTime(f * video.duration))
      }
    }

    const maybeSeek = (now) => {
      if (!video.duration) return
      if ((now - this.state.lastSeekTs) < CONFIG.SEEK_THROTTLE) return
      this.state.lastSeekTs = now
      video.currentTime = this.state.targetTime
    }

    const onPointerDown = (e) => {
      if (!video.duration) return
      this.state.dragging = true
      this.state.wasPlaying = !video.paused && !video.ended
      if (this.state.wasPlaying) video.pause()

      this.root.setAttribute('data-timeline-drag', 'true')
      this.state.rect = timeline.getBoundingClientRect()

      const f = getFractionFromX(e.clientX)
      this.state.targetTime = f * video.duration
      previewAtFraction(f)
      maybeSeek(performance.now())

      if (timeline.setPointerCapture) {
        timeline.setPointerCapture(e.pointerId)
      }

      window.addEventListener('pointermove', onPointerMove, { passive: false })
      window.addEventListener('pointerup', onPointerUp, { passive: true })
      e.preventDefault()
    }

    const onPointerMove = (e) => {
      if (!this.state.dragging) return
      const f = getFractionFromX(e.clientX)
      this.state.targetTime = f * video.duration
      previewAtFraction(f)
      maybeSeek(performance.now())
      e.preventDefault()
    }

    const onPointerUp = () => {
      if (!this.state.dragging) return
      this.state.dragging = false
      this.root.setAttribute('data-timeline-drag', 'false')
      this.state.rect = null
      video.currentTime = this.state.targetTime

      if (this.state.wasPlaying) {
        this.safePlay(video)
      } else {
        this.updateProgressVisuals()
        this.updateTimeTexts()
      }

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }

    timeline.addEventListener('pointerdown', onPointerDown, { passive: false })
    if (handle) {
      handle.addEventListener('pointerdown', onPointerDown, { passive: false })
    }
  }

  setupHoverDetection() {
    const setHover = (state) => {
      if (this.root.getAttribute('data-player-hover') !== state) {
        this.root.setAttribute('data-player-hover', state)
      }
    }

    const scheduleHide = () => {
      clearTimeout(this.state.hoverTimer)
      this.state.hoverTimer = setTimeout(() => {
        setHover('idle')
      }, CONFIG.HOVER_HIDE_DELAY)
    }

    const wakeControls = () => {
      setHover('active')
      scheduleHide()
    }

    this.root.addEventListener('pointerdown', wakeControls)
    document.addEventListener('fullscreenchange', wakeControls)
    document.addEventListener('webkitfullscreenchange', wakeControls)

    const onPointerMoveGlobal = (e) => {
      const r = this.root.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        wakeControls()
      }
    }

    this.root.addEventListener('pointerenter', () => {
      wakeControls()
      if (!this.state.trackingMove) {
        this.state.trackingMove = true
        window.addEventListener('pointermove', onPointerMoveGlobal, { passive: true })
      }
    })

    this.root.addEventListener('pointerleave', () => {
      setHover('idle')
      clearTimeout(this.state.hoverTimer)
      if (this.state.trackingMove) {
        this.state.trackingMove = false
        window.removeEventListener('pointermove', onPointerMoveGlobal)
      }
    })
  }

  // Media attachment methods
  withAttach(src, onReady) {
    const { video } = this.elements
    const isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl')
    const canUseHlsJs = !!(window.Hls && window.Hls.isSupported()) && !isSafariNative

    if (isSafariNative) {
      video.preload = 'auto'
      video.src = src
      video.addEventListener('loadedmetadata', onReady, { once: true })
      return
    }

    if (canUseHlsJs) {
      const hls = new window.Hls({ maxBufferLength: 10 })
      this.root._hls = hls
      hls.attachMedia(video)
      hls.on(window.Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src)
      })
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        onReady()
      })
      hls.on(window.Hls.Events.LEVEL_LOADED, (e, data) => {
        if (data?.details && isFinite(data.details.totalduration) && this.elements.timeDurationEls.length) {
          this.setText(this.elements.timeDurationEls, this.formatTime(data.details.totalduration))
        }
      })
      return
    }

    video.preload = 'auto'
    video.src = src
    video.addEventListener('loadedmetadata', onReady, { once: true })
  }

  attachMediaFor(src) {
    if (this.state.currentSrc === src && this.state.isAttached) return

    if (this.root._hls) {
      try {
        this.root._hls.destroy()
      } catch (_) {}
      this.root._hls = null
    }

    if (this.elements.timeDurationEls.length) {
      this.setText(this.elements.timeDurationEls, '00:00')
    }

    this.state.currentSrc = src
    this.state.isAttached = true

    this.withAttach(src, () => {
      this.readyIfIdle(this.state.pendingPlay)
      this.updateBeforeRatioIOSSafe()
      if (typeof this.root._applyClamp === 'function') {
        this.root._applyClamp()
      }
      if (this.elements.timeDurationEls.length && this.elements.video.duration) {
        this.setText(this.elements.timeDurationEls, this.formatTime(this.elements.video.duration))
      }

      if (this.state.autoStartOnReady && this.elements.wrapper.getAttribute('data-bunny-lightbox-status') === 'active') {
        this.setStatus('loading')
        this.safePlay(this.elements.video)
        this.state.autoStartOnReady = false
      }
    })
  }

  // Public API methods
  openLightbox(src, placeholderUrl) {
    if (!src) return

    const activate = () => {
      this.ensureOpenUI(true)
      this.planOnOpen(src)
    }

    const { placeholderImg } = this.elements
    if (placeholderImg && placeholderUrl) {
      const needsSwap = placeholderImg.getAttribute('src') !== placeholderUrl
      if (needsSwap || !placeholderImg.complete || !placeholderImg.naturalWidth) {
        placeholderImg.onload = () => {
          placeholderImg.onload = null
          activate()
        }
        placeholderImg.onerror = () => {
          placeholderImg.onerror = null
          activate()
        }
        if (needsSwap) {
          placeholderImg.setAttribute('src', placeholderUrl)
        } else {
          placeholderImg.dispatchEvent(new Event('load'))
        }
      } else {
        activate()
      }
    } else {
      activate()
    }
  }

  closeLightbox() {
    this.ensureOpenUI(false)

    const { video } = this.elements
    let hasPlayed = false

    try {
      if (video.played && video.played.length) {
        for (let i = 0; i < video.played.length; i++) {
          if (video.played.end(i) > 0) {
            hasPlayed = true
            break
          }
        }
      } else {
        hasPlayed = video.currentTime > 0
      }
    } catch (_) {}

    try {
      if (!video.paused && !video.ended) {
        video.pause()
      }
    } catch (_) {}

    this.setActivated(false)
    this.setStatus(hasPlayed ? 'paused' : 'idle')
  }

  togglePlay() {
    const { video } = this.elements
    if (video.paused || video.ended) {
      this.state.pendingPlay = true
      this.setStatus('loading')
      this.safePlay(video)
    } else {
      video.pause()
    }
  }

  toggleMute() {
    this.setMutedState(!this.elements.video.muted)
  }

  toggleFullscreen() {
    if (this.isFsActive() || this.elements.video.webkitDisplayingFullscreen) {
      this.exitFullscreen()
    } else {
      this.enterFullscreen()
    }
  }

  // Helper methods
  ensureOpenUI(isActive) {
    const state = isActive ? 'active' : 'not-active'
    if (this.elements.wrapper.getAttribute('data-bunny-lightbox-status') !== state) {
      this.elements.wrapper.setAttribute('data-bunny-lightbox-status', state)
    }
    if (isActive && typeof this.root._applyClamp === 'function') {
      this.root._applyClamp()
    }
  }

  isSameSrc(next) {
    return this.state.currentSrc && this.state.currentSrc === next
  }

  planOnOpen(next) {
    const same = this.isSameSrc(next)
    const { video } = this.elements

    if (!same) {
      try {
        if (!video.paused && !video.ended) video.pause()
      } catch (_) {}

      if (this.root._hls) {
        try {
          this.root._hls.destroy()
        } catch (_) {}
        this.root._hls = null
      }

      this.state.isAttached = false
      this.state.currentSrc = ''

      if (this.elements.timeDurationEls.length) {
        this.setText(this.elements.timeDurationEls, '00:00')
      }

      this.setActivated(false)
      this.setStatus('idle')
      this.attachMediaFor(next)
      this.state.autoStartOnReady = !!this.config.autoplay
      this.state.pendingPlay = !!this.config.autoplay
      return
    }

    this.state.autoStartOnReady = !!this.config.autoplay
    if (this.config.autoplay) {
      this.setStatus('loading')
      this.safePlay(video)
    } else {
      try {
        if (!video.paused && !video.ended) video.pause()
      } catch (_) {}
      this.setActivated(false)
      this.setStatus('paused')
    }
  }

  updateProgressVisuals() {
    const { video, progressBar, handle } = this.elements
    if (!video.duration) return

    const playedPct = (video.currentTime / video.duration) * 100
    if (progressBar) {
      progressBar.style.transform = `translateX(${-100 + playedPct}%)`
    }
    if (handle) {
      handle.style.left = this.pctClamp(playedPct) + '%'
    }
  }

  loop() {
    this.updateProgressVisuals()
    if (!this.elements.video.paused && !this.elements.video.ended) {
      this.state.rafId = requestAnimationFrame(() => this.loop())
    }
  }

  updateTimeTexts() {
    const { video, timeDurationEls, timeProgressEls } = this.elements
    if (timeDurationEls.length) {
      this.setText(timeDurationEls, this.formatTime(video.duration))
    }
    if (timeProgressEls.length) {
      this.setText(timeProgressEls, this.formatTime(video.currentTime))
    }
  }

  updateBeforeRatioIOSSafe() {
    if (this.config.updateSize !== 'true') return

    const before = this.root.querySelector('[data-player-before]')
    if (!before) return

    const apply = (w, h) => {
      if (!w || !h) return
      before.style.paddingTop = (h / w * 100) + '%'
      if (typeof this.root._applyClamp === 'function') {
        this.root._applyClamp()
      }
    }

    const { video } = this.elements
    if (video.videoWidth && video.videoHeight) {
      apply(video.videoWidth, video.videoHeight)
      return
    }

    if (this.root._hls?.levels?.length) {
      const lvls = this.root._hls.levels
      const best = lvls.reduce((a, b) => ((b.width || 0) > (a.width || 0)) ? b : a, lvls[0])
      if (best?.width && best?.height) {
        apply(best.width, best.height)
        return
      }
    }

    requestAnimationFrame(() => {
      if (video.videoWidth && video.videoHeight) {
        apply(video.videoWidth, video.videoHeight)
        return
      }

      let master = (typeof this.state.currentSrc === 'string' && this.state.currentSrc) ? this.state.currentSrc : ''
      if (!master || master.indexOf('blob:') === 0) {
        const attrSrc = this.root.getAttribute('data-bunny-lightbox-src') || this.root.getAttribute('data-player-src') || ''
        if (attrSrc && attrSrc.indexOf('blob:') !== 0) master = attrSrc
      }
      if (!master || !/^https?:/i.test(master)) return

      fetch(master, { credentials: 'omit', cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error()
          return r.text()
        })
        .then(txt => {
          const lines = txt.split(/\r?\n/)
          let bestW = 0, bestH = 0, last = null
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
              last = line
            } else if (last && line && line[0] !== '#') {
              const m = /RESOLUTION=(\d+)x(\d+)/.exec(last)
              if (m) {
                const W = parseInt(m[1], 10)
                const H = parseInt(m[2], 10)
                if (W > bestW) {
                  bestW = W
                  bestH = H
                }
              }
              last = null
            }
          }
          if (bestW && bestH) apply(bestW, bestH)
        })
        .catch(() => {})
    })
  }

  isFsActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement)
  }

  enterFullscreen() {
    if (this.root.requestFullscreen) return this.root.requestFullscreen()
    if (this.elements.video.requestFullscreen) return this.elements.video.requestFullscreen()
    if (this.elements.video.webkitSupportsFullscreen && typeof this.elements.video.webkitEnterFullscreen === 'function') {
      return this.elements.video.webkitEnterFullscreen()
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen()
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen()
    if (this.elements.video.webkitDisplayingFullscreen && typeof this.elements.video.webkitExitFullscreen === 'function') {
      return this.elements.video.webkitExitFullscreen()
    }
  }

  setAttr(el, name, val) {
    const str = (typeof val === 'boolean') ? (val ? 'true' : 'false') : String(val)
    if (el.getAttribute(name) !== str) {
      el.setAttribute(name, str)
    }
  }

  setStatus(s) {
    this.setAttr(this.root, 'data-player-status', s)
  }

  setMutedState(v) {
    this.elements.video.muted = !!v
    this.setAttr(this.root, 'data-player-muted', this.elements.video.muted)
  }

  setFsAttr(v) {
    this.setAttr(this.root, 'data-player-fullscreen', !!v)
  }

  setActivated(v) {
    this.setAttr(this.root, 'data-player-activated', !!v)
  }

  safePlay(video) {
    const p = video.play()
    if (p && typeof p.then === 'function') {
      p.catch(() => {})
    }
  }

  readyIfIdle(pendingPlay) {
    if (!pendingPlay &&
        this.root.getAttribute('data-player-activated') !== 'true' &&
        this.root.getAttribute('data-player-status') === 'idle') {
      this.root.setAttribute('data-player-status', 'ready')
    }
  }

  pad2(n) {
    return (n < 10 ? '0' : '') + n
  }

  formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '00:00'
    const s = Math.floor(sec)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const r = s % 60
    return h > 0 ? (h + ':' + this.pad2(m) + ':' + this.pad2(r)) : (this.pad2(m) + ':' + this.pad2(r))
  }

  setText(nodes, text) {
    nodes.forEach(n => {
      n.textContent = text
    })
  }

  pctClamp(p) {
    return p < 0 ? 0 : p > 100 ? 100 : p
  }

  destroy() {
    this.cleanup()

    // Remove event listeners
    if (this.state.trackingMove) {
      window.removeEventListener('pointermove', this.onPointerMoveGlobal)
    }
  }
}

function init() {
  // Initialize global lightboxes only once (they persist across page transitions)
  initGlobalLightboxes()

  // Setup global controls if not already done
  setupGlobalControls()
}

function initGlobalLightboxes() {
  // Only look for lightbox elements outside the Barba container (global elements)
  const globalLightboxes = document.querySelectorAll('[data-bunny-lightbox-init]')

  if (globalLightboxes.length === 0) {
    console.warn('No video lightbox elements found with [data-bunny-lightbox-init]')
    return
  }

  globalLightboxes.forEach(root => {
    // Skip if already initialized (persists across page transitions)
    if (root._videoLightboxManager) {
      return
    }

    const manager = new VideoLightboxManager(root)
    lightboxManagers.set(root, manager)
    root._videoLightboxManager = manager // Store reference for cleanup
  })

}

function setupGlobalControls() {
  // Only set up global controls once
  if (globalControlsInitialized) {
    return
  }
  globalControlsInitialized = true

  // Single capture phase listener to handle everything
  document.addEventListener('click', (e) => {
    // Check if the clicked element or any parent has the lightbox control
    const clickedElement = e.target
    const openBtn = clickedElement.closest('[data-bunny-lightbox-control="open"]')

    if (openBtn) {
      // Always prevent default for links/buttons inside lightbox controls
      const isLink = clickedElement.tagName === 'A' || clickedElement.closest('a')
      const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button')

      if (isLink || isButton) {
        e.preventDefault()
      }

      // Don't stop propagation, but handle the lightbox opening here
      const src = openBtn.getAttribute('data-bunny-lightbox-src') || ''
      if (!src) {
        console.warn('No video source found on lightbox control button')
        return
      }

      const imgEl = openBtn.querySelector('[data-bunny-lightbox-placeholder]')
      const placeholderUrl = imgEl ? imgEl.getAttribute('src') : ''

      // Find the corresponding lightbox manager
      const targetId = openBtn.getAttribute('data-bunny-lightbox-target')
      let player

      if (targetId) {
        player = document.querySelector(`[data-bunny-lightbox-init][data-bunny-lightbox-id="${targetId}"]`)
      } else {
        player = document.querySelector('[data-bunny-lightbox-init]')
      }

      if (!player) {
        console.error('No video lightbox player found in the DOM')
        return
      }

      const manager = player?._videoLightboxManager
      if (manager) {
        manager.openLightbox(src, placeholderUrl)
      } else {
        console.error('Video lightbox manager not initialized on player element')
      }
      return
    }

    const closeBtn = e.target.closest('[data-bunny-lightbox-control="close"]')
    if (closeBtn) {
      e.preventDefault()
      const wrapper = closeBtn.closest('[data-bunny-lightbox-status]')
      const player = wrapper?.querySelector('[data-bunny-lightbox-init]')
      const manager = player?._videoLightboxManager
      if (manager) {
        manager.closeLightbox()
      }
      return
    }
  }, true) // Use capture phase to intercept before navigation

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close all active lightboxes
      lightboxManagers.forEach(manager => {
        if (manager.elements.wrapper?.getAttribute('data-bunny-lightbox-status') === 'active') {
          manager.closeLightbox()
        }
      })
    }
  })
}

function cleanup() {
  // Since lightboxes are global and persist across page transitions,
  // we only clean up if the element is no longer in the DOM
  lightboxManagers.forEach((manager, root) => {
    if (!document.contains(root)) {
      manager.destroy()
      delete root._videoLightboxManager
      lightboxManagers.delete(root)
    }
  })

  // Note: We don't clear all managers or reset globalControlsInitialized
  // because the lightbox persists across page transitions
}

export default {
  init,
  cleanup,
}