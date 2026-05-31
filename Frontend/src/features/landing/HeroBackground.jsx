import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { useReducedMotion } from '@/components/motion'

// Served from public/ - referenced by URL, not bundled.
const heroBg = '/hero-bg.png'

// Faint film-grain noise as an inline SVG (feTurbulence) - a tiny, tiling data
// URI. Static (no animation), so it costs nothing on scroll; it only kills
// gradient banding and adds a tactile premium texture at very low opacity.
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`

/**
 * Single, swappable home for the hero background.
 *
 * DEFAULT (built): static purple-glow image as the LCP base layer + CSS ambient
 * motion (drifting bloom, breathing side light-forms, mouse-parallax glow) and a
 * dark overlay for text contrast.
 *
 * OPTIONAL VIDEO (NOT built): a desktop-only, lazy, fade-in video is meant to
 * layer ABOVE the static image with a >=50% dark overlay, disabled under
 * reduced-motion and on mobile. It is intentionally left unbuilt - see the
 * clearly marked slot below. Dropping it in must not require touching anything
 * outside this component.
 *
 * `pointer` is an optional {x, y} pair of Framer motion values in the range
 * [-0.5, 0.5] supplied by the hero section so the bloom can lean toward the
 * cursor without this component owning the listener.
 */
export function HeroBackground({ pointer }) {
  const reduce = useReducedMotion()

  // Fallback local pointer (used if the parent doesn't pass one).
  const localX = useMotionValue(0)
  const localY = useMotionValue(0)
  const px = pointer?.x ?? localX
  const py = pointer?.y ?? localY

  const springConfig = { stiffness: 60, damping: 20, mass: 0.6 }
  const bloomX = useSpring(useTransform(px, [-0.5, 0.5], [-18, 18]), springConfig)
  const bloomY = useSpring(useTransform(py, [-0.5, 0.5], [-12, 12]), springConfig)
  // The side light-forms lean toward the cursor too, but only a few px - a
  // shallower parallax than the bloom so depth reads without distraction.
  const lightX = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), springConfig)
  const lightY = useSpring(useTransform(py, [-0.5, 0.5], [-5, 5]), springConfig)

  // Keep the fallback values neutral when reduced motion is on.
  useEffect(() => {
    if (reduce) {
      localX.set(0)
      localY.set(0)
    }
  }, [reduce, localX, localY])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-[#07060e]">
      {/* Framed "stage": a centered, max-width box that carries the IMAGE'S OWN
          aspect ratio (1587x991) and is anchored to the top. Because the box
          matches the asset's proportions, object-cover does essentially no
          cropping, so the two side light-forms always stay visible, symmetric,
          and near the content instead of being cropped away (which left a dark
          dead-zone in the middle). On ultra-wide viewports the box caps out and
          the dark base color (#07060e) fills the margins; on narrower screens it
          shrinks to full width and the proportions are preserved. */}
      <div className="absolute inset-x-0 top-0 mx-auto aspect-[1587/991] w-full max-w-[1500px]">
        {/* Clipped, gently rounded frame for the image so the glow frames the
            content like the reference. Kept separate from the blooms below so
            their soft glow can still bleed past the frame's edges. */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem]">
          {/* Base layer - static image, the LCP element. object-center keeps the
              dark upper-center behind the headline and the bright lower glow
              behind the dashboard preview, matching the reference balance. */}
          <img
            src={heroBg}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Blend the image's vertical edges into the base color so the framed
              stage seams seamlessly into the dark margins on wide screens. */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#07060e] to-transparent" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#07060e] to-transparent" />
        </div>

        {/* Drifting purple bloom (bottom-center of the stage, behind the
            dashboard preview), leans toward the cursor. Outer element owns the
            mouse-parallax transform; the inner element owns the slow CSS drift
            so the two transforms never collide. */}
        <motion.div
          style={reduce ? undefined : { x: bloomX, y: bloomY }}
          className="absolute bottom-[-10%] left-1/2 h-[50%] w-[60%] -translate-x-1/2"
        >
          <div
            className={
              'h-full w-full rounded-[50%] bg-brand-violet/30 blur-[120px] ' +
              (reduce ? '' : 'animate-hero-bloom')
            }
          />
        </motion.div>

        {/* Two side light-forms breathing in opacity (~5s loop, offset), aligned
            with the asset's glow so they reinforce (not fight) the framed
            composition. They live on the aspect-ratio stage, so they track the
            image's side forms at every width, and they lean a few px toward the
            cursor. The CSS breathe drives opacity only; the motion transform
            drives translate - the two never collide. */}
        <motion.div
          style={reduce ? undefined : { x: lightX, y: lightY }}
          className={
            'absolute left-[10%] top-[15%] h-[70%] w-1/6 rounded-full bg-brand-indigo/20 blur-[100px] ' +
            (reduce ? '' : 'animate-hero-breathe')
          }
        />
        <motion.div
          style={reduce ? undefined : { x: lightX, y: lightY }}
          className={
            'absolute right-[10%] top-[15%] h-[70%] w-1/6 rounded-full bg-brand-bloom/20 blur-[100px] ' +
            (reduce ? '' : 'animate-hero-breathe-delayed')
          }
        />
      </div>

      {/*
        ===== OPTIONAL VIDEO SLOT (intentionally NOT built) =====
        To enable later, render a desktop-only, lazy <video> here, ABOVE the
        image and below the overlay, fading in once `canplay` fires:

          {!reduce && isDesktop && (
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
              autoPlay muted loop playsInline preload="none"
              onCanPlay={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <source src="/hero.webm" type="video/webm" />
            </video>
          )}

        Keep the >=50% overlay below for contrast. Nothing outside this file
        should need to change to add or remove the video.
        ========================================================
      */}

      {/* Dark overlay - guarantees contrast for navbar, headline, CTAs while
          still letting the asset's indigo/violet glow read through. */}
      <div className="absolute inset-0 bg-[#07060e]/40" />

      {/* Top vignette: keeps the navbar + headline legible over the dark center. */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#07060e]/85 via-[#07060e]/40 to-transparent" />
      {/* Bottom fade into the page background for a seamless section join. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-background" />

      {/* Subtle film-grain on top of everything - static, very low opacity,
          soft-light blend so it textures without lightening. Kills gradient
          banding in the dark areas and adds a tactile premium feel. */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }}
      />
    </div>
  )
}
