import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../useRealtime'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Tous', 'DTU', 'Guide interne', 'Courriel type']
const CATEGORIES_CREATION = ['DTU', 'Guide interne', 'Courriel type']
const CATEGORIE_COLORS = {
  'DTU':           { bg: '#EEEDFE', color: '#534AB7' },
  'Guide interne': { bg: '#EAF3DE', color: '#3B6D11' },
  'Courriel type': { bg: '#FAEEDA', color: '#854F0B' },
}

const DTU_BASE = [
  { reference: 'NF DTU 13.1', titre: 'Fondations superficielles', resume: "Ce DTU définit les règles techniques d'exécution des fondations superficielles (semelles isolées, filantes, radiers) pour les bâtiments courants. Il précise les dispositions constructives et les contrôles applicables au fond de fouille, aux armatures et au coulage.", points_cles: ["Réception du fond de fouille par le géotechnicien (mission G3 ou G4)", "Béton de propreté systématique avant coulage des semelles", "Enrobage minimum des armatures : 3 cm en milieu courant, 5 cm en milieu agressif", "Ancrage des attentes en fondation conforme aux plans BET", "Coulage à sec — pas de coulage sous eau sans dispositions particulières", "Prélèvement d'éprouvettes béton à chaque coulage significatif"], tolerances: "Écart d'implantation : ±20 mm en plan. Écart d'altimétrie du fond de fouille : ±30 mm. Écart de dimensions de section : ±20 mm." },
  { reference: 'NF DTU 13.3', titre: 'Dallages sur terre-plein', resume: "Encadre la conception et l'exécution des dallages en béton posés sur terre-plein pour bâtiments industriels, commerciaux et résidentiels. Distingue trois catégories selon la destination et les charges.", points_cles: ["Étude de sol préalable obligatoire pour dallages de catégories 1 et 2", "Forme drainante et compactage de la plateforme (PV de compactage)", "Film polyane (200µ min.) sous le dallage pour rupture capillarité", "Joints de retrait à espacer de 5 à 6 m maximum", "Cure du béton pendant au moins 7 jours", "Vérification de la planéité avant travaux de second oeuvre"], tolerances: "Planéité générale : 7 mm sous règle de 2 m. Planéité locale : 2 mm sous réglet de 20 cm. Écart d'altimétrie : ±10 mm sur l'ensemble." },
  { reference: 'NF DTU 20.1', titre: 'Ouvrages en maçonnerie de petits éléments', resume: "Définit les règles d'exécution des parois et murs en maçonnerie traditionnelle : blocs béton, briques terre cuite, béton cellulaire, pierre. Couvre murs simples, composites, doubles, avec ou sans doublage.", points_cles: ["Vérification de l'humidité et de la conformité des blocs avant pose", "Coupure de capillarité (arase étanche) en pied de mur systématique", "Chaînages verticaux aux angles et intersections (section acier ≥ 1,5 cm²)", "Chaînages horizontaux au niveau de chaque plancher", "Joints de dilatation tous les 20 m maximum (façades longues)", "Protection contre le gel et la pluie battante en cours d'exécution"], tolerances: "Verticalité : ±20 mm par étage, ±50 mm sur toute la hauteur du bâtiment. Planéité : 10 mm sous règle de 2 m. Épaisseur de paroi : ±10 mm." },
  { reference: 'NF DTU 21', titre: 'Exécution des ouvrages en béton', resume: "Règles d'exécution des ouvrages coulés en place en béton armé ou non armé, y compris coffrage, ferraillage, bétonnage, décoffrage et cure. Référence pour tout ouvrage GO courant.", points_cles: ["Visa des plans d'exécution coffrage/ferraillage par le BET avant chaque coulage", "Contrôle des armatures avant coulage (espacement, recouvrement, calage)", "Vibration systématique du béton — pas de béton non vibré en zone armée", "Cure du béton en période sèche ou chaude (arrosage, produits de cure)", "Éprouvettes de contrôle à conserver 28 jours minimum", "Traitement des reprises de bétonnage (piquage, humidification)"], tolerances: "Aplomb voiles : ±15 mm sur hauteur étage, ±30 mm sur ensemble bâtiment. Planéité dalles : 7 mm sous règle 2 m. Section poteaux/poutres : ±10 mm." },
  { reference: 'NF DTU 23.1', titre: 'Murs en béton banché', resume: "Traite spécifiquement des murs en béton coulé en place à l'aide de banches, courants en logement collectif. Distinct du DTU 21 par ses dispositions particulières sur les banches et la peau de béton.", points_cles: ["Cycle de rotation des banches à valider (séchage minimum requis)", "Traitement soigné des joints de banches (bandes, joints creux)", "Vibration avec aiguille adaptée à l'épaisseur du voile", "Cure impérative en période chaude ou ventée", "Ragréage et traitement du bullage avant peinture/enduit", "Contrôle des réservations (trémies, gaines) avant chaque coulage"], tolerances: "Aplomb : ±10 mm par étage. Planéité générale sous règle 2 m : 7 mm. Épaisseur : ±10 mm." },
  { reference: 'NF DTU 25.41', titre: 'Ouvrages en plaques de plâtre', resume: "Règles de mise en oeuvre des cloisons, doublages et plafonds en plaques de plâtre sur ossature métallique. Couvre les BA13 standard, hydrofuges, coupe-feu et acoustiques.", points_cles: ["Vérification du support et de son hygrométrie avant pose", "Ossature métallique conforme (entraxe, ancrages, joints de dilatation)", "Utilisation de plaques hydrofuges (BA13 vert) en pièces humides", "Traitement des joints en 3 passes minimum (bande, enduit, ponçage)", "Renforts dans cloisons pour équipements lourds", "Trappes de visite aux emplacements techniques"], tolerances: "Planéité générale : 5 mm sous règle 2 m. Aplomb : 5 mm sur hauteur étage. Écart entre lèvres de joint : 1 mm max." },
  { reference: 'NF DTU 26.1', titre: 'Enduits aux mortiers de ciment, de chaux et de plâtre', resume: "Traite des enduits intérieurs et extérieurs traditionnels appliqués manuellement ou mécaniquement. Précise les compositions, épaisseurs et conditions d'exécution.", points_cles: ["Réception du support (propreté, humidité, planéité, absorption)", "Application en 3 couches minimum en extérieur (gobetis, corps, finition)", "Épaisseur totale minimale : 15 mm en extérieur, 10 mm en intérieur", "Temps de séchage entre couches selon conditions (48h min. par couche)", "Protection contre le vent, la pluie, le gel et le soleil direct", "Réalisation d'un échantillon de référence à faire valider"], tolerances: "Planéité générale : 5 mm sous règle 2 m. Planéité locale : 2 mm sous réglet 20 cm. Épaisseur : conforme à ±3 mm." },
  { reference: 'NF DTU 26.2', titre: 'Chapes et dalles à base de liants hydrauliques', resume: "Règles pour l'exécution des chapes rapportées (adhérentes, désolidarisées, flottantes) et dalles sur planchers. Support essentiel pour les revêtements de sol.", points_cles: ["Nature de la chape adaptée au support et au revêtement prévu", "Épaisseur minimale selon type : 20 mm adhérente, 40 mm désolidarisée, 40 mm flottante", "Bande périphérique compressible en chape flottante", "Joints de fractionnement tous les 40 m² maximum", "Temps de séchage : 4 semaines par cm d'épaisseur avant revêtement collé", "Mesure d'humidité (bombe à carbure) avant pose du revêtement"], tolerances: "Planéité générale : 7 mm sous règle 2 m. Planéité locale : 2 mm sous réglet 20 cm. Écart altimétrie : ±10 mm." },
  { reference: 'NF DTU 31.2', titre: 'Construction de maisons et bâtiments à ossature bois', resume: "Encadre la construction des bâtiments à ossature bois pour maisons individuelles et petits collectifs. Traite structure, isolation, pare-vapeur et étanchéité à l'air.", points_cles: ["Classe d'emploi du bois adaptée à l'exposition (classes 2 à 4)", "Continuité du pare-vapeur — traitement soigné des jonctions", "Étanchéité à l'air : test d'infiltrométrie recommandé (RE2020)", "Ventilation de la lame d'air derrière le bardage extérieur", "Protection des bois en pied de mur (relevé étanchéité ≥ 20 cm)", "Fixations et ancrages conformes aux calculs sismiques et vent"], tolerances: "Aplomb ossature : 5 mm par étage. Planéité mur fini : 5 mm sous règle 2 m." },
  { reference: 'NF DTU 36.5', titre: 'Mise en oeuvre des fenêtres et portes extérieures', resume: "Encadre la pose des menuiseries extérieures (bois, PVC, aluminium, mixtes) en neuf et rénovation. Couvre choix de la pose, fixations, calfeutrement et étanchéité.", points_cles: ["Contrôle des dimensions du tableau avant fabrication (relevé)", "Type de pose adapté au support : au nu extérieur, en tunnel, en applique", "Calfeutrement extérieur avec joint compribande ou mastic de première catégorie", "Continuité de l'étanchéité à l'air côté intérieur", "Fixations conformes selon nature et épaisseur du support", "Vérification du fonctionnement (aplomb, jeu ouvrant, verrouillage)"], tolerances: "Aplomb dormant : 2 mm par mètre. Écart de diagonale : 3 mm. Jeu périphérique dormant/gros oeuvre : 10 à 20 mm." },
  { reference: 'NF DTU 40.11', titre: 'Couverture en ardoises', resume: "Règles de pose des couvertures en ardoises naturelles ou de fibrociment sur charpente traditionnelle. Précise pentes, recouvrements et fixations selon zone climatique.", points_cles: ["Pente minimale selon zone climatique (généralement 22° à 35°)", "Écran sous-toiture obligatoire en zone climatique exposée", "Recouvrement des ardoises adapté à la pente et à l'exposition", "Fixation par crochets inox ou clous cuivre (2 par ardoise minimum)", "Traitement des points singuliers (faîtage, arêtiers, noues, rives)", "Zinguerie de raccordement aux souches et pénétrations"], tolerances: "Alignement des rangs : 5 mm sur 3 m." },
  { reference: 'NF DTU 40.21', titre: 'Couverture en tuiles de terre cuite à emboîtement', resume: "Encadre la pose des tuiles à emboîtement ou à glissement pour toitures en pente. La plus courante des couvertures en France.", points_cles: ["Pente minimale selon zone climatique et longueur de rampant", "Écran sous-toiture selon zone et pente (obligatoire zones 2 et 3)", "Ventilation de la sous-face de couverture", "Fixation d'une tuile sur trois en zone courante, toutes en rive et faîtage", "Traitement soigné des raccords aux souches (solins plomb ou zinc)", "Chevronnage et voligeage conformes aux prescriptions du fabricant"], tolerances: "Alignement des rangs : 5 mm sur 3 m de longueur." },
  { reference: 'NF DTU 43.1', titre: 'Étanchéité des toitures-terrasses en maçonnerie', resume: "Règles d'exécution des étanchéités bitumineuses ou synthétiques sur éléments porteurs maçonnés (dalles béton), en climat de plaine. Distingue toitures accessibles, inaccessibles et jardins.", points_cles: ["Réception du support par l'étancheur (planéité, propreté, humidité)", "Pente minimale 1% pour toitures inaccessibles, 1,5% pour accessibles", "Pare-vapeur en toiture chaude (obligatoire selon hygrométrie du local)", "Relevés d'étanchéité en périphérie : hauteur minimale 15 cm", "Essai de mise en eau ou contrôle de la mise hors d'eau", "Naissances et trop-pleins dimensionnés selon surface collectée"], tolerances: "Planéité du support : 10 mm sous règle 2 m. Pente : écart admissible ±0,5%." },
  { reference: 'NF DTU 45.10', titre: 'Isolation des combles par soufflage', resume: "Concerne l'isolation par soufflage de laines minérales ou de biosourcés dans les combles perdus. Essentiel pour l'atteinte des performances RE2020.", points_cles: ["Vérification préalable de la ventilation du comble", "Épaisseur soufflée conforme à l'étude thermique (marquage sur repères)", "Écran pare-vapeur en sous-face si requis par l'étude hygrothermique", "Coffrage des points singuliers (spots, trappes, cheminées)", "Pare-vent en rive pour éviter le déplacement de l'isolant", "PV de fin de travaux avec masse et épaisseur mises en oeuvre"], tolerances: "Épaisseur soufflée conforme au tassement admissible du produit." },
  { reference: 'NF DTU 52.1', titre: 'Revêtements de sol scellés', resume: "Encadre la pose scellée de carrelage céramique, grès cérame et pierres naturelles sur support en mortier. Alternative à la pose collée (DTU 52.2).", points_cles: ["Épaisseur minimale du mortier : 5 cm en pose désolidarisée", "Temps de séchage du mortier avant pose du carrelage", "Battage des carreaux pour transmission au mortier", "Joints entre carreaux : 3 mm minimum (adaptés au format)", "Joints de fractionnement tous les 40 m² et à chaque changement de support", "Protection de la surface pendant durée de séchage"], tolerances: "Planéité générale : 5 mm sous règle 2 m. Alignement des joints : ≤ 2 mm." },
  { reference: 'NF DTU 52.2', titre: 'Pose collée des revêtements céramiques', resume: "Règles de pose collée en simple ou double encollage sur supports traditionnels et sensibles (chape anhydrite, plancher chauffant). Le plus utilisé actuellement.", points_cles: ["Contrôle de la planéité et de la propreté du support avant collage", "Mesure de l'humidité de la chape (bombe à carbure) avant pose", "Choix de la colle adapté au support et au format des carreaux", "Simple ou double encollage selon format (double obligatoire ≥ 30x30 cm en extérieur)", "Temps ouvert respecté (contrôle du transfert de colle)", "Joints de fractionnement à traiter avec mastic élastomère"], tolerances: "Planéité générale : 5 mm sous règle 2 m. Écart de niveau entre carreaux adjacents : ≤ 1 mm." },
  { reference: 'NF DTU 55.2', titre: "Bardages rapportés en éléments minces", resume: "Concerne les revêtements de façade rapportés sur ossature secondaire (bois, métal, panneaux composites). Couvre l'ITE avec bardage ventilé.", points_cles: ["Ossature secondaire adaptée au support et au bardage", "Ventilation de la lame d'air (entrée basse + sortie haute)", "Pare-pluie sur l'isolant si prévu", "Traitement des points singuliers (rives, angles, encadrements)", "Compatibilité électrolytique des fixations avec le bardage", "Contrôle du calepinage et des joints avant fin de pose"], tolerances: "Planéité générale : 5 mm sous règle 2 m. Aplomb : 5 mm sur hauteur étage." },
  { reference: 'NF DTU 59.1', titre: 'Revêtements de peinture', resume: "Règles d'application des peintures en travaux neufs et rénovation, intérieurs et extérieurs. Précise préparation des supports, nombre de couches et rendus.", points_cles: ["Réception du support (subjectile) selon critères de conformité", "Nombre de couches minimum : impression + 2 finitions (rendu C)", "Poncage/égrenage entre couches obligatoire", "Temps de séchage entre couches respecté", "Conditions ambiantes contrôlées (T° > 5°C, hygrométrie < 80%)", "Réalisation d'un échantillon de teinte à faire valider"], tolerances: "Le DTU définit 4 catégories de finition (élémentaire, courante, soignée, très soignée)." },
  { reference: 'NF DTU 60.1', titre: 'Plomberie sanitaire pour bâtiment', resume: "Règles générales pour les installations de plomberie sanitaire : distribution EF/EC, évacuations EU/EV, matériaux et essais. Base de tout projet de plomberie.", points_cles: ["Dimensionnement des canalisations selon débits simultanés", "Vitesse d'écoulement limitée (2 m/s max pour éviter les bruits)", "Pente des évacuations : 1 à 3% pour les eaux usées", "Ventilation primaire et secondaire des colonnes de chute", "Essais d'étanchéité sous pression (1,5 fois pression de service, 1 heure)", "Isolation phonique des colonnes en logement collectif"], tolerances: "Pentes conformes au projet, écart admissible ±0,5%. Essais d'étanchéité : aucune fuite tolérée." },
  { reference: 'NF DTU 68.3', titre: "Installations de ventilation mécanique", resume: "Concerne les installations de VMC simple flux et double flux dans le résidentiel. Essentiel pour la qualité de l'air intérieur et la performance énergétique.", points_cles: ["Bouches d'extraction dimensionnées selon débits réglementaires", "Réseau de gaines étanche (test d'étanchéité en double flux)", "Isolation thermique des gaines en volume non chauffé", "Sorties en toiture éloignées des entrées d'air (≥ 8 m)", "Mesure des débits à la réception (bouche par bouche)", "Notice de fonctionnement et d'entretien remise au MO"], tolerances: "Écart de débit mesuré / prescrit : ±10% par bouche. Test d'étanchéité réseau : classe A minimum (double flux)." },
]

