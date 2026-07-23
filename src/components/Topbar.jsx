import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

export default function Topbar({ breadcrumb, phase, onPhaseChange, profil, onDeconnexion }) {
  const navigate = useNavigate()
  const { isAssocie } = useAuth()
  const [menuProfil, setMenuProfil] = useState(false)

  const initiales = profil
    ? ((profil.prenom?.[0] || '') + (profil.nom?.[0] || '')).toUpperCase() || '?'
    : '?'

  const ROLE_COLORS = {
    'Associé': { bg: '#FCEBEB', color: '#A32D2D' },
    'Manager':  { bg: '#FAEEDA', color: '#854F0B' },
    'Salarié':  { bg: '#EAF3DE', color: '#3B6D11' },
  }
  const rc = ROLE_COLORS[profil?.role] || { bg: '#eee', color: '#555' }

  return (
    <div className="topbar">
      <div className="breadcrumb">
        {breadcrumb.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="bc-sep">›</span>}
            {item.path ? (
              <button className="bc-link" onClick={() => navigate(item.path)}>{item.label}</button>
            ) : (
              <span className="bc-active">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {onPhaseChange && (
          <select className="phase-select" value={phase || 'EXE'} onChange={e => onPhaseChange(e.target.value)}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}

        {profil && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuProfil(m => !m)}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                border: '2px solid rgba(255,255,255,0.5)',
                color: 'white', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {initiales}
            </button>
            {menuProfil && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 8,
                background: 'white', border: '1px solid var(--bordure)',
                borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 200, zIndex: 200, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--bordure)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--texte)' }}>
                    {profil.prenom} {profil.nom}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--texte-sec)', marginTop: 2 }}>{profil.email}</div>
                  <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 10, background: rc.bg, color: rc.color, fontWeight: 500 }}>
                    {profil.role}
                  </span>
                </div>

                {isAssocie && (
                  <button
                    onClick={() => { setMenuProfil(false); navigate('/admin') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--texte)', fontFamily: 'inherit', borderBottom: '1px solid var(--bordure)', textAlign: 'left' }}
                  >
                    Administration
                  </button>
                )}

                {isAssocie && (
                  <button
                    onClick={() => { setMenuProfil(false); navigate('/feedback') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--texte)', fontFamily: 'inherit', borderBottom: '1px solid var(--bordure)', textAlign: 'left' }}
                  >
                    Retours utilisateurs
                  </button>
                )}

                <button
                  onClick={() => { setMenuProfil(false); onDeconnexion?.() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#E24B4A', fontFamily: 'inherit', textAlign: 'left' }}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
