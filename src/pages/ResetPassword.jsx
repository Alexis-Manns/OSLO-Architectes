import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [erreur, setErreur]     = useState(null)
  const [succes, setSucces]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    setErreur(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setErreur('Erreur lors de la mise à jour. Veuillez réessayer.')
      return
    }
    setSucces(true)
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--fond)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--blanc)', border: '1px solid var(--bordure)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 410,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: '#FF8C00', borderRadius: 14,
            margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white',
          }}>OA</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Oslo Architectes</div>
        </div>

        {succes ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>&#10003;</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#3B6D11', marginBottom: 8 }}>Mot de passe mis à jour !</div>
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', lineHeight: 1.6 }}>
              Redirection vers l'application...
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Nouveau mot de passe</div>
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', lineHeight: 1.6, marginBottom: 16 }}>
              Choisissez votre nouveau mot de passe (8 caractères minimum).
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le mot de passe</label>
                <input className="form-input" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Retapez le mot de passe" required />
              </div>
              {erreur && (
                <div style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur}</div>
              )}
              <button type="submit" disabled={loading} style={{
                width: '100%', background: '#FF8C00', color: 'white', border: 'none',
                padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
