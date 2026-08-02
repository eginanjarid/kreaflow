'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; -webkit-font-smoothing: antialiased; }

  .lp-nav { background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; z-index: 100; }
  .lp-nav-inner { max-width: 1160px; margin: 0 auto; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .lp-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
  .lp-logo-mark { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg,#1a73e8,#42a5f5); display: flex; align-items: center; justify-content: center; }
  .lp-logo-name { font-size: 1.05rem; font-weight: 800; letter-spacing: -0.3px; color: #0f172a; }
  .lp-nav-links { display: flex; align-items: center; gap: 4px; }
  .lp-nav-link { padding: 6px 14px; border-radius: 7px; font-size: 0.875rem; color: #64748b; text-decoration: none; font-weight: 500; transition: background 0.15s, color 0.15s; }
  .lp-nav-link:hover { background: #f8fafc; color: #0f172a; }
  .lp-nav-right { display: flex; align-items: center; gap: 10px; }
  .lp-nav-login { padding: 8px 16px; font-size: 0.875rem; font-weight: 500; color: #64748b; text-decoration: none; }
  .lp-nav-cta { padding: 9px 20px; border-radius: 8px; background: #1a73e8; color: #fff; font-size: 0.875rem; font-weight: 700; text-decoration: none; transition: background 0.15s, box-shadow 0.15s; display: inline-block; white-space: nowrap; }
  .lp-nav-cta:hover { background: #1557b0; box-shadow: 0 4px 16px rgba(26,115,232,0.35); }

  @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.08)} 66%{transform:translate(-20px,20px) scale(0.95)} }
  @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1.05)} 33%{transform:translate(-50px,30px) scale(0.92)} 66%{transform:translate(30px,-20px) scale(1.1)} }
  @keyframes blob3 { 0%,100%{transform:translate(0,0) scale(0.95)} 50%{transform:translate(30px,40px) scale(1.05)} }
  @keyframes float1 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
  @keyframes float2 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
  @keyframes float3 { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-10px)} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes badgePop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(26,115,232,0.4)} 50%{box-shadow:0 0 0 12px rgba(26,115,232,0)} }

  .lp-hero-wrap { background: #eef3ff; position: relative; overflow: hidden; }
  .lp-aurora { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .lp-aurora-blob { position: absolute; border-radius: 50%; filter: blur(72px); }
  .lp-aurora-b1 { width: 560px; height: 560px; top: -180px; left: 50%; margin-left: -320px; background: radial-gradient(circle, rgba(26,115,232,0.22) 0%, transparent 70%); animation: blob1 9s ease-in-out infinite; }
  .lp-aurora-b2 { width: 420px; height: 420px; top: 0; right: -80px; background: radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%); animation: blob2 11s ease-in-out infinite; }
  .lp-aurora-b3 { width: 380px; height: 380px; bottom: -60px; left: -60px; background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%); animation: blob3 8s ease-in-out infinite; }
  .lp-hero { max-width: 1160px; margin: 0 auto; padding: 80px 28px 0; text-align: center; position: relative; z-index: 1; }
  .lp-hero-social { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 24px; font-size: 0.82rem; color: #64748b; font-weight: 500; animation: fadeUp 0.7s ease both; animation-delay: 0.1s; }
  .lp-avatars { display: flex; }
  .lp-avatar { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #eef3ff; margin-left: -8px; overflow: hidden; object-fit: cover; display: block; }
  .lp-avatar:first-child { margin-left: 0; }
  .lp-avatar-cta { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #1557b0; margin-left: -8px; overflow: hidden; object-fit: cover; display: block; }
  .lp-avatar-cta:first-child { margin-left: 0; }

  .lp-hero-h1-static { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 900; line-height: 1.1; letter-spacing: -2px; color: #0f172a; animation: fadeUp 0.7s ease both; animation-delay: 0.2s; }
  .lp-hero-h1-animated { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 900; line-height: 1.1; letter-spacing: -2px; margin-bottom: 18px; animation: fadeUp 0.7s ease both; animation-delay: 0.3s; min-height: 1.2em; }
  .lp-typing-text { background: linear-gradient(135deg, #1a73e8, #7c3aed, #0891b2); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s ease infinite; }
  .lp-cursor { display: inline-block; width: 3px; height: 0.85em; background: #1a73e8; vertical-align: middle; margin-left: 2px; border-radius: 2px; animation: blink 1s step-end infinite; }

  .lp-hero-sub { font-size: 1rem; color: #64748b; max-width: 480px; margin: 0 auto 36px; line-height: 1.7; animation: fadeUp 0.7s ease both; animation-delay: 0.4s; }
  .lp-hero-ctas { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 60px; animation: fadeUp 0.7s ease both; animation-delay: 0.5s; }
  .lp-btn-blue { padding: 13px 28px; border-radius: 9px; background: #1a73e8; color: #fff; font-size: 0.9rem; font-weight: 700; text-decoration: none; display: inline-block; transition: background 0.15s, box-shadow 0.15s, transform 0.15s; animation: pulseGlow 2.5s ease-in-out 1.5s 3; }
  .lp-btn-blue:hover { background: #1557b0; box-shadow: 0 8px 24px rgba(26,115,232,0.4); transform: translateY(-1px); }
  .lp-btn-outline { padding: 12px 24px; border-radius: 8px; border: 1.5px solid #e2e8f0; color: #374151; font-size: 0.9rem; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; background: #fff; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
  .lp-btn-outline:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }

  .lp-hero-mockup-wrap { position: relative; max-width: 860px; margin: 0 auto; animation: fadeUp 0.9s ease both; animation-delay: 0.6s; }
  .lp-hero-float { position: absolute; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(15,23,42,0.12); padding: 10px 14px; z-index: 10; }
  .lp-hero-float-1 { left: -20px; top: 40px; display: flex; flex-direction: column; gap: 2px; min-width: 130px; animation: float1 4s ease-in-out infinite; }
  .lp-hero-float-2 { right: -20px; top: 80px; display: flex; align-items: center; gap: 8px; animation: float2 5s ease-in-out infinite; }
  .lp-hero-float-3 { left: 20px; bottom: 60px; display: flex; align-items: center; gap: 8px; animation: float3 3.5s ease-in-out infinite; }
  .lp-float-label { font-size: 0.62rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .lp-float-value { font-size: 0.9rem; font-weight: 800; color: #1a73e8; }
  .lp-float-dot { width: 8px; height: 8px; border-radius: 50%; }
  .lp-float-text { font-size: 0.78rem; font-weight: 600; color: #0f172a; }
  .lp-mockup { border-radius: 16px 16px 0 0; border: 1px solid #e2e8f0; border-bottom: none; overflow: hidden; box-shadow: 0 -4px 40px rgba(15,23,42,0.1); background: #fff; }
  .lp-mockup-bar { background: #f8fafc; border-bottom: 1px solid #f1f5f9; padding: 10px 16px; display: flex; align-items: center; gap: 10px; }
  .lp-mockup-dots { display: flex; gap: 5px; }
  .lp-mockup-dot { width: 9px; height: 9px; border-radius: 50%; }
  .lp-mockup-addr { flex: 1; max-width: 200px; margin: 0 auto; background: #fff; border: 1px solid #e9ecef; border-radius: 5px; height: 22px; display: flex; align-items: center; justify-content: center; gap: 4px; }
  .lp-mockup-body { display: flex; min-height: 280px; }
  .lp-mockup-sb { width: 148px; flex-shrink: 0; background: #fff; border-right: 1px solid #f1f5f9; padding: 16px 10px; }
  .lp-mockup-sb-logo { display: flex; align-items: center; gap: 6px; padding: 0 6px; margin-bottom: 16px; }
  .lp-mockup-sb-logo-mark { width: 20px; height: 20px; border-radius: 5px; background: linear-gradient(135deg,#1a73e8,#42a5f5); }
  .lp-mockup-sb-logo-name { font-size: 0.7rem; font-weight: 800; color: #0f172a; }
  .lp-mockup-sb-item { display: flex; align-items: center; gap: 7px; padding: 6px 8px; border-radius: 7px; margin-bottom: 2px; font-size: 0.72rem; color: #94a3b8; font-weight: 500; }
  .lp-mockup-sb-item.on { background: #eff6ff; color: #1a73e8; font-weight: 700; }
  .lp-mockup-sb-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; opacity: 0.5; }
  .lp-mockup-sb-item.on .lp-mockup-sb-dot { opacity: 1; }
  .lp-mockup-main { flex: 1; padding: 18px 20px; background: #f8fafc; min-width: 0; }
  .lp-mockup-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .lp-mockup-title { font-size: 0.78rem; font-weight: 800; color: #1e293b; }
  .lp-mockup-addbtn { background: #1a73e8; color: #fff; font-size: 0.62rem; font-weight: 700; border-radius: 5px; padding: 4px 10px; }
  .lp-mockup-row { background: #fff; border: 1px solid #f1f5f9; border-radius: 9px; padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
  .lp-mockup-row-title { flex: 1; font-size: 0.73rem; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lp-mockup-tag { font-size: 0.6rem; padding: 2px 7px; border-radius: 5px; font-weight: 700; white-space: nowrap; }
  .lp-mockup-plat { font-size: 0.6rem; color: #94a3b8; white-space: nowrap; }

  /* STATS */
  .lp-stats { border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; background: #fff; padding: 32px 28px; }
  .lp-stats-inner { max-width: 800px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 0; flex-wrap: wrap; }
  .lp-stat { text-align: center; padding: 8px 40px; }
  .lp-stat + .lp-stat { border-left: 1px solid #f1f5f9; }
  .lp-stat-num { font-size: 1.8rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
  .lp-stat-label { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

  /* REVEAL */
  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }

  /* BRANDBAR */
  .lp-brandbar { background: #fff; padding: 18px 28px; overflow: hidden; }
  .lp-brandbar-inner { max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
  .lp-brandbar-label { font-size: 0.75rem; color: #cbd5e1; font-weight: 600; white-space: nowrap; margin-right: 8px; }
  .lp-brandbar-item { font-size: 0.8rem; font-weight: 600; color: #94a3b8; white-space: nowrap; padding: 4px 12px; border-radius: 20px; background: #f8fafc; transition: background 0.15s, color 0.15s; }
  .lp-brandbar-item:hover { background: #eff6ff; color: #1a73e8; }

  /* PILL */
  .lp-pill { display: inline-block; background: #fff3ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 4px 14px; font-size: 0.75rem; font-weight: 700; color: #c2410c; margin-bottom: 14px; animation: badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* SECTIONS */
  .lp-sec { max-width: 1160px; margin: 0 auto; padding: 88px 28px; }
  .lp-sec-alt { background: #f8fafc; }
  .lp-sec-alt-in { max-width: 1160px; margin: 0 auto; padding: 88px 28px; }
  .lp-sec-head { text-align: center; margin-bottom: 52px; }
  .lp-h2 { font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 900; letter-spacing: -1.5px; color: #0f172a; margin-bottom: 12px; line-height: 1.15; }
  .lp-sec-sub { font-size: 0.95rem; color: #64748b; max-width: 460px; margin: 0 auto; line-height: 1.65; }

  /* PLATFORM */
  .lp-platform-card { background: linear-gradient(135deg,#1a73e8,#1557b0); border-radius: 20px; padding: 36px 36px 0; overflow: hidden; box-shadow: 0 16px 48px rgba(26,115,232,0.2); }
  .lp-platform-tabs { display: flex; gap: 0; margin-bottom: 28px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .lp-platform-tabs::-webkit-scrollbar { display: none; }
  .lp-platform-tab { padding: 8px 18px; border-radius: 7px; font-size: 0.84rem; font-weight: 600; color: rgba(255,255,255,0.45); cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; flex-shrink: 0; transition: all 0.2s; }
  .lp-platform-tab:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.08); }
  .lp-platform-tab.on { background: rgba(255,255,255,0.18); color: #fff; }
  .lp-platform-tab-desc { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; margin-bottom: 28px; }
  .lp-platform-tab-name { font-size: 0.82rem; font-weight: 700; color: #fff; margin-bottom: 5px; }
  .lp-platform-tab-text { font-size: 0.77rem; color: rgba(255,255,255,0.55); line-height: 1.55; }
  .lp-platform-screen { background: #fff; border-radius: 12px 12px 0 0; padding: 16px 20px; min-height: 140px; box-shadow: 0 -4px 24px rgba(0,0,0,0.12); }
  .lp-platform-screen-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .lp-platform-screen-title { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
  .lp-platform-screen-btn { background: #1a73e8; color: #fff; font-size: 0.6rem; font-weight: 700; border-radius: 5px; padding: 3px 9px; }

  /* FEATURES */
  .lp-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .lp-feat-card { background: #fff; border: 1.5px solid #f1f5f9; border-radius: 16px; overflow: hidden; transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s; }
  .lp-feat-card:hover { box-shadow: 0 12px 40px rgba(15,23,42,0.1); border-color: #e2e8f0; transform: translateY(-2px); }
  .lp-feat-visual { background: #f8fafc; border-bottom: 1px solid #f1f5f9; padding: 20px; min-height: 130px; display: flex; align-items: center; justify-content: center; }
  .lp-feat-body { padding: 20px 22px; }
  .lp-feat-name { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
  .lp-feat-desc { font-size: 0.84rem; color: #64748b; line-height: 1.6; }

  /* SPLIT */
  .lp-split { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
  .lp-split-pill { margin-bottom: 14px; }
  .lp-split-h2 { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 900; letter-spacing: -1px; color: #0f172a; margin-bottom: 14px; line-height: 1.2; }
  .lp-split-sub { font-size: 0.9rem; color: #64748b; line-height: 1.7; margin-bottom: 22px; }
  .lp-split-list { display: flex; flex-direction: column; gap: 10px; }
  .lp-split-item { display: flex; align-items: flex-start; gap: 10px; font-size: 0.875rem; color: #374151; }
  .lp-split-check { width: 18px; height: 18px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .lp-split-visual { background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 16px; padding: 24px; transition: box-shadow 0.2s; }
  .lp-split-visual:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.06); }

  /* TESTIMONIALS */
  .lp-testi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .lp-testi-card { background: #f1f5fb; border-radius: 14px; padding: 24px; transition: transform 0.2s, box-shadow 0.2s; }
  .lp-testi-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(15,23,42,0.08); }
  .lp-testi-quote { font-size: 1.4rem; color: #1a73e8; font-weight: 900; margin-bottom: 12px; line-height: 1; }
  .lp-testi-text { font-size: 0.875rem; color: #334155; line-height: 1.65; margin-bottom: 18px; }
  .lp-testi-author { display: flex; align-items: center; gap: 10px; }
  .lp-testi-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .lp-testi-name { font-size: 0.82rem; font-weight: 700; color: #0f172a; }
  .lp-testi-role { font-size: 0.75rem; color: #94a3b8; }

  /* PRICING */
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; max-width: 900px; margin: 0 auto; }
  .lp-price-card { background: #fff; border: 1.5px solid #e9ecef; border-radius: 18px; padding: 28px 24px; position: relative; transition: transform 0.2s, box-shadow 0.2s; }
  .lp-price-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(15,23,42,0.1); }
  .lp-price-featured { border-color: #1a73e8; box-shadow: 0 4px 24px rgba(26,115,232,0.12); }
  .lp-price-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #1a73e8; border-radius: 20px; padding: 3px 14px; font-size: 0.65rem; font-weight: 800; color: #fff; white-space: nowrap; letter-spacing: 0.05em; }
  .lp-price-tier { font-size: 0.78rem; font-weight: 700; color: #94a3b8; margin-bottom: 6px; }
  .lp-price-ws { font-size: 0.72rem; font-weight: 700; color: #1a73e8; background: #eff6ff; border-radius: 20px; padding: 2px 10px; display: inline-block; margin-bottom: 10px; }
  .lp-price-orig { font-size: 0.82rem; color: #cbd5e1; text-decoration: line-through; }
  .lp-price-num { font-size: 2rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; line-height: 1; }
  .lp-price-note { font-size: 0.75rem; color: #94a3b8; margin: 6px 0 18px; }
  .lp-price-cta { display: block; text-align: center; padding: 11px; border-radius: 9px; font-size: 0.85rem; font-weight: 700; text-decoration: none; margin-bottom: 18px; transition: all 0.15s; }
  .lp-price-cta-solid { background: #1a73e8; color: #fff; }
  .lp-price-cta-solid:hover { background: #1557b0; box-shadow: 0 6px 20px rgba(26,115,232,0.35); }
  .lp-price-cta-ghost { border: 1.5px solid #e5eaf2; color: #374151; }
  .lp-price-cta-ghost:hover { border-color: #1a73e8; color: #1a73e8; }
  .lp-price-divider { height: 1px; background: #f1f5f9; margin-bottom: 16px; }
  .lp-price-feats { display: flex; flex-direction: column; gap: 8px; }
  .lp-price-feat { display: flex; gap: 8px; align-items: flex-start; font-size: 0.82rem; color: #374151; }
  .lp-price-check { font-size: 0.75rem; flex-shrink: 0; margin-top: 1px; }
  .lp-pricing-note { text-align: center; margin-top: 16px; font-size: 0.78rem; color: #cbd5e1; }
  .lp-pricing-addon { max-width: 900px; margin: 16px auto 0; background: #f8fafc; border: 1px solid #e5eaf2; border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

  /* FAQ */
  .lp-faq { display: flex; flex-direction: column; gap: 0; max-width: 680px; margin: 0 auto; border: 1.5px solid #f1f5f9; border-radius: 14px; overflow: hidden; }
  .lp-faq-item { border-bottom: 1px solid #f1f5f9; }
  .lp-faq-item:last-child { border-bottom: none; }
  .lp-faq-q { padding: 18px 22px; font-size: 0.9rem; font-weight: 600; color: #0f172a; display: flex; justify-content: space-between; align-items: center; gap: 12px; cursor: pointer; list-style: none; user-select: none; }
  .lp-faq-q::-webkit-details-marker { display: none; }
  .lp-faq-q::after { content: '+'; font-size: 1.1rem; color: #94a3b8; font-weight: 400; flex-shrink: 0; line-height: 1; }
  .lp-faq-item[open] .lp-faq-q::after { content: '×'; }
  .lp-faq-a { padding: 0 22px 18px; font-size: 0.84rem; color: #64748b; line-height: 1.7; }

  /* CTA BLOCK */
  .lp-cta-block-wrap { max-width: 1160px; margin: 0 auto; padding: 0 28px 88px; }
  .lp-cta-block { background: linear-gradient(135deg,#1a73e8,#1557b0); border-radius: 24px; padding: 64px 48px; display: flex; align-items: center; justify-content: space-between; gap: 40px; position: relative; overflow: hidden; }
  .lp-cta-block::before { content: ''; position: absolute; right: -60px; top: -60px; width: 280px; height: 280px; border-radius: 50%; background: rgba(255,255,255,0.06); pointer-events: none; }
  .lp-cta-block::after { content: ''; position: absolute; right: 80px; bottom: -80px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.04); pointer-events: none; }
  .lp-cta-block-left { position: relative; z-index: 1; }
  .lp-cta-block-social { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .lp-cta-block-h2 { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 900; letter-spacing: -1px; color: #fff; line-height: 1.2; }
  .lp-cta-block-sub { font-size: 0.88rem; color: rgba(255,255,255,0.65); margin-top: 10px; }
  .lp-cta-block-right { position: relative; z-index: 1; flex-shrink: 0; }
  .lp-btn-white { padding: 13px 28px; border-radius: 9px; background: #fff; color: #1a73e8; font-size: 0.9rem; font-weight: 700; text-decoration: none; display: inline-block; transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s; white-space: nowrap; }
  .lp-btn-white:hover { opacity: 0.95; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }

  /* FOOTER */
  .lp-footer { border-top: 1px solid #f1f5f9; padding: 48px 28px 32px; }
  .lp-footer-inner { max-width: 1160px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .lp-footer-brand-desc { font-size: 0.82rem; color: #94a3b8; line-height: 1.6; margin-top: 10px; max-width: 200px; }
  .lp-footer-col-title { font-size: 0.78rem; font-weight: 800; color: #374151; margin-bottom: 14px; letter-spacing: 0.02em; }
  .lp-footer-links { display: flex; flex-direction: column; gap: 8px; }
  .lp-footer-link { font-size: 0.82rem; color: #94a3b8; text-decoration: none; transition: color 0.15s; }
  .lp-footer-link:hover { color: #374151; }
  .lp-footer-bottom { border-top: 1px solid #f1f5f9; padding-top: 24px; max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .lp-footer-copy { font-size: 0.78rem; color: #cbd5e1; }

  @media (max-width: 900px) {
    .lp-nav-links { display: none; }
    .lp-hero-float-1, .lp-hero-float-2, .lp-hero-float-3 { display: none; }
    .lp-platform-tab-desc { grid-template-columns: 1fr 1fr; }
    .lp-feat-grid { grid-template-columns: 1fr; }
    .lp-split { grid-template-columns: 1fr; gap: 32px; }
    .lp-testi-grid { grid-template-columns: 1fr; }
    .lp-pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
    .lp-cta-block { flex-direction: column; text-align: center; padding: 48px 28px; }
    .lp-footer-inner { grid-template-columns: 1fr 1fr 1fr; }
    .lp-stats-inner { gap: 0; }
    .lp-stat { padding: 8px 20px; }
  }
  @media (max-width: 640px) {
    .lp-hero { padding: 56px 20px 0; }
    .lp-hero-h1-static, .lp-hero-h1-animated { letter-spacing: -1.5px; }
    .lp-sec { padding: 64px 20px; }
    .lp-sec-alt-in { padding: 64px 20px; }
    .lp-platform-card { padding: 24px 20px 0; border-radius: 16px; }
    .lp-platform-tab { padding: 7px 14px; font-size: 0.78rem; }
    .lp-platform-tab-desc { grid-template-columns: 1fr; }
    .lp-mockup-sb { display: none; }
    .lp-nav-login { display: none; }
    .lp-nav-cta { padding: 8px 14px; font-size: 0.8rem; }
    .lp-footer-inner { grid-template-columns: 1fr 1fr; }
    .lp-cta-block-wrap { padding: 0 20px 64px; }
    .lp-stat { padding: 8px 14px; }
    .lp-stat-num { font-size: 1.4rem; }
  }
  @media (max-width: 400px) {
    .lp-footer-inner { grid-template-columns: 1fr; }
  }
`

const TYPING_PHRASES = [
  'dalam satu platform.',
  'untuk kreator Indonesia.',
  'dari ide sampai live.',
  'tanpa tools berserakan.',
]

const PLATFORM_TABS = [
  {
    label: 'Brand & Catalog',
    items: [
      { name: 'Brand', text: 'Identitas, niche, content pillars, dan tone of voice di satu tempat.' },
      { name: 'Catalog', text: 'Database produk affiliate dan produk sendiri lengkap dengan komisi.' },
      { name: 'Niche Hunt', text: 'AI bantu temukan niche yang sesuai passion, skill, dan peluang pasar.' },
      { name: 'Bio Studio', text: 'Generate bio sosmed yang menarik dan sesuai brand identity kamu.' },
    ],
    screenTitle: 'Brand: Identitas & Content Pillars',
    screenData: [{ label: 'Niche', val: 'Skincare & Beauty' }, { label: 'Platform Utama', val: 'TikTok · Instagram' }, { label: 'Tone of Voice', val: 'Friendly & Honest' }],
  },
  {
    label: 'Sprint & Plan',
    items: [
      { name: 'Sprint', text: 'Kanban board untuk manajemen produksi konten dari awal sampai selesai.' },
      { name: 'Plan', text: 'Buat naskah dan script konten terstruktur per platform dengan bantuan AI.' },
      { name: 'AI Writer', text: 'Generate script TikTok, caption Instagram, dan hook yang convert.' },
      { name: 'Task Board', text: 'Assign tugas ke anggota tim dan pantau progres secara real-time.' },
    ],
    screenTitle: 'Sprint: Produksi Konten Aktif',
    screenData: [{ label: 'Plan', val: '3 konten' }, { label: 'Proses', val: '5 konten' }, { label: 'Selesai', val: '12 konten' }],
  },
  {
    label: 'Library & Studio',
    items: [
      { name: 'Library', text: 'Bank konten semua naskah, script, dan ide yang sudah dibuat.' },
      { name: 'Studio', text: 'Preview format visual untuk TikTok, Instagram Reels, dan YouTube Shorts.' },
      { name: 'Archive', text: 'Cari konten lama dengan filter platform, status, dan tanggal.' },
      { name: 'Template', text: 'Simpan format script favorit sebagai template untuk dipakai ulang.' },
    ],
    screenTitle: 'Library: Bank Konten',
    screenData: [{ label: 'Total Konten', val: '47 naskah' }, { label: 'Naskah Siap', val: '12 siap' }, { label: 'Platform', val: 'TikTok · IG' }],
  },
  {
    label: 'Tracker & Insights',
    items: [
      { name: 'Tracker', text: 'Input performa konten per platform dan pantau tren views, likes, reach.' },
      { name: 'Insights', text: 'Dashboard analitik dengan grafik performa bulanan per platform.' },
      { name: 'Budget', text: 'Catat semua pemasukan dan pengeluaran terkait produksi konten.' },
      { name: 'Calendar', text: 'Jadwalkan konten secara visual dan atur antrian posting per hari.' },
    ],
    screenTitle: 'Tracker: Performa Platform',
    screenData: [{ label: 'TikTok', val: '124K views' }, { label: 'Instagram', val: '38K reach' }, { label: 'Growth', val: '+18% MoM' }],
  },
]

const TIERS = [
  { id: 'starter', name: 'Starter', price: 'Rp99.000', maxWs: '1 Workspace', highlight: false, badge: null, features: ['1 Workspace / Brand', '1 owner + 3 anggota tim', 'Semua 10 modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'] },
  { id: 'pro', name: 'Pro', price: 'Rp199.000', oldPrice: 'Rp399.000', maxWs: '3 Workspace', highlight: true, badge: 'PALING POPULER', features: ['3 Workspace / Brand', '1 owner + 5 anggota tim', 'Semua 10 modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'] },
  { id: 'agency', name: 'Agency', price: 'Rp399.000', maxWs: '10 Workspace', highlight: false, badge: null, features: ['10 Workspace / Brand', '1 owner + 10 anggota tim', 'Semua 10 modul lengkap', 'Unlimited konten & jadwal', 'Update fitur selamanya'] },
]

const FAQS = [
  { q: 'Apa itu KreaFlow?', a: 'KreaFlow adalah platform manajemen konten end-to-end untuk content creator dan affiliator Indonesia. Mulai dari membangun brand, menyusun konten, menjadwalkan, hingga memantau performa, semua dalam satu platform.' },
  { q: 'Apa perbedaan Starter, Pro, dan Agency?', a: 'Perbedaan utamanya ada di jumlah workspace dan anggota tim. Starter cocok untuk 1 brand, Pro untuk yang punya 3 brand/klien, Agency untuk agensi dengan banyak brand. Semua paket dapat akses ke semua modul.' },
  { q: 'Apakah lifetime deal benar-benar seumur hidup?', a: 'Ya. Bayar sekali, pakai selamanya. Termasuk semua update fitur ke depan tanpa biaya tambahan. Harga ini hanya tersedia selama masa launch.' },
  { q: 'Bisa tambah workspace setelah beli?', a: 'Bisa. Tersedia add-on +1 workspace seharga Rp69.000 (sekali bayar, lifetime). Atau upgrade ke paket lebih tinggi untuk dapat lebih banyak workspace sekaligus.' },
  { q: 'Apakah ada fitur auto-posting ke sosial media?', a: 'Fitur Auto Schedule Post sedang dalam pengembangan dan akan segera hadir sebagai add-on Rp49.000/bulan. Untuk saat ini, Calendar bisa digunakan untuk merencanakan jadwal posting secara manual.' },
]

export default function LandingContent() {
  const [phrase, setPhrase] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [typing, setTyping] = useState(true)
  const [charIdx, setCharIdx] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const revealRef = useRef<HTMLDivElement>(null)

  // Typewriter effect
  useEffect(() => {
    const current = TYPING_PHRASES[phraseIdx]
    if (typing) {
      if (charIdx < current.length) {
        const t = setTimeout(() => {
          setPhrase(current.slice(0, charIdx + 1))
          setCharIdx(c => c + 1)
        }, charIdx === 0 ? 400 : 65)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setTyping(false), 2200)
        return () => clearTimeout(t)
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => {
          setPhrase(current.slice(0, charIdx - 1))
          setCharIdx(c => c - 1)
        }, 30)
        return () => clearTimeout(t)
      } else {
        setPhraseIdx(i => (i + 1) % TYPING_PHRASES.length)
        setTyping(true)
      }
    }
  }, [charIdx, typing, phraseIdx])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const tab = PLATFORM_TABS[activeTab]

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo">
            <div className="lp-logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="lp-logo-name">KreaFlow</span>
          </Link>
          <div className="lp-nav-links">
            {['Fitur','Harga','Tentang'].map(l => <a key={l} href={`#${l.toLowerCase()}`} className="lp-nav-link">{l}</a>)}
          </div>
          <div className="lp-nav-right">
            <Link href="/login" className="lp-nav-login">Masuk</Link>
            <Link href="/register" className="lp-nav-cta">Mulai Sekarang</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="lp-hero-wrap">
        <div className="lp-aurora" aria-hidden="true">
          <div className="lp-aurora-blob lp-aurora-b1" />
          <div className="lp-aurora-blob lp-aurora-b2" />
          <div className="lp-aurora-blob lp-aurora-b3" />
        </div>
        <div className="lp-hero">
          <div className="lp-hero-social">
            <div className="lp-avatars">
              {[47,53,58,62,65].map(n => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={n} className="lp-avatar" src={`https://i.pravatar.cc/60?img=${n}`} alt="" />
              ))}
            </div>
            Dibuat untuk creator &amp; affiliator Indonesia
          </div>

          <div className="lp-hero-h1-static">Workflow konten dari ide</div>
          <div className="lp-hero-h1-static" style={{ marginBottom: 4 }}>sampai publikasi</div>
          <div className="lp-hero-h1-animated">
            <span className="lp-typing-text">{phrase}</span>
            <span className="lp-cursor" />
          </div>

          <p className="lp-hero-sub">
            Brand, konten, jadwal, dan performa terhubung dalam satu alur kerja. Tidak perlu pindah-pindah tools lagi.
          </p>
          <div className="lp-hero-ctas">
            <Link href="#harga" className="lp-btn-blue">Lihat Harga →</Link>
            <Link href="/login" className="lp-btn-outline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#e2e8f0"/><polygon points="10,8 16,12 10,16" fill="#374151"/></svg>
              Sudah punya akun
            </Link>
          </div>

          <div className="lp-hero-mockup-wrap">
            <div className="lp-hero-float lp-hero-float-1">
              <span className="lp-float-label">Sprint aktif</span>
              <span className="lp-float-value">3 konten</span>
            </div>
            <div className="lp-hero-float lp-hero-float-2">
              <div className="lp-float-dot" style={{ background: '#22c55e' }} />
              <span className="lp-float-text">Library: 12 siap</span>
            </div>
            <div className="lp-hero-float lp-hero-float-3">
              <div className="lp-float-dot" style={{ background: '#1a73e8' }} />
              <span className="lp-float-text">Jadwal hari ini: 2</span>
            </div>
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <div className="lp-mockup-dots">
                  {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} className="lp-mockup-dot" style={{ background: c }} />)}
                </div>
                <div className="lp-mockup-addr">
                  <span style={{ color: '#94a3b8' }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>kreaflow.id/library</span>
                </div>
              </div>
              <div className="lp-mockup-body">
                <div className="lp-mockup-sb">
                  <div className="lp-mockup-sb-logo">
                    <div className="lp-mockup-sb-logo-mark" />
                    <span className="lp-mockup-sb-logo-name">KreaFlow</span>
                  </div>
                  {[['Brand',false],['Catalog',false],['Sprint',false],['Plan',false],['Library',true],['Studio',false],['Calendar',false],['Tracker',false]].map(([n,on]) => (
                    <div key={String(n)} className={`lp-mockup-sb-item${on?' on':''}`}>
                      <div className="lp-mockup-sb-dot" />{String(n)}
                    </div>
                  ))}
                </div>
                <div className="lp-mockup-main">
                  <div className="lp-mockup-head">
                    <span className="lp-mockup-title">Library: Bank Konten</span>
                    <div className="lp-mockup-addbtn">+ Tambah</div>
                  </div>
                  {[
                    { t:'5 Hook TikTok untuk Produk Skincare', s:'Siap', sc:'#15803d', sb:'#f0fdf4', p:'TikTok' },
                    { t:'Review Jujur Serum Vitamin C, Naskah', s:'Draft', sc:'#92400e', sb:'#fffbeb', p:'Instagram' },
                    { t:'Cara Dapat Komisi Affiliate Tanpa Modal', s:'Selesai', sc:'#1d4ed8', sb:'#eff6ff', p:'YouTube' },
                    { t:'Unboxing Produk Baru GRWM Version', s:'Draft', sc:'#92400e', sb:'#fffbeb', p:'TikTok' },
                  ].map((r,i) => (
                    <div key={i} className="lp-mockup-row">
                      <div className="lp-mockup-row-title">{r.t}</div>
                      <span className="lp-mockup-tag" style={{ color:r.sc, background:r.sb }}>{r.s}</span>
                      <span className="lp-mockup-plat">{r.p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="lp-stats reveal">
        <div className="lp-stats-inner">
          {[
            { num: '10', label: 'Modul terintegrasi' },
            { num: '3', label: 'Tipe brand workspace' },
            { num: '6', label: 'Platform sosmed' },
            { num: '1x', label: 'Bayar, lifetime akses' },
          ].map((s, i) => (
            <div key={i} className="lp-stat">
              <div className="lp-stat-num">{s.num}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BRANDBAR */}
      <div className="lp-brandbar">
        <div className="lp-brandbar-inner">
          <span className="lp-brandbar-label">Cocok untuk</span>
          {['TikTok Creator','Affiliator Shopee','Instagram Creator','YouTube Creator','Brand Lokal','SMM Agency'].map(b => (
            <span key={b} className="lp-brandbar-item">{b}</span>
          ))}
        </div>
      </div>

      {/* PLATFORM */}
      <section className="lp-sec" id="fitur">
        <div className="lp-sec-head reveal">
          <div className="lp-pill">Platform KreaFlow</div>
          <h2 className="lp-h2">Workflow end-to-end<br />dalam satu platform</h2>
          <p className="lp-sec-sub">Setiap modul terhubung dan saling mendukung, dari membangun brand hingga evaluasi performa konten.</p>
        </div>
        <div className="lp-platform-card reveal">
          <div className="lp-platform-tabs">
            {PLATFORM_TABS.map((t, i) => (
              <div key={t.label} className={`lp-platform-tab${activeTab===i?' on':''}`} onClick={() => setActiveTab(i)}>
                {i === 0 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
                {i === 1 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                {i === 2 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
                {i === 3 && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                {t.label}
              </div>
            ))}
          </div>
          <div className="lp-platform-tab-desc">
            {tab.items.map(item => (
              <div key={item.name}>
                <div className="lp-platform-tab-name">{item.name}</div>
                <div className="lp-platform-tab-text">{item.text}</div>
              </div>
            ))}
          </div>
          <div className="lp-platform-screen">
            <div className="lp-platform-screen-head">
              <span className="lp-platform-screen-title">{tab.screenTitle}</span>
              <div className="lp-platform-screen-btn">Edit</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {tab.screenData.map(item => (
                <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <div className="lp-sec-alt">
        <div className="lp-sec-alt-in">
          <div className="lp-sec-head reveal">
            <div className="lp-pill">Semua Fitur</div>
            <h2 className="lp-h2">Tools yang benar-benar<br />kamu butuhkan</h2>
            <p className="lp-sec-sub">Tidak ada fitur yang sia-sia. Setiap modul punya peran spesifik dalam alur kerja konten kamu.</p>
          </div>
          <div className="lp-feat-grid">
            {[
              { name:'Library & Studio', desc:'Simpan semua script, ide, dan referensi konten di Library. Preview format visual untuk TikTok, Instagram, YouTube, dan platform lain di Studio.', visual:(
                <div style={{ width:'100%' }}>
                  {[{t:'Hook TikTok Skincare Vol.2',s:'Siap',sc:'#15803d',sb:'#f0fdf4'},{t:'Script Review Affiliate, Serum C',s:'Draft',sc:'#92400e',sb:'#fffbeb'},{t:'Caption IG Weekly Recap',s:'Siap',sc:'#15803d',sb:'#f0fdf4'}].map((r,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #f1f5f9',borderRadius:8,padding:'8px 10px',marginBottom:5 }}>
                      <div style={{ flex:1,fontSize:'0.72rem',color:'#374151',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{r.t}</div>
                      <span style={{ fontSize:'0.6rem',padding:'2px 7px',borderRadius:5,background:r.sb,color:r.sc,fontWeight:700 }}>{r.s}</span>
                    </div>
                  ))}
                </div>
              )},
              { name:'Calendar & Sprint', desc:'Jadwalkan konten secara visual per platform di Calendar. Kelola progres produksi dengan Sprint kanban: plan, in-progress, dan selesai.', visual:(
                <div style={{ width:'100%' }}>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8 }}>
                    {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d=><div key={d} style={{ textAlign:'center',fontSize:'0.58rem',color:'#94a3b8',fontWeight:700 }}>{d}</div>)}
                    {Array.from({length:21},(_,i)=>i+1).map(d=>(
                      <div key={d} style={{ textAlign:'center',fontSize:'0.62rem',color:d===15?'#fff':'#374151',fontWeight:d===15?700:400,background:d===15?'#1a73e8':[7,12,19].includes(d)?'#eff6ff':'transparent',borderRadius:5,padding:'3px 0',border:[7,12,19].includes(d)?'1px solid #bfdbfe':'1px solid transparent' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display:'flex',gap:4 }}>
                    {[{l:'Plan',c:'#f0fdf4',t:'#15803d',n:3},{l:'Proses',c:'#eff6ff',t:'#1d4ed8',n:5},{l:'Selesai',c:'#f8fafc',t:'#64748b',n:8}].map(col=>(
                      <div key={col.l} style={{ flex:1,background:col.c,borderRadius:7,padding:'6px 8px',textAlign:'center' }}>
                        <div style={{ fontSize:'0.6rem',color:col.t,fontWeight:700 }}>{col.l}</div>
                        <div style={{ fontSize:'0.9rem',fontWeight:900,color:col.t }}>{col.n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )},
              { name:'Tracker & Budget', desc:'Input performa konten per platform (views, likes, reach) dan pantau tren bulanan di Tracker. Catat semua pemasukan dan pengeluaran di Budget.', visual:(
                <div style={{ width:'100%' }}>
                  {[{platform:'TikTok',views:'124K',growth:'+18%',up:true},{platform:'Instagram',views:'38K',growth:'+7%',up:true},{platform:'YouTube',views:'12K',growth:'-3%',up:false}].map(r=>(
                    <div key={r.platform} style={{ display:'flex',alignItems:'center',gap:10,background:'#fff',border:'1px solid #f1f5f9',borderRadius:8,padding:'9px 12px',marginBottom:5 }}>
                      <span style={{ fontSize:'0.72rem',fontWeight:700,color:'#374151',flex:1 }}>{r.platform}</span>
                      <span style={{ fontSize:'0.72rem',color:'#64748b' }}>{r.views} views</span>
                      <span style={{ fontSize:'0.68rem',fontWeight:700,color:r.up?'#15803d':'#dc2626',background:r.up?'#f0fdf4':'#fef2f2',padding:'2px 6px',borderRadius:5 }}>{r.growth}</span>
                    </div>
                  ))}
                </div>
              )},
              { name:'Brand & Catalog', desc:'Bangun identitas brand yang konsisten, content pillars, dan tone of voice. Kelola database produk affiliate dan produk sendiri lengkap dengan komisi.', visual:(
                <div style={{ width:'100%' }}>
                  <div style={{ background:'#fff',border:'1px solid #f1f5f9',borderRadius:10,padding:'12px 14px',marginBottom:8 }}>
                    <div style={{ fontSize:'0.62rem',color:'#94a3b8',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em' }}>Brand</div>
                    <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                      {['Skincare','Beauty','Lifestyle'].map(t=><span key={t} style={{ background:'#eff6ff',color:'#1a73e8',fontSize:'0.65rem',fontWeight:700,padding:'3px 9px',borderRadius:20 }}>{t}</span>)}
                    </div>
                  </div>
                  {[{name:'Serum Vit C Somethinc',komisi:'12%'},{name:'Sunscreen SPF 50 Azarine',komisi:'10%'}].map(p=>(
                    <div key={p.name} style={{ display:'flex',alignItems:'center',gap:8,background:'#fff',border:'1px solid #f1f5f9',borderRadius:8,padding:'8px 12px',marginBottom:5 }}>
                      <div style={{ flex:1,fontSize:'0.72rem',color:'#374151',fontWeight:500 }}>{p.name}</div>
                      <span style={{ fontSize:'0.68rem',fontWeight:700,color:'#15803d',background:'#f0fdf4',padding:'2px 7px',borderRadius:5 }}>{p.komisi}</span>
                    </div>
                  ))}
                </div>
              )},
            ].map((f,i)=>(
              <div key={f.name} className={`lp-feat-card reveal reveal-delay-${(i%2)+1}`}>
                <div className="lp-feat-visual">{f.visual}</div>
                <div className="lp-feat-body">
                  <div className="lp-feat-name">{f.name}</div>
                  <div className="lp-feat-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SPLIT */}
      <section className="lp-sec">
        <div className="lp-split">
          <div className="reveal">
            <div className="lp-split-pill"><div className="lp-pill">Untuk Affiliator</div></div>
            <h2 className="lp-split-h2">Database produk & komisi dalam genggaman</h2>
            <p className="lp-split-sub">Simpan semua produk affiliate yang kamu promosikan, lengkap dengan link, komisi, dan catatan performa. Tidak ada lagi spreadsheet berantakan.</p>
            <div className="lp-split-list">
              {['Catat komisi per produk dan hitung potensi penghasilan','Tag platform yang akan dipromosikan per produk','Hubungkan langsung ke Sprint dan Plan konten'].map(i=>(
                <div key={i} className="lp-split-item">
                  <div className="lp-split-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                  {i}
                </div>
              ))}
            </div>
          </div>
          <div className="lp-split-visual reveal reveal-delay-2">
            <div style={{ fontSize:'0.65rem',color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8 }}>Catalog: Produk Affiliate</div>
            {[{name:'Serum Vit C Somethinc',platform:'Shopee',komisi:'12%',status:'Aktif'},{name:'Sunscreen SPF 50 Azarine',platform:'TikTok Shop',komisi:'10%',status:'Aktif'},{name:'Moisturizer Skintific',platform:'Tokopedia',komisi:'8%',status:'Pause'}].map((p,i)=>(
              <div key={i} style={{ background:'#fff',border:'1.5px solid #f1f5f9',borderRadius:10,padding:'12px 14px',marginBottom:8 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5 }}>
                  <span style={{ fontSize:'0.8rem',fontWeight:700,color:'#0f172a' }}>{p.name}</span>
                  <span style={{ fontSize:'0.65rem',fontWeight:700,color:p.status==='Aktif'?'#15803d':'#64748b',background:p.status==='Aktif'?'#f0fdf4':'#f8fafc',padding:'2px 8px',borderRadius:20 }}>{p.status}</span>
                </div>
                <div style={{ display:'flex',gap:12 }}>
                  <span style={{ fontSize:'0.72rem',color:'#94a3b8' }}>{p.platform}</span>
                  <span style={{ fontSize:'0.72rem',fontWeight:700,color:'#1a73e8' }}>Komisi {p.komisi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <div className="lp-sec-alt">
        <div className="lp-sec-alt-in">
          <div className="lp-sec-head reveal">
            <div className="lp-pill">Testimonial</div>
            <h2 className="lp-h2">Cerita di balik konten<br />yang lebih terstruktur</h2>
            <p className="lp-sec-sub">Dari creator solo hingga brand yang handle banyak platform sekaligus.</p>
          </div>
          <div className="lp-testi-grid">
            {[
              { text:'"Sebelum pakai KreaFlow, ide konten gue berserakan di mana-mana: notes, spreadsheet, DM ke diri sendiri. Sekarang semua ada tempatnya dan gue bisa fokus bikin konten."', name:'Rina Amalia', role:'TikTok Creator · 120K followers', img:5 },
              { text:'"Sebagai affiliator yang promosiin 10+ produk sekaligus, Catalog dan Sprint KreaFlow beneran ngubah cara kerja gue. Sekarang tahu persis konten mana yang performance-nya bagus."', name:'Dika Kurniawan', role:'Affiliator Shopee & TikTok', img:12 },
              { text:'"Gue handle 3 brand berbeda. Dulu chaosnya minta ampun. KreaFlow bikin gue bisa pisahin workspace per brand dan kelola semua dari satu akun. Game changer."', name:'Fitri Nadia', role:'Social Media Manager', img:25 },
            ].map((t,i)=>(
              <div key={t.name} className={`lp-testi-card reveal reveal-delay-${i+1}`}>
                <div className="lp-testi-quote">&ldquo;</div>
                <p className="lp-testi-text">{t.text}</p>
                <div className="lp-testi-author">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="lp-testi-avatar" src={`https://i.pravatar.cc/80?img=${t.img}`} alt={t.name} />
                  <div>
                    <div className="lp-testi-name">{t.name}</div>
                    <div className="lp-testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING */}
      <section className="lp-sec" id="harga">
        <div className="lp-sec-head reveal">
          <div className="lp-pill">Harga</div>
          <h2 className="lp-h2">Simple Pricing, Powerful Tools.</h2>
          <p className="lp-sec-sub">Paket utama bayar sekali, lifetime. Add-on workspace tersedia berlangganan bulanan.</p>
        </div>
        <div className="lp-pricing-grid">
          {TIERS.map((tier, i) => (
            <div key={tier.id} className={`lp-price-card${tier.highlight?' lp-price-featured':''} reveal reveal-delay-${i+1}`}>
              {tier.badge && <div className="lp-price-badge">{tier.badge}</div>}
              <div className="lp-price-tier">{tier.name}</div>
              <div className="lp-price-ws">{tier.maxWs}</div>
              {tier.oldPrice && <div className="lp-price-orig">{tier.oldPrice}</div>}
              <div style={{ fontSize:'2rem', fontWeight:900, color: tier.highlight?'#1a73e8':'#0f172a', letterSpacing:'-1px', lineHeight:1, marginBottom:4 }}>{tier.price}</div>
              <div className="lp-price-note">Bayar sekali · Lifetime</div>
              <Link href="/register" className={`lp-price-cta ${tier.highlight?'lp-price-cta-solid':'lp-price-cta-ghost'}`}>
                Mulai {tier.name} →
              </Link>
              <div className="lp-price-divider" />
              <div className="lp-price-feats">
                {tier.features.map(f=>(
                  <div key={f} className="lp-price-feat">
                    <span className="lp-price-check" style={{ color: tier.highlight?'#1a73e8':'#059669' }}>✓</span>
                    <span style={{ fontWeight: f.includes('Workspace')?700:400 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth:900, margin:'16px auto 0', display:'flex', flexDirection:'column', gap:10 }}>
          {/* Add-on: +1 Workspace */}
          <div className="lp-pricing-addon reveal">
            <div style={{ width:38, height:38, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:700, color:'#2a3547', fontSize:'0.9rem', marginBottom:2 }}>Add-on +1 Workspace</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b' }}>Tambah 1 workspace extra tanpa ganti paket. Bayar sekali, berlaku selamanya.</div>
            </div>
            <div style={{ flexShrink:0, textAlign:'right' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#0f172a', lineHeight:1 }}>Rp69.000</div>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>lifetime</div>
            </div>
            <Link href="/register" style={{ padding:'9px 18px', borderRadius:8, background:'#f8fafc', border:'1.5px solid #e5eaf2', color:'#374151', fontSize:'0.85rem', fontWeight:700, textDecoration:'none', flexShrink:0, whiteSpace:'nowrap' }}>
              Mulai Berlangganan →
            </Link>
          </div>

          {/* Add-on: Auto Schedule Post */}
          <div className="lp-pricing-addon reveal" style={{ opacity:0.78 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                <span style={{ fontWeight:700, color:'#2a3547', fontSize:'0.9rem' }}>Add-on Auto Schedule Post</span>
                <span style={{ fontSize:'0.62rem', fontWeight:800, color:'#d97706', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:20, padding:'1px 8px', whiteSpace:'nowrap' }}>Segera Hadir</span>
              </div>
              <div style={{ fontSize:'0.78rem', color:'#64748b' }}>Jadwalkan &amp; posting otomatis ke TikTok, Instagram, dan YouTube Shorts langsung dari KreaFlow.</div>
            </div>
            <div style={{ flexShrink:0, textAlign:'right' }}>
              <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#0f172a', lineHeight:1 }}>Rp49.000</div>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:2 }}>/bulan</div>
            </div>
            <div style={{ padding:'9px 18px', borderRadius:8, background:'#f1f5f9', color:'#94a3b8', fontSize:'0.85rem', fontWeight:700, flexShrink:0, cursor:'not-allowed', whiteSpace:'nowrap' }}>Segera Hadir</div>
          </div>
        </div>
        <p className="lp-pricing-note">Harga hanya tersedia selama masa launch · Dapat berubah kapan saja</p>
      </section>

      {/* FAQ */}
      <div className="lp-sec-alt">
        <div className="lp-sec-alt-in">
          <div className="lp-sec-head reveal">
            <div className="lp-pill">FAQs</div>
            <h2 className="lp-h2">Frequently Asked Questions</h2>
            <p className="lp-sec-sub">Ada pertanyaan? Berikut jawaban untuk pertanyaan yang paling sering ditanya.</p>
          </div>
          <div className="lp-faq reveal">
            {FAQS.map((f,i)=>(
              <details key={i} className="lp-faq-item">
                <summary className="lp-faq-q">{f.q}</summary>
                <div className="lp-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="lp-cta-block-wrap">
        <div className="lp-cta-block reveal">
          <div className="lp-cta-block-left">
            <div className="lp-cta-block-social">
              <div className="lp-avatars">
                {[47,53,58,62,65].map(n=>(
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} className="lp-avatar-cta" src={`https://i.pravatar.cc/60?img=${n}`} alt="" />
                ))}
              </div>
              <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', fontWeight:500 }}>Bergabung bersama creator Indonesia</span>
            </div>
            <h2 className="lp-cta-block-h2">Mulai kelola konten<br />lebih terstruktur.</h2>
            <p className="lp-cta-block-sub">Lifetime deal · Bayar sekali, pakai selamanya</p>
          </div>
          <div className="lp-cta-block-right">
            <Link href="/register" className="lp-btn-white">Mulai Sekarang →</Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-logo" style={{ marginBottom:10 }}>
              <div className="lp-logo-mark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="lp-logo-name">KreaFlow</span>
            </div>
            <p className="lp-footer-brand-desc">Platform SMM end-to-end untuk content creator dan affiliator Indonesia.</p>
          </div>
          <div>
            <div className="lp-footer-col-title">Menu</div>
            <div className="lp-footer-links">
              {[['Fitur','#fitur'],['Harga','#harga'],['Tentang','#'],['Daftar','/register'],['Masuk','/login']].map(([l,h])=>(
                <a key={l} href={h} className="lp-footer-link">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="lp-footer-col-title">Platform</div>
            <div className="lp-footer-links">
              {['TikTok Creator','Affiliator','Brand & SMM','Content Manager'].map(l=>(
                <span key={l} className="lp-footer-link" style={{ cursor:'default' }}>{l}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="lp-footer-col-title">Info</div>
            <div className="lp-footer-links">
              <a href="/privacy" className="lp-footer-link">Kebijakan Privasi</a>
              <a href="/terms" className="lp-footer-link">Syarat & Ketentuan</a>
              <a href="mailto:hello@kreaflow.id" className="lp-footer-link">Hubungi Kami</a>
            </div>
          </div>
          <div>
            <div className="lp-footer-col-title">Sosial</div>
            <div className="lp-footer-links">
              <a href="https://www.tiktok.com/@kreaflowid" target="_blank" rel="noopener noreferrer" className="lp-footer-link">TikTok</a>
              <a href="https://www.instagram.com/kreaflowid" target="_blank" rel="noopener noreferrer" className="lp-footer-link">Instagram</a>
              <a href="https://www.youtube.com/@kreaflowid" target="_blank" rel="noopener noreferrer" className="lp-footer-link">YouTube</a>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span className="lp-footer-copy">© 2026 KreaFlow · PT. Kiblat Pemuda Kreatif · kreaflow.id</span>
          <span className="lp-footer-copy">All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
