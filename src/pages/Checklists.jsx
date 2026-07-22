import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../useRealtime'
import { useAuth } from '../context/AuthContext'

const PHASES_ORDRE = [
  'Démarrage chantier',
  'Terrassement / Fondation',
  'Gros Oeuvre',
  'Clos couvert',
  'Second Oeuvre',
  'Façade',
  'Finitions',
  'AOR',
  'OPC',
]

const PHASES_COULEURS = {
  'Démarrage chantier':      '#534AB7',
  'Terrassement / Fondation':'#854F0B',
  'Gros Oeuvre':             '#3B6D11',
  'Clos couvert':            '#185FA5',
  'Second Oeuvre':           '#993C1D',
  'Façade':                  '#A32D2D',
  'Finitions':               '#5F5E5A',
  'AOR':                     '#0F6E56',
  'OPC':                     '#185FA5',
}

const BASE_ITEMS = {
  'Démarrage chantier': [
    "Notifier l'OS de démarrage à toutes les entreprises",
    "Récupérer les attestations décennale et RC pro de chaque entreprise",
    "Vérifier la validité des assurances (dates, activités couvertes)",
    "Exiger et viser le planning d'exécution de chaque entreprise",
    "Faire valider le PIC avant toute installation",
    "Vérifier la pose du panneau de chantier (mentions PC obligatoires)",
    "Faire constater l'affichage du PC par huissier",
    "Demander les états des lieux des avoisinants (photos datées)",
    "Vérifier que le référé préventif est lancé si mitoyenneté sensible",
    "Récupérer le PPSPS de chaque entreprise avant son intervention",
    "S'assurer que le PGC est diffusé à toutes les entreprises",
    "Vérifier la mise en place des branchements provisoires",
    "Contrôler la clôture et la sécurisation du chantier",
    "Organiser la réunion de lancement et diffuser le CR",
    "Fixer le jour et l'heure du rendez-vous de chantier hebdomadaire",
    "Demander le diagnostic amiante/plomb avant travaux si réhabilitation",
    "Établir la liste de diffusion des CR (entreprises, MO, BET, SPS)",
    "Initialiser le tableau de suivi financier (marchés, avenants, situations)",
    "Demander les agréments de sous-traitants (DC4) avant intervention",
    "Vérifier les autorisations de voirie et occupation du domaine public",
  ],
  'Terrassement / Fondation': [
    "Vérifier que les DICT sont faites et les réponses reçues",
    "S'assurer du marquage des réseaux existants avant terrassement",
    "Exiger le PV d'implantation du géomètre avant fouilles",
    "Vérifier le trait de niveau NGF sur site",
    "Faire réceptionner le fond de fouille par le géotechnicien (mission G3)",
    "Récupérer le rapport de réception du fond de fouille",
    "Valider les purges et substitutions avec le BET avant remblai",
    "Vérifier le coulage du béton de propreté avant ferraillage",
    "Viser les plans de ferraillage fondations avant exécution",
    "Contrôler les armatures avant coulage (espacement, recouvrement, calage)",
    "Prendre des photos des armatures avant chaque coulage",
    "Vérifier les attentes et réservations en fondations (plots, gaines)",
    "S'assurer du prélèvement d'éprouvettes béton à chaque coulage",
    "Réclamer les PV d'écrasement à 28 jours",
    "Vérifier la pose de la boucle de fond de fouille (mise à la terre)",
    "Contrôler la pose du drainage périphérique avant remblaiement",
    "Réceptionner l'étanchéité des parties enterrées avant remblai",
    "Exiger les PV de compactage des remblais techniques",
    "Vérifier les réseaux sous dallage (pente, tests) avant coulage",
    "Contrôler les bordereaux de suivi des terres évacuées (BSD si pollution)",
  ],
  'Gros Oeuvre': [
    "Viser les plans d'exécution coffrage/ferraillage avant chaque niveau",
    "Vérifier les réservations avant CHAQUE coulage (gaines, trémies, portes)",
    "Contrôler les armatures avant coulage et valider par écrit",
    "Vérifier les enrobages des aciers (cales, distances)",
    "Réclamer les PV d'écrasement béton et vérifier les résistances",
    "Contrôler l'aplomb des voiles à chaque niveau (règle des 2m)",
    "Vérifier la planéité des dalles avant travaux de second oeuvre",
    "S'assurer de la réalisation des joints de dilatation",
    "Contrôler les cotes des trémies escaliers et ascenseur",
    "Vérifier les réservations de façade aux cotes tableaux menuiseries",
    "Contrôler les appuis de baies (pente, rejingot, goutte d'eau)",
    "Vérifier les hauteurs d'acrotères et relevés d'étanchéité prévus",
    "Contrôler la régularité des hauteurs de marches d'escalier",
    "Vérifier les sections des gaines maçonnées avec les fluides",
    "S'assurer du traitement des reprises de bétonnage",
    "Exiger le ragréage et le traitement du bullage avant peinture",
    "Demander l'autocontrôle de l'entreprise GO à chaque niveau",
    "Faire l'état des réserves GO et suivre leur levée",
    "Récupérer les plans de récolement GO",
    "Vérifier la protection des ouvrages finis (arêtes, seuils)",
  ],
  'Clos couvert': [
    "Viser les plans de charpente (BET + MOE) avant fabrication",
    "Demander les certificats de traitement des bois (classe d'emploi)",
    "Contrôler les ancrages et fixations de charpente",
    "Vérifier la pose des contreventements conformes aux plans",
    "Faire réceptionner le support avant pose de l'étanchéité",
    "Vérifier la continuité du pare-vapeur",
    "Demander les fiches techniques et certificats ACERMI de l'isolant",
    "Contrôler l'épaisseur d'isolant posé (conformité RE2020)",
    "Réceptionner l'étanchéité toiture avec PV signé de l'étancheur",
    "Exiger l'essai de mise en eau de la toiture",
    "Contrôler les relevés d'étanchéité aux points singuliers",
    "Vérifier les naissances EP et trop-pleins (nombre, sections)",
    "Tester l'écoulement des descentes EP",
    "Contrôler les recouvrements de couverture (tuiles, zinc, bac)",
    "Vérifier les abergements des pénétrations (sorties toiture, VMC)",
    "Contrôler la pose des menuiseries aux cotes tableaux",
    "Vérifier le calfeutrement et l'étanchéité à l'air des menuiseries",
    "Demander les certificats des vitrages (Sw, Ug, acoustique, sécurité)",
    "Contrôler la hauteur et la fixation des garde-corps",
    "Obtenir le visa du contrôleur technique sur le clos couvert",
  ],
  'Second Oeuvre': [
    "Organiser la cellule de synthèse technique (CVC/PLB/ELEC/cloisons)",
    "Viser les plans de réservations et distribution des fluides",
    "Vérifier le passage des gaines électriques AVANT fermeture des cloisons",
    "Contrôler le repérage des câblages courants forts/faibles",
    "Vérifier l'implantation des cloisons (traçage au sol) avant montage",
    "Demander l'échantillon ou fiche technique de chaque matériau prévu",
    "Faire valider les échantillons par la maîtrise d'ouvrage (traçabilité)",
    "Exiger les essais de pression plomberie AVANT fermeture (PV)",
    "Exiger les essais d'étanchéité des réseaux EU/EV (PV)",
    "Vérifier le calorifugeage des réseaux (épaisseur, continuité)",
    "Contrôler l'isolation phonique dans les cloisons avant fermeture",
    "Vérifier les renforts dans cloisons pour équipements lourds à venir",
    "Contrôler l'aplomb des huisseries et largeurs de passage PMR",
    "S'assurer des trappes de visite en faux-plafond aux points techniques",
    "Vérifier la planéité de la chape avant pose des revêtements",
    "Respecter le temps de séchage chape avant revêtement (mesure humidité)",
    "Exiger l'étanchéité sous carrelage (SPEC) en pièces humides",
    "Vérifier les débits VMC bouche par bouche (PV de mesure)",
    "Contrôler le repérage des circuits au tableau électrique",
    "Demander les autocontrôles de chaque entreprise avant réception de support",
  ],
  'Façade': [
    "Vérifier la réception de l'échafaudage (PV) et l'affichage des vérifications",
    "Faire réceptionner le support par le façadier avant démarrage",
    "Demander l'avis technique du système ITE et vérifier sa validité",
    "Contrôler les fixations et chevilles conformes à l'avis technique",
    "Faire valider le calepinage par l'architecte avant pose",
    "Faire réaliser une surface témoin et la faire valider (MO + architecte)",
    "Conserver l'échantillon/teinte validé comme référence contractuelle",
    "Contrôler le traitement des points singuliers (appuis, tableaux, angles)",
    "Vérifier les bavettes et couvertines (pente, goutte d'eau, recouvrement)",
    "Contrôler les joints de fractionnement selon l'avis technique",
    "Vérifier l'armature du sous-enduit (treillis, recouvrements)",
    "Contrôler l'épaisseur d'enduit par sondages contradictoires",
    "Vérifier la teinte à l'avancement par rapport à la surface témoin",
    "Contrôler le calfeutrement extérieur des menuiseries",
    "Vérifier la fixation des brise-soleil et habillages (reprise d'efforts)",
    "S'assurer de l'application de l'hydrofuge/anti-graffiti si prévu",
    "Faire le contrôle visuel complet AVANT descente de l'échafaudage",
    "Prendre les photos d'état de façade pour archivage",
    "Exiger le nettoyage des vitrages après travaux de façade",
    "Établir le PV de réception du lot façade",
  ],
  'Finitions': [
    "Faire valider tous les échantillons de finition (sols, peintures, faïences)",
    "Vérifier le calepinage des revêtements avant pose",
    "Contrôler la pose des sols (alignement, joints, coupes)",
    "Vérifier les plinthes et joints périphériques",
    "Contrôler le sens de pose et les jeux de dilatation des parquets",
    "Vérifier le nombre de couches de peinture (sondage contradictoire)",
    "Contrôler les teintes par rapport aux références validées",
    "Vérifier l'alignement et les joints des faïences",
    "Contrôler la fixation et le fonctionnement des appareils sanitaires",
    "Tester l'écoulement et l'étanchéité de chaque point d'eau",
    "Régler et vérifier chaque porte intérieure (jeu, fermeture)",
    "Établir l'organigramme des clés avec le serrurier",
    "Vérifier les appareillages électriques (alignement, fixation, DAAF)",
    "Tester chaque luminaire et point de commande",
    "Exiger les essais de chauffage/rafraîchissement (mise en température)",
    "Demander le PV d'équilibrage des réseaux CVC",
    "Obtenir le Consuel avant mise sous tension définitive",
    "Faire réaliser le nettoyage fin de chantier complet",
    "Réaliser la pré-visite MOE et lister les réserves internes",
    "Relancer les entreprises pour les DOE et notices avant OPR",
  ],
  'AOR': [
    "Organiser les OPR avec toutes les entreprises — PV signés",
    "Diffuser la liste des réserves OPR avec délais de levée",
    "Vérifier la levée des réserves OPR sur site (contradictoire)",
    "Exiger les rapports d'essais COPREC des entreprises",
    "Obtenir le rapport final du contrôleur technique (RVRAT)",
    "Faire établir l'attestation RE2020 de fin de travaux",
    "Faire réaliser le test d'infiltrométrie final",
    "Préparer et faire signer le PV de réception par le MO",
    "Lister les réserves à la réception avec délais contractuels",
    "Suivre et constater la levée des réserves de réception (PV)",
    "Collecter et vérifier le DOE de chaque entreprise",
    "Vérifier les plans de récolement (conformité à l'exécuté)",
    "Récupérer le DIUO auprès du coordonnateur SPS",
    "Transmettre les contrats d'entretien et de maintenance au MO",
    "Remettre l'organigramme des clés et badges au MO",
    "Organiser la formation des utilisateurs aux équipements",
    "Déposer la DAACT en mairie",
    "Informer l'assurance dommages-ouvrage de la réception",
    "Établir le DGD de chaque entreprise",
    "Rédiger le bilan de fin de chantier (REX interne agence)",
  ],
  'OPC': [
    "Établir le planning général de coordination (Gantt tous corps d'état)",
    "Identifier les tâches critiques et le chemin critique",
    "Définir les étapes STOP — points d'arrêt avant phase suivante",
    "Planifier les TMA (Travaux Modificatifs Acquéreurs) et leur délai limite",
    "Intégrer les délais de fabrication/approvisionnement des lots à longue fourniture",
    "Coordonner les plannings d'intervention de chaque entreprise",
    "Vérifier l'absence d'interférence entre lots sur le planning",
    "Organiser les réunions de coordination inter-entreprises",
    "Suivre l'avancement réel vs planning prévisionnel (écart en semaines)",
    "Mettre à jour le planning à chaque RDV de chantier",
    "Identifier et formaliser les retards dès leur apparition",
    "Émettre les mises en demeure en cas de retard non justifié",
    "Coordonner la libération des zones entre les lots",
    "Planifier les périodes de protection des ouvrages finis",
    "S'assurer que chaque entreprise a validé le planning inter-lots",
    "Anticiper les congés et fermetures annuelles dans le planning",
    "Planifier les inspections communes avant réception de support",
    "Coordonner les livraisons (accès, créneaux, stockage temporaire)",
    "Suivre les demandes de prorogation de délais (intempéries, modificatifs)",
    "Mettre à jour le planning de fin de chantier (OPR, levées, réception)",
  ],
}

