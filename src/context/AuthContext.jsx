import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profil, setProfil]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) chargerProfil(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) chargerProfil(session.user.id)
      else { setProfil(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function chargerProfil(userId) {
    const { data } = await supabase
      .from('profils')
      .select('*')
      .eq('id', userId)
      .single()
    setProfil(data)
    setLoading(false)
  }

  async function connexion(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function inscription(email, password, prenom, nom) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error
    // Compléter le profil avec prénom/nom
    if (data?.user) {
      await supabase.from('profils')
        .update({ prenom, nom })
        .eq('id', data.user.id)
    }
    return null
  }

  async function deconnexion() {
    await supabase.auth.signOut()
  }

  const compteActif = profil?.actif === true

  const isAssocie = compteActif && profil?.role === 'Associé'
  const isManager = compteActif && (profil?.role === 'Manager' || profil?.role === 'Associé')

  return (
    <AuthContext.Provider value={{
      user, profil, loading, compteActif,
      connexion, inscription, deconnexion,
      isAssocie, isManager,
      peutCreerProjet:    isManager,
      peutArchiverProjet: isManager,
      peutSupprimerProjet: isAssocie,
      peutGererUsers:     isAssocie,
      peutModifierCollabs: isManager,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
