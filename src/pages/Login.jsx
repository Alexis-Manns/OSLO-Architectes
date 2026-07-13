import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { connexion, inscription } = useAuth()
  const [mode, setMode] = useState('connexion') // 'connexion' | 'inscription' | 'attente'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [prenom, setPrenom]     = useState('')
  const [nom, setNom]           = useState('')
  const [erreur, setErreur]     = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleConnexion(e) {
    e.preventDefault()
    setLoading(true)
    setErreur(null)
    const error = await connexion(email, password)
    if (error) setErreur('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  async function handleInscription(e) {
    e.preventDefault()
    if (password.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    setErreur(null)
    const error = await inscription(email, password, prenom, nom)
    if (error) {
      setErreur(error.message.includes('already') ? 'Un compte existe déjà avec cet email.' : 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }
    setLoading(false)
    setMode('attente')
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: '#FF8C00', borderRadius: 14,
            margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.5px'
          }}>OA</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Oslo Architectes</div>
          <div style={{ fontSize: 13, color: 'var(--texte-sec)', marginTop: 4 }}>Gestion de projets</div>
        </div>

        {/* Mode attente de validation */}
        {mode === 'attente' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Compte créé !</div>
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', lineHeight: 1.6, marginBottom: 20 }}>
              Votre compte est en attente de validation par un administrateur de l'agence.
              Vous pourrez vous connecter dès qu'il aura été activé.
            </div>
            <button className="btn-cancel" onClick={() => setMode('connexion')} style={{ width: '100%' }}>
              Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            {/* Onglets connexion / inscription */}
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab-btn ${mode === 'connexion' ? 'active' : ''}`}
                onClick={() => { setMode('connexion'); setErreur(null) }} style={{ flex: 1 }}>
                Connexion
              </button>
              <button className={`tab-btn ${mode === 'inscription' ? 'active' : ''}`}
                onClick={() => { setMode('inscription'); setErreur(null) }} style={{ flex: 1 }}>
                Créer un compte
              </button>
            </div>

            <form onSubmit={mode === 'connexion' ? handleConnexion : handleInscription}>
              {mode === 'inscription' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Prénom *</label>
                    <input className="form-input" value={prenom} onChange={e => setPrenom(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nom *</label>
                    <input className="form-input" value={nom} onChange={e => setNom(e.target.value)} required />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email professionnel</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe {mode === 'inscription' && '(8 caractères min.)'}</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>

              {erreur && (
                <div style={{
                  background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D',
                  padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                }}>{erreur}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', background: '#FF8C00', color: 'white', border: 'none',
                padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, marginTop: 4,
              }}>
                {loading ? 'Chargement…' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
              </button>
            </form>

            {mode === 'inscription' && (
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--texte-sec)', textAlign: 'center', lineHeight: 1.5 }}>
                Après création, votre compte devra être activé<br />par un administrateur avant la première connexion.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

