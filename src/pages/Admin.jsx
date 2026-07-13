import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROLES = ['Associé', 'Manager', 'Salarié']

const ROLE_COLORS = {
  'Associé': { bg: '#FCEBEB', color: '#A32D2D' },
  'Manager': { bg: '#FAEEDA', color: '#854F0B' },
  'Salarié': { bg: '#EAF3DE', color: '#3B6D11' },
}

export default function Admin() {
  const { profil, deconnexion, user } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDesactive, setConfirmDesactive] = useState(null)

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase
      .from('profils')
      .select('*')
      .order('created_at', { ascending: false })
    setUtilisateurs(data || [])
    setLoading(false)
  }

  async function activer(u) {
    await supabase.from('profils').update({ actif: true }).eq('id', u.id)
    charger()
  }

  async function desactiver(u) {
    await supabase.from('profils').update({ actif: false }).eq('id', u.id)
    setConfirmDesactive(null)
    charger()
  }

  async function changerRole(u, role) {
    await supabase.from('profils').update({ role }).eq('id', u.id)
    charger()
  }

  const enAttente = utilisateurs.filter(u => !u.actif)
  const actifs    = utilisateurs.filter(u => u.actif)

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Oslo Architectes', path: '/' },
          { label: 'Administration' },
        ]}
        profil={profil}
        onDeconnexion={deconnexion}
      />
      <div className="content">
        {loading ? <div className="loading">Chargement…</div> : (
          <>
            {/* En attente de validation */}
            {enAttente.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  En attente de validation
                  <span className="badge badge-ambre">{enAttente.length}</span>
                </div>
                {enAttente.map(u => (
                  <div key={u.id} className="list-item" style={{ background: '#FFFBF5', border: '1px solid #FAEEDA', borderRadius: 10, marginBottom: 8 }}>
                    <Avatar nom={u.nom || u.email} prenom={u.prenom || ''} />
                    <div className="item-info">
                      <div className="item-nom">{u.prenom} {u.nom} {(!u.prenom && !u.nom) && u.email}</div>
                      <div className="item-sub">{u.email}</div>
                    </div>
                    <button
                      onClick={() => activer(u)}
                      style={{ background: '#3B6D11', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                    >
                      Activer
                    </button>
                  </div>
                ))}
                <div style={{ height: 24 }} />
              </>
            )}

            {/* Utilisateurs actifs */}
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--texte-sec)', marginBottom: 10 }}>
              Utilisateurs actifs ({actifs.length})
            </div>
            {actifs.map(u => {
              const rc = ROLE_COLORS[u.role] || {}
              const estMoi = u.id === user?.id
              return (
                <div key={u.id} className="list-item">
                  <Avatar nom={u.nom || u.email} prenom={u.prenom || ''} />
                  <div className="item-info">
                    <div className="item-nom">
                      {u.prenom} {u.nom} {(!u.prenom && !u.nom) && u.email}
                      {estMoi && <span style={{ fontSize: 11, color: 'var(--texte-sec)', marginLeft: 6 }}>(vous)</span>}
                    </div>
                    <div className="item-sub">{u.email}</div>
                  </div>
                  <select
                    className="form-input"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: 12 }}
                    value={u.role}
                    onChange={e => changerRole(u, e.target.value)}
                    disabled={estMoi}
                  >
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  {!estMoi && (
                    <button
                      onClick={() => setConfirmDesactive(u)}
                      title="Désactiver le compte"
                      style={{ background: 'none', border: '1px solid var(--bordure)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#E24B4A' }}
                    >
                      Désactiver
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Confirmation désactivation */}
      {confirmDesactive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Désactiver ce compte</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              <strong>{confirmDesactive.prenom} {confirmDesactive.nom}</strong> ({confirmDesactive.email}) ne pourra plus se connecter à l'application.
              <span style={{ display: 'block', marginTop: 6 }}>Vous pourrez le réactiver à tout moment.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => desactiver(confirmDesactive)}>Désactiver</button>
              <button className="btn-cancel" onClick={() => setConfirmDesactive(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