function dateFR(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

export default function Checklists() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }

  const { profil } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [phaseActive, setPhaseActive] = useState('Démarrage chantier')
  const [modalAjout, setModalAjout] = useState(false)
  const [modalCocher, setModalCocher] = useState(null)
  const [confirmSuppr, setConfirmSuppr] = useState(null)
  const [nouveauItem, setNouveauItem] = useState({ phase: 'Démarrage chantier', description: '' })
  const [observation, setObservation] = useState('')

  useRealtime('checklist_items', charger)
  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('projet_id', id)
      .order('ordre', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (!data || data.length === 0) {
      await injecterBaseItems()
    } else {
      setItems(data)
    }
    setLoading(false)
  }

  async function injecterBaseItems() {
    const now = new Date().toISOString()
    const toInsert = []
    for (const [phase, descs] of Object.entries(BASE_ITEMS)) {
      for (const desc of descs) {
        toInsert.push({
          projet_id: id,
          description: desc,
          phase: phase,
          ordre: toInsert.filter(t => t.phase === phase).length,
          coche: false,
          coche_le: null,
          valide_par: null,
          observation: null,
          assigne_a: null,
          created_at: now,
        })
      }
    }
    const { data } = await supabase.from('checklist_items').insert(toInsert).select()
    setItems(data || [])
  }

  async function cocherItem(item) {
    if (item.coche) {
      // Décocher
      const { data } = await supabase
        .from('checklist_items')
        .update({ coche: false, coche_le: null, valide_par: null, observation: null })
        .eq('id', item.id)
        .select()
        .single()
      setItems(prev => prev.map(i => i.id === item.id ? data : i))
    } else {
      // Ouvrir le modal pour valider
      setModalCocher(item)
      setValidePar('')
      setObservation('')
    }
  }

  async function confirmerCochage() {
    const now = new Date().toISOString()
    const nomUtilisateur = profil
      ? `${profil.prenom || ''} ${profil.nom || ''}`.trim() || profil.email
      : 'Utilisateur'
    const { data } = await supabase
      .from('checklist_items')
      .update({
        coche: true,
        coche_le: now,
        valide_par: nomUtilisateur,
        observation: observation || null,
      })
      .eq('id', modalCocher.id)
      .select()
      .single()
    setItems(prev => prev.map(i => i.id === modalCocher.id ? data : i))
    setModalCocher(null)
    setObservation('')
  }

  async function ajouterItem() {
    if (!nouveauItem.description.trim()) return
    const maxOrdre = Math.max(0, ...items.filter(i => i.phase === nouveauItem.phase).map(i => i.ordre || 0))
    const { data } = await supabase
      .from('checklist_items')
      .insert({
        projet_id: id,
        description: nouveauItem.description,
        phase: nouveauItem.phase,
        ordre: maxOrdre + 1,
        coche: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    setItems(prev => [...prev, data])
    setModalAjout(false)
    setNouveauItem({ phase: phaseActive, description: '' })
    setPhaseActive(nouveauItem.phase)
  }

  async function deplacerItem(item, direction) {
    const liste = items.filter(i => i.phase === item.phase).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
    const idx = liste.findIndex(i => i.id === item.id)
    const cible = direction === 'haut' ? idx - 1 : idx + 1
    if (cible < 0 || cible >= liste.length) return
    const autre = liste[cible]
    const ordreItem = item.ordre ?? idx
    const ordreAutre = autre.ordre ?? cible
    await supabase.from('checklist_items').update({ ordre: ordreAutre }).eq('id', item.id)
    await supabase.from('checklist_items').update({ ordre: ordreItem }).eq('id', autre.id)
    setItems(prev => prev.map(i => {
      if (i.id === item.id) return { ...i, ordre: ordreAutre }
      if (i.id === autre.id) return { ...i, ordre: ordreItem }
      return i
    }))
  }

  async function supprimerItem(item) {
    await supabase.from('checklist_items').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setConfirmSuppr(null)
  }

  const itemsPhase = items.filter(i => i.phase === phaseActive).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
  const coches = itemsPhase.filter(i => i.coche).length
  const total = itemsPhase.length
  const pct = total > 0 ? Math.round((coches / total) * 100) : 0

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Checklists' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        {loading ? <div className="loading">Chargement…</div> : (
          <>
            {/* Sélecteur de phase */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {PHASES_ORDRE.map(p => {
                const n = items.filter(i => i.phase === p).length
                const c = items.filter(i => i.phase === p && i.coche).length
                const isActive = phaseActive === p
                return (
                  <button
                    key={p}
                    onClick={() => setPhaseActive(p)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: isActive ? `2px solid ${PHASES_COULEURS[p]}` : '1px solid var(--bordure)',
                      background: isActive ? PHASES_COULEURS[p] + '18' : 'var(--blanc)',
                      color: isActive ? PHASES_COULEURS[p] : 'var(--texte-sec)',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {p}
                    {n > 0 && (
                      <span style={{
                        marginLeft: 6, fontSize: 10,
                        background: c === n ? '#EAF3DE' : 'rgba(0,0,0,0.08)',
                        color: c === n ? '#3B6D11' : 'inherit',
                        padding: '1px 6px', borderRadius: 10
                      }}>{c}/{n}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Barre de progression */}
            {total > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--texte-sec)', marginBottom: 4 }}>
                  <span>{phaseActive}</span>
                  <span>{coches}/{total} — {pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bordure)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#3B6D11' : PHASES_COULEURS[phaseActive], borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {/* Liste des items */}
            {itemsPhase.length === 0 ? (
              <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Aucun item pour cette phase
              </div>
            ) : (
              itemsPhase.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--bordure)' }}>
                  <input
                    type="checkbox"
                    checked={item.coche}
                    onChange={() => cocherItem(item)}
                    style={{ width: 17, height: 17, marginTop: 2, accentColor: PHASES_COULEURS[phaseActive], cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: item.coche ? 'var(--texte-sec)' : 'var(--texte)',
                      textDecoration: item.coche ? 'line-through' : 'none',
                    }}>
                      {item.description}
                    </div>
                    {item.coche && (
                      <div style={{ fontSize: 11, color: 'var(--texte-sec)', marginTop: 3 }}>
                        ✓ Validé par {item.valide_par} · {dateFR(item.coche_le)}
                        {item.observation && <span style={{ marginLeft: 8, color: '#854F0B' }}>— {item.observation}</span>}
                      </div>
                    )}
                    {!item.coche && item.assigne_a && (
                      <div style={{ fontSize: 11, color: 'var(--texte-sec)', marginTop: 3 }}>
                        Assigné à {item.assigne_a}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
                    <button onClick={() => deplacerItem(item, 'haut')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 11, padding: '0 4px', lineHeight: 1.2 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    >▲</button>
                    <button onClick={() => deplacerItem(item, 'bas')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 11, padding: '0 4px', lineHeight: 1.2 }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--orange)'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    >▼</button>
                  </div>
                  <button
                    onClick={() => setConfirmSuppr(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 16, padding: '2px 4px', borderRadius: 4, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                  >✕</button>
                </div>
              ))
            )}

            <button className="btn-add" style={{ marginTop: 12 }} onClick={() => { setNouveauItem({ phase: phaseActive, description: '' }); setModalAjout(true) }}>
              + Ajouter un item
            </button>
          </>
        )}
      </div>

      {/* Modal cochage */}
      {modalCocher && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Valider cet item</div>
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', marginBottom: 4, lineHeight: 1.5 }}>{modalCocher.description}</div>
            <div style={{ fontSize: 12, color: 'var(--orange)', marginBottom: 16, fontWeight: 500 }}>
              Valide par : {profil ? `${profil.prenom || ''} ${profil.nom || ''}`.trim() || profil.email : 'Utilisateur'}
            </div>
            <div className="form-group">
              <label className="form-label">Observation (optionnel)</label>
              <textarea className="form-input" value={observation} onChange={e => setObservation(e.target.value)} placeholder="Reserve, commentaire..." rows={2} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-save" onClick={confirmerCochage}>Valider</button>
              <button className="btn-cancel" onClick={() => { setModalCocher(null); setObservation('') }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout item */}
      {modalAjout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Ajouter un item</div>
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select className="form-input" value={nouveauItem.phase} onChange={e => setNouveauItem(n => ({ ...n, phase: e.target.value }))}>
                {PHASES_ORDRE.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-input" value={nouveauItem.description} onChange={e => setNouveauItem(n => ({ ...n, description: e.target.value }))} placeholder="Ex: Vérifier les armatures avant coulage…" rows={3} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-save" onClick={ajouterItem} disabled={!nouveauItem.description.trim()}>Ajouter</button>
              <button className="btn-cancel" onClick={() => setModalAjout(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Supprimer cet item</div>
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', marginBottom: 20, lineHeight: 1.5 }}>
              "{confirmSuppr.description}"<br />
              <span style={{ marginTop: 6, display: 'block', color: '#E24B4A' }}>Cette action est irréversible.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => supprimerItem(confirmSuppr)}>Supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