export default function Guides() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const { peutModifierCollabs, profil, deconnexion } = useAuth()

  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreCat, setFiltreCat] = useState('Tous')
  const [recherche, setRecherche] = useState('')
  const [confirmSuppr, setConfirmSuppr] = useState(null)
  const [modalNouveau, setModalNouveau] = useState(false)
  const [nouveauGuide, setNouveauGuide] = useState({ categorie: 'Guide interne', titre: '', reference: '' })
  const [savingNouv, setSavingNouv] = useState(false)

  useRealtime('guides', charger)
  useEffect(() => { charger() }, [])

  async function charger() {
    const { data } = await supabase
      .from('guides')
      .select('*')
      .order('reference', { ascending: true })

    if (!data || data.length === 0) {
      await injecterDTUBase()
    } else {
      setGuides(data)
    }
    setLoading(false)
  }

  async function injecterDTUBase() {
    const now = new Date().toISOString()
    const toInsert = DTU_BASE.map(d => ({
      categorie: 'DTU',
      reference: d.reference,
      titre: d.titre,
      resume: d.resume,
      points_cles: d.points_cles,
      tolerances: d.tolerances,
      created_at: now,
    }))
    const { data } = await supabase.from('guides').insert(toInsert).select()
    setGuides(data || [])
  }

  async function creerGuide() {
    if (!nouveauGuide.titre.trim()) return
    setSavingNouv(true)
    const { data } = await supabase.from('guides').insert({
      categorie: nouveauGuide.categorie,
      titre: nouveauGuide.titre,
      reference: nouveauGuide.reference,
      resume: '',
      points_cles: [],
      tolerances: '',
      contenu: '',
      created_at: new Date().toISOString(),
    }).select().single()
    setSavingNouv(false)
    setModalNouveau(false)
    setNouveauGuide({ categorie: 'Guide interne', titre: '', reference: '' })
    if (data) navigate(`/projet/${id}/guides/${data.id}`, { state: { projet, guide: data } })
  }

  async function supprimer(guide) {
    await supabase.from('guides').delete().eq('id', guide.id)
    setConfirmSuppr(null)
    charger()
  }

  const guidesFiltres = guides.filter(g => {
    const q = recherche.toLowerCase()
    const matchCat = filtreCat === 'Tous' || g.categorie === filtreCat
    const matchQ = !q || g.titre?.toLowerCase().includes(q) || g.reference?.toLowerCase().includes(q) || g.resume?.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Guides et procédures' },
        ]}
        phase={projet.phase}
        profil={profil}
        onDeconnexion={deconnexion}
      />
      <div className="content">
        {/* Filtres + recherche */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFiltreCat(c)} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                fontFamily: 'inherit', cursor: 'pointer',
                border: filtreCat === c ? '2px solid #FF8C00' : '1px solid var(--bordure)',
                background: filtreCat === c ? '#FFF3E0' : 'var(--blanc)',
                color: filtreCat === c ? '#FF8C00' : 'var(--texte-sec)',
                fontWeight: filtreCat === c ? 600 : 400,
              }}>{c}</button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              style={{ padding: '6px 12px', width: 220, margin: 0, fontSize: 13 }}
              placeholder="Rechercher..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />
          </div>
        </div>

        {loading ? <div className="loading">Chargement...</div>
          : guidesFiltres.length === 0 ? (
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
              Aucun guide dans cette catégorie
            </div>
          ) : guidesFiltres.map(g => {
            const cc = CATEGORIE_COLORS[g.categorie] || {}
            return (
              <div key={g.id} className="list-item" style={{ alignItems: 'flex-start', padding: '12px', gap: 8 }}>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/projet/${id}/guides/${g.id}`, { state: { projet, guide: g } })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: cc.bg, color: cc.color, fontSize: 11 }}>{g.categorie}</span>
                    {g.reference && <span style={{ fontSize: 12, color: 'var(--texte-sec)', fontWeight: 500 }}>{g.reference}</span>}
                  </div>
                  <div className="item-nom" style={{ marginTop: 4 }}>{g.titre}</div>
                  {g.resume && (
                    <div className="item-sub" style={{
                      marginTop: 4, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>{g.resume}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="arrow" style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projet/${id}/guides/${g.id}`, { state: { projet, guide: g } })}>›</span>
                  {peutModifierCollabs && (
                    <button
                      onClick={() => setConfirmSuppr(g)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 18, padding: '4px 6px', borderRadius: 6 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                    >✕</button>
                  )}
                </div>
              </div>
            )
          })
        }

        {peutModifierCollabs && (
          <button className="btn-add" onClick={() => setModalNouveau(true)}>
            + Nouveau guide
          </button>
        )}
      </div>

      {/* Modal nouveau guide */}
      {modalNouveau && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Nouveau guide</div>
            <div className="form-group">
              <label className="form-label">Catégorie *</label>
              <select className="form-input" value={nouveauGuide.categorie}
                onChange={e => setNouveauGuide(n => ({ ...n, categorie: e.target.value }))}>
                {CATEGORIES_CREATION.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input className="form-input" value={nouveauGuide.titre}
                onChange={e => setNouveauGuide(n => ({ ...n, titre: e.target.value }))}
                placeholder="Ex: Modèle courriel de convocation OPR" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Référence (optionnel)</label>
              <input className="form-input" value={nouveauGuide.reference}
                onChange={e => setNouveauGuide(n => ({ ...n, reference: e.target.value }))}
                placeholder="Ex: NF DTU 42.1 ou GUI-001" />
            </div>
            <div className="btn-row">
              <button className="btn-save" onClick={creerGuide} disabled={savingNouv || !nouveauGuide.titre.trim()}>
                {savingNouv ? 'Création...' : 'Créer et éditer'}
              </button>
              <button className="btn-cancel" onClick={() => setModalNouveau(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Supprimer ce guide</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Voulez-vous supprimer <strong>"{confirmSuppr.titre}"</strong> ?
              <span style={{ display: 'block', marginTop: 6, color: '#E24B4A' }}>Cette action est irréversible.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => supprimer(confirmSuppr)}>Supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
