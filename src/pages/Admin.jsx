import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const { profil, deconnexion, user } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDesactive, setConfirmDesactive] = useState(null)
  const [confirmRefus, setConfirmRefus] = useState(null)

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

  async function refuser(u) {
    // Supprimer le profil et l'utilisateur auth
    await supabase.from('profils').delete().eq('id', u.id)
    await supabase.auth.admin?.deleteUser(u.id)
    setConfirmRefus(null)
    charger()
  }

  async function desactiver(u) {
    // Désactiver le compte — supprime aussi son profil de la liste immédiatement
    await supabase.from('profils').update({ actif: false }).eq('id', u.id)
    // Supprimer de mes_projets pour couper l'accès à ses projets
    await supabase.from('mes_projets').delete().eq('user_id', u.id)
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
        {loading ? <div className="loading">Chargement...</div> : (
          <>
            {/* En attente de validation */}
            {enAttente.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  En attente de validation
                  <span className="badge badge-ambre" style={{ background: '#FAEEDA', color: '#854F0B' }}>{enAttente.length}</span>
                </div>
                {enAttente.map(u => (
                  <div key={u.id} className="list-item" style={{ background: '#FFFBF5', border: '1px solid #FAEEDA', borderRadius: 10, marginBottom: 8, gap: 10 }}>
                    <Avatar nom={u.nom || u.email} prenom={u.prenom || ''} />
                    <div className="item-info">
                      <div className="item-nom">{u.prenom} {u.nom} {(!u.prenom && !u.nom) && u.email}</div>
                      <div className="item-sub">{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => activer(u)}
                        style={{ background: '#3B6D11', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                      >
                        Activer
                      </button>
                      <button
                        onClick={() => setConfirmRefus(u)}
                        style={{ background: 'none', border: '1px solid #E24B4A', color: '#E24B4A', padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        Refuser
                      </button>
                    </div>
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
                <div key={u.id} className="list-item" style={{ gap: 10 }}>
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
                    style={{ width: 'auto', padding: '5px 10px', fontSize: 12, flexShrink: 0 }}
                    value={u.role || 'Salarié'}
                    onChange={e => changerRole(u, e.target.value)}
                    disabled={estMoi}
                  >
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  {!estMoi && (
                    <button
                      onClick={() => setConfirmDesactive(u)}
                      style={{ background: 'none', border: '1px solid var(--bordure)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#E24B4A', flexShrink: 0 }}
                    >
                      Desactiver
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Confirmation refus */}
      {confirmRefus && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Refuser cette demande</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Voulez-vous refuser la demande de <strong>{confirmRefus.prenom} {confirmRefus.nom || confirmRefus.email}</strong> ?
              <span style={{ display: 'block', marginTop: 6, color: '#E24B4A' }}>Le compte sera supprime definitivement.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => refuser(confirmRefus)}
              >Refuser et supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmRefus(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation désactivation */}
      {confirmDesactive && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Desactiver ce compte</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              <strong>{confirmDesactive.prenom} {confirmDesactive.nom}</strong> ({confirmDesactive.email}) ne pourra plus se connecter.
              <span style={{ display: 'block', marginTop: 6 }}>Ses projets personnels seront retires de sa liste. Vous pourrez le reactiver a tout moment.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => desactiver(confirmDesactive)}
              >Desactiver</button>
              <button className="btn-cancel" onClick={() => setConfirmDesactive(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
