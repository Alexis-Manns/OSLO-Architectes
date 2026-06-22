import React from 'react'

const COLORS = [
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#EAF3DE', color: '#3B6D11' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#FCEBEB', color: '#A32D2D' },
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initiales(nom, prenom) {
  return ((nom?.[0] || '') + (prenom?.[0] || '')).toUpperCase() || '?'
}

export default function Avatar({ nom, prenom, size = 38, square = false }) {
  const c = getColor((nom || '') + (prenom || ''))
  return (
    <div style={{
      width: size, height: size,
      borderRadius: square ? 8 : '50%',
      background: c.bg, color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 600, flexShrink: 0
    }}>
      {initiales(nom, prenom)}
    </div>
  )
}
