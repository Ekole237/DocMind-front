# API Contract — Frontend React
>
> Référence complète pour l'agent Frontend · Assistant RH Interne · MVP v1.0
> Source : auth_specs.md · admin_specs.md · chat_specs.md

---

## Conventions globales

```typescript
// Base URL
const API_BASE = process.env.VITE_API_URL // ex: https://api.entreprise.com

// JWT stocké en localStorage
const TOKEN_KEY = 'rh_assistant_token'

// Headers communs pour toutes les requêtes authentifiées
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  'Content-Type': 'application/json',
})

// Structure d'erreur API standard
interface ApiError {
  statusCode: number
  message:    string
  error:      string
}

// Gestion globale des 401 → redirect /login
// Gestion globale des 403 → toast "Accès refusé"
// Gestion globale des 503 → toast "Service indisponible"
```

---

## Routing et redirections

```text
/login                          Page de connexion (public)
/auth/guest/login               Formulaire magic link GUEST (public)
/auth/guest/activate            Activation QR code GUEST (public)
/auth/guest/magic-link/activate Activation magic link GUEST (public)
/chat                           Interface chat (EMPLOYEE + GUEST)
/admin/documents                Admin — documents (ADMIN)
/admin/signalements             Admin — signalements (ADMIN)
/admin/logs                     Admin — logs (ADMIN)
/admin/guests                   Admin — tokens GUEST (ADMIN)

Règles :
  / → redirect selon JWT.role
      EMPLOYEE | GUEST → /chat
      ADMIN            → /admin/documents
      non authentifié  → /login

  JWT expiré → clear localStorage → redirect /login
  403        → toast erreur · rester sur la page
```

---

## AUTH — Authentification

---

### Bouton "Se connecter avec ZOHO"

**Page** : `/login` | **Rôle** : EMPLOYEE

```typescript
// Le frontend redirige simplement vers l'API
// Pas d'appel Axios — redirection navigateur directe
window.location.href = `${API_BASE}/api/auth/zoho`

// Après retour ZOHO → callback géré par le backend
// Le backend redirige vers /chat avec le JWT en query param ou cookie
// Le frontend lit le JWT et le stocke :
const params = new URLSearchParams(window.location.search)
const token = params.get('token')
if (token) {
  localStorage.setItem(TOKEN_KEY, token)
  navigate('/chat')
}
```

**Erreurs à gérer côté frontend** :

```text
?error=cancelled → toast warning : "Connexion annulée. Réessayez."
?error=server    → toast erreur  : "Erreur de connexion. Réessayez."
```

---

### `POST /api/auth/login` — Connexion ADMIN

**Page** : `/login` | **Rôle** : ADMIN uniquement | **CAPTCHA requis**

```typescript
// Payload
interface LoginPayload {
  email:    string  // IsEmail
  password: string  // MinLength(8)
}

// Réponse 200
interface LoginResponse {
  access_token: string
  user: {
    id:    string
    email: string
    role:  'ADMIN'
  }
  expires_in: number  // 28800 secondes = 8h
}

// Usage
const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await axios.post(`${API_BASE}/api/auth/login`, payload)
  localStorage.setItem(TOKEN_KEY, res.data.access_token)
  return res.data
}
```

**Erreurs** :

```text
400 → inline sous le champ concerné : "Email invalide" / "Minimum 8 caractères"
401 → toast erreur : "Identifiants incorrects. Vérifiez votre email et mot de passe."
429 → toast erreur : "Trop de tentatives. Veuillez réessayer dans 15 minutes."
```

---

### `POST /api/auth/guest/magic-link` — Demande magic link

**Page** : `/auth/guest/login` | **Rôle** : GUEST | **CAPTCHA requis**

```typescript
// Payload
interface MagicLinkPayload {
  email:        string  // IsEmail
  captchaToken: string  // reCAPTCHA v3 token
}

// Réponse 200 (identique email reconnu ou non)
interface MagicLinkResponse {
  message: string
  // "Si cet email est associé à un accès actif,
  //  un lien vous a été envoyé. Vérifiez votre boite mail."
}

// Usage
const requestMagicLink = async (payload: MagicLinkPayload) => {
  const res = await axios.post(`${API_BASE}/api/auth/guest/magic-link`, payload)
  return res.data
  // Toujours afficher le message de succès — sécurité par obscurité
}
```

**Erreurs** :

```text
400 → inline : "Adresse email invalide"
429 → toast warning : "Trop de demandes. Attendez quelques minutes."
```

---

### `GET /api/auth/guest/activate` — Activation QR code

**Page** : `/auth/guest/activate` | **Usage** : Première connexion uniquement

```typescript
// Lecture du token depuis l'URL à l'arrivée sur la page
const activateGuestQR = async () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) return navigate('/login')

  const res = await axios.get(
    `${API_BASE}/api/auth/guest/activate?token=${token}`
  )
  localStorage.setItem(TOKEN_KEY, res.data.access_token)
  navigate('/chat')
}

// Réponse 200
interface ActivateResponse {
  access_token: string
  expires_in:   number
}
```

**Erreurs** :

```text
401 used    → page d'erreur : "Ce lien a déjà été utilisé.
                               Demandez un nouveau lien à votre administrateur."
401 expired → page d'erreur : "Ce lien a expiré.
                               Contactez votre administrateur."
404         → redirect /login
```

---

### `GET /api/auth/guest/magic-link/activate` — Activation magic link

**Page** : `/auth/guest/magic-link/activate` | **Usage** : Connexions suivantes

```typescript
// Même logique que l'activation QR — token dans l'URL
const activateMagicLink = async () => {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) return navigate('/auth/guest/login')

  const res = await axios.get(
    `${API_BASE}/api/auth/guest/magic-link/activate?token=${token}`
  )
  localStorage.setItem(TOKEN_KEY, res.data.access_token)
  navigate('/chat')
}
```

**Erreurs** :

```text
401 expired → message : "Ce lien a expiré. Faites une nouvelle demande."
              + bouton → /auth/guest/login
401 used    → message : "Ce lien a déjà été utilisé."
              + bouton → /auth/guest/login
404         → redirect /auth/guest/login
```

---

## CHAT — Interface conversationnelle

---

### `POST /api/chat/query` — Poser une question

**Page** : `/chat` | **Rôle** : EMPLOYEE · GUEST | **Rate limit** : 30/min

```typescript
// Payload
interface QueryPayload {
  question:    string   // MinLength(3) MaxLength(1000)
  context_id?: string   // UUID — pour historique futur (optionnel)
}

// Réponse 200 — avec source
interface QueryResponse {
  answer: string
  source: {
    document_name:    string
    last_modified:    string  // ISO 8601
    drive_url:        string
    confidence_score: number  // [0..1]
  } | null
  contact?: {
    email: string
    label: string
  }
  query_log_id:          string
  response_time_ms:      number
  is_ignorance_response: boolean
}

// Usage
const sendQuery = async (question: string): Promise<QueryResponse> => {
  const res = await axios.post(
    `${API_BASE}/api/chat/query`,
    { question },
    { headers: authHeaders() }
  )
  return res.data
}

// Rendu conditionnel selon is_ignorance_response
if (response.is_ignorance_response) {
  // Afficher : réponse + contact RH + pas de carte source
} else {
  // Afficher : réponse + carte source (document_name + date + lien Drive)
}
```

**Erreurs** :

```text
400 → inline textarea : "Minimum 3 caractères" / "Maximum 1000 caractères"
401 → clear token → redirect /login + toast : "Session expirée. Reconnectez-vous."
429 → toast warning : "Trop de questions. Attendez un moment."
503 → toast erreur  : "Service indisponible. Réessayez dans quelques instants."
     OU si timeout   : "La requête a pris trop de temps. Veuillez réessayer."
```

---

### `POST /api/chat/feedback` — Signaler une réponse incorrecte

**Page** : `/chat` (modal) | **Rôle** : EMPLOYEE · GUEST

```typescript
// Payload
interface FeedbackPayload {
  queryLogId: string   // UUID — IsUUID
  comment?:   string   // MaxLength(500) — optionnel
}

// Réponse 201
interface FeedbackResponse {
  id:         string
  queryLogId: string
  status:     'PENDING'
  createdAt:  string
}

// Usage
const submitFeedback = async (payload: FeedbackPayload): Promise<FeedbackResponse> => {
  const res = await axios.post(
    `${API_BASE}/api/chat/feedback`,
    payload,
    { headers: authHeaders() }
  )
  return res.data
}
```

**Erreurs** :

```text
400 → toast erreur  : "Données invalides."
404 → toast erreur  : "Réponse introuvable."
409 → toast warning : "Cette réponse a déjà été signalée."
```

---

### `GET /api/chat/history` — Historique des questions

**Page** : `/chat` (sidebar) | **Rôle** : EMPLOYEE · GUEST

```typescript
// Query params
interface HistoryParams {
  page?:  number  // défaut 1
  limit?: number  // défaut 20 · max 50
}

// Réponse 200
interface HistoryResponse {
  logs: {
    id:            string
    question:      string
    answer:        string
    sourceDocName: string | null
    isFlagged:     boolean
    isIgnorance:   boolean
    timestamp:     string
  }[]
  total: number
  page:  number
  limit: number
}

// Usage
const getHistory = async (params?: HistoryParams): Promise<HistoryResponse> => {
  const res = await axios.get(`${API_BASE}/api/chat/history`, {
    headers: authHeaders(),
    params,
  })
  return res.data
}
```

---

## ADMIN — Gestion documentaire

---

### `GET /api/admin/dashboard` — Métriques

**Page** : toutes les pages admin (topbar) | **Rôle** : ADMIN

```typescript
// Réponse 200
interface DashboardResponse {
  documentsIndexed: number
  documentsPending: number
  feedbacksPending: number
  queriesThisMonth: number
}

const getDashboard = async (): Promise<DashboardResponse> => {
  const res = await axios.get(`${API_BASE}/api/admin/dashboard`, {
    headers: authHeaders()
  })
  return res.data
}
```

---

### `GET /api/admin/documents` — Liste des documents

**Page** : `/admin/documents` | **Rôle** : ADMIN

```typescript
// Query params
interface DocumentsParams {
  status?: 'PENDING' | 'INDEXED' | 'DISABLED' | 'ERROR'
  page?:   number
  limit?:  number  // défaut 20
}

// Réponse 200
interface DocumentsResponse {
  documents: {
    id:              string
    title:           string
    confidentiality: 'PUBLIC'
    status:          'PENDING' | 'INDEXED' | 'DISABLED' | 'ERROR'
    chunkCount:      number
    lastModified:    string
    createdAt:       string
    driveUrl:        string | null
  }[]
  total: number
  page:  number
  limit: number
}

const getDocuments = async (params?: DocumentsParams) => {
  const res = await axios.get(`${API_BASE}/api/admin/documents`, {
    headers: authHeaders(),
    params,
  })
  return res.data
}
```

---

### `POST /api/admin/documents` — Importer un document

**Page** : `/admin/documents` (modal) | **Rôle** : ADMIN

```typescript
// Payload — multipart/form-data
// file: File (PDF ou DOCX · max 20 Mo)
// confidentiality: 'PUBLIC'
// driveUrl?: string

const importDocument = async (file: File, driveUrl?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('confidentiality', 'PUBLIC')
  if (driveUrl) formData.append('driveUrl', driveUrl)

  const res = await axios.post(`${API_BASE}/api/admin/documents`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
      // Ne pas setter Content-Type — axios le génère avec le boundary
    },
    onUploadProgress: (e) => {
      const percent = Math.round((e.loaded * 100) / (e.total ?? 1))
      setUploadProgress(percent)  // state React pour la barre de progression
    },
  })
  return res.data
}

// Réponse 201
interface ImportResponse {
  id:              string
  title:           string
  confidentiality: 'PUBLIC'
  status:          'PENDING'
  chunkCount:      0
  createdAt:       string
}
```

**Erreurs** :

```text
400 format → toast : "Format non supporté. Utilisez PDF ou DOCX."
400 taille → toast : "Fichier trop volumineux. Maximum 20 Mo."
400 champs → toast : "Tous les champs obligatoires doivent être remplis."
```

---

### `POST /api/admin/documents/:id/index` — Indexer un document

**Page** : `/admin/documents` (action tableau) | **Rôle** : ADMIN

```typescript
const indexDocument = async (documentId: string) => {
  const res = await axios.post(
    `${API_BASE}/api/admin/documents/${documentId}/index`,
    {},
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 202
interface IndexResponse {
  status:     'indexation_started'
  documentId: string
  startedAt:  string
  message:    string
}
```

**Erreurs** :

```text
400 → toast : "Ce document est déjà indexé."
503 → toast : "Service d'indexation indisponible. Réessayez."
```

---

### `PATCH /api/admin/documents/:id/disable` — Désactiver

**Page** : `/admin/documents` (action tableau) | **Rôle** : ADMIN

```typescript
const disableDocument = async (documentId: string) => {
  const res = await axios.patch(
    `${API_BASE}/api/admin/documents/${documentId}/disable`,
    {},
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 200
interface DisableResponse {
  id:     string
  status: 'DISABLED'
  title:  string
}
```

---

### `PATCH /api/admin/documents/:id/enable` — Réactiver

**Page** : `/admin/documents` | **Rôle** : ADMIN

```typescript
const enableDocument = async (documentId: string) => {
  const res = await axios.patch(
    `${API_BASE}/api/admin/documents/${documentId}/enable`,
    {},
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 202
interface EnableResponse {
  status:     'indexation_started'
  documentId: string
  message:    string
}
```

---

### `DELETE /api/admin/documents/:id` — Supprimer

**Page** : `/admin/documents` (modal confirmation) | **Rôle** : ADMIN

```typescript
const deleteDocument = async (documentId: string) => {
  const res = await axios.delete(
    `${API_BASE}/api/admin/documents/${documentId}`,
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 200
interface DeleteResponse {
  deleted:    boolean
  documentId: string
  message:    string
}
```

---

### `GET /api/admin/feedbacks` — Liste des signalements

**Page** : `/admin/signalements` | **Rôle** : ADMIN

```typescript
interface FeedbacksParams {
  status?: 'PENDING' | 'RESOLVED' | 'all'
  page?:   number
}

// Réponse 200
interface FeedbacksResponse {
  feedbacks: {
    id:        string
    status:    'PENDING' | 'RESOLVED'
    comment:   string | null
    createdAt: string
    queryLog: {
      question:      string
      answer:        string
      sourceDocName: string | null
      sourceDriveUrl:string | null
      role:          string
      timestamp:     string
    }
  }[]
  total: number
  page:  number
}

const getFeedbacks = async (params?: FeedbacksParams) => {
  const res = await axios.get(`${API_BASE}/api/admin/feedbacks`, {
    headers: authHeaders(),
    params,
  })
  return res.data
}
```

---

### `PATCH /api/admin/feedbacks/:id/resolve` — Résoudre un signalement

**Page** : `/admin/signalements` | **Rôle** : ADMIN

```typescript
const resolveFeedback = async (feedbackId: string) => {
  const res = await axios.patch(
    `${API_BASE}/api/admin/feedbacks/${feedbackId}/resolve`,
    {},
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 200
interface ResolveResponse {
  id:          string
  status:      'RESOLVED'
  resolvedAt:  string
}
```

---

### `GET /api/admin/logs` — QueryLogs

**Page** : `/admin/logs` | **Rôle** : ADMIN

```typescript
interface LogsParams {
  from?:    string   // ISO 8601
  to?:      string   // ISO 8601
  role?:    'EMPLOYEE' | 'ADMIN'
  flagged?: boolean
  page?:    number
  limit?:   number   // défaut 10
}

// Réponse 200
interface LogsResponse {
  logs: {
    id:             string
    question:       string
    answer:         string
    sourceDocName:  string | null
    role:           string
    isGuest:        boolean
    isFlagged:      boolean
    isIgnorance:    boolean
    responseTimeMs: number | null
    timestamp:      string
  }[]
  total: number
  page:  number
  limit: number
  meta: {
    queriesTotal:  number
    sourcedRate:   string
    ignoranceRate: string
    note:          string
  }
}

const getLogs = async (params?: LogsParams) => {
  const res = await axios.get(`${API_BASE}/api/admin/logs`, {
    headers: authHeaders(),
    params,
  })
  return res.data
}
```

---

### `POST /api/admin/reindex` — Réindexation globale

**Page** : `/admin/documents` | **Rôle** : ADMIN

```typescript
const reindex = async () => {
  const res = await axios.post(
    `${API_BASE}/api/admin/reindex`,
    { confirm: true },
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 202
interface ReindexResponse {
  status:    'indexation_started'
  startedAt: string
  message:   string
}
```

---

### `GET /api/admin/guests` — Liste des tokens GUEST

**Page** : `/admin/guests` | **Rôle** : ADMIN

```typescript
interface GuestsParams {
  active?: boolean
  page?:   number
}

// Réponse 200
interface GuestsResponse {
  guests: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
    expiresAt: string
    used:      boolean
    expired:   boolean
    createdAt: string
  }[]
  total: number
}

const getGuests = async (params?: GuestsParams) => {
  const res = await axios.get(`${API_BASE}/api/admin/guests`, {
    headers: authHeaders(),
    params,
  })
  return res.data
}
```

---

### `POST /api/admin/guests` — Créer un token GUEST

**Page** : `/admin/guests` (modal) | **Rôle** : ADMIN

```typescript
interface CreateGuestPayload {
  firstName: string   // IsString
  lastName:  string   // IsString
  email:     string   // IsEmail — email personnel
  expiresAt: string   // ISO 8601 — futur uniquement
}

// Réponse 201
interface CreateGuestResponse {
  id:          string
  email:       string
  expiresAt:   string
  activateUrl: string   // ⚠️ afficher UNE SEULE FOIS — générer QR code depuis cette URL
  createdAt:   string
}

const createGuest = async (payload: CreateGuestPayload) => {
  const res = await axios.post(`${API_BASE}/api/admin/guests`, payload, {
    headers: authHeaders()
  })
  return res.data
  // Générer QR code depuis res.data.activateUrl côté frontend
  // ex: qrcode.toDataURL(res.data.activateUrl)
}
```

**Erreurs** :

```text
400 → inline : champ manquant / email invalide / date dans le passé
409 → toast  : "Un compte actif existe déjà pour cet email."
```

---

### `PATCH /api/admin/guests/:id/extend` — Prolonger un token GUEST

**Page** : `/admin/guests` | **Rôle** : ADMIN

```typescript
const extendGuest = async (guestId: string, expiresAt: string) => {
  const res = await axios.patch(
    `${API_BASE}/api/admin/guests/${guestId}/extend`,
    { expiresAt },
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 200
interface ExtendGuestResponse {
  id:          string
  email:       string
  expiresAt:   string
  activateUrl: string  // nouveau one-time link à transmettre
}
```

---

### `DELETE /api/admin/guests/:id` — Révoquer un token GUEST

**Page** : `/admin/guests` | **Rôle** : ADMIN

```typescript
const revokeGuest = async (guestId: string) => {
  const res = await axios.delete(
    `${API_BASE}/api/admin/guests/${guestId}`,
    { headers: authHeaders() }
  )
  return res.data
}

// Réponse 200
interface RevokeGuestResponse {
  deleted:      boolean
  guestTokenId: string
  message:      string
}
```

---

## Tableau récapitulatif complet

| Méthode | Route | Rôle | Page | Description |
|---------|-------|------|------|-------------|
| `GET` | `/api/auth/zoho` | Public | `/login` | Initie ZOHO OAuth |
| `POST` | `/api/auth/login` | Public | `/login` | Login ADMIN fallback |
| `POST` | `/api/auth/guest/magic-link` | Public | `/auth/guest/login` | Demande magic link |
| `GET` | `/api/auth/guest/activate` | Public | `/auth/guest/activate` | Active QR code |
| `GET` | `/api/auth/guest/magic-link/activate` | Public | `/auth/guest/magic-link/activate` | Active magic link |
| `POST` | `/api/chat/query` | EMPLOYEE · GUEST | `/chat` | Question RAG |
| `POST` | `/api/chat/feedback` | EMPLOYEE · GUEST | `/chat` | Signaler réponse |
| `GET` | `/api/chat/history` | EMPLOYEE · GUEST | `/chat` | Historique |
| `GET` | `/api/admin/dashboard` | ADMIN | Admin (global) | Métriques |
| `GET` | `/api/admin/documents` | ADMIN | `/admin/documents` | Liste documents |
| `POST` | `/api/admin/documents` | ADMIN | `/admin/documents` | Importer |
| `POST` | `/api/admin/documents/:id/index` | ADMIN | `/admin/documents` | Indexer |
| `PATCH` | `/api/admin/documents/:id/disable` | ADMIN | `/admin/documents` | Désactiver |
| `PATCH` | `/api/admin/documents/:id/enable` | ADMIN | `/admin/documents` | Réactiver |
| `DELETE` | `/api/admin/documents/:id` | ADMIN | `/admin/documents` | Supprimer |
| `GET` | `/api/admin/feedbacks` | ADMIN | `/admin/signalements` | Signalements |
| `PATCH` | `/api/admin/feedbacks/:id/resolve` | ADMIN | `/admin/signalements` | Résoudre |
| `GET` | `/api/admin/logs` | ADMIN | `/admin/logs` | QueryLogs |
| `POST` | `/api/admin/reindex` | ADMIN | `/admin/documents` | Réindexation |
| `GET` | `/api/admin/guests` | ADMIN | `/admin/guests` | Tokens GUEST |
| `POST` | `/api/admin/guests` | ADMIN | `/admin/guests` | Créer GUEST |
| `PATCH` | `/api/admin/guests/:id/extend` | ADMIN | `/admin/guests` | Prolonger |
| `DELETE` | `/api/admin/guests/:id` | ADMIN | `/admin/guests` | Révoquer |

---

## Use Cases Frontend par page

### `/login`

```text
UC-F01  Afficher bouton "Se connecter avec ZOHO" → redirect API
UC-F02  Afficher formulaire email/password ADMIN (collapsible ou onglet)
UC-F03  Valider les champs en temps réel (blur)
UC-F04  Gérer les états : idle → loading → success → error
UC-F05  Lire le token JWT depuis l'URL au retour ZOHO
UC-F06  Stocker le JWT en localStorage
UC-F07  Rediriger selon le rôle JWT après connexion
```

### `/auth/guest/login`

```text
UC-F08  Afficher formulaire email + CAPTCHA
UC-F09  Afficher message de succès identique toujours (obscurité)
UC-F10  Gérer 429 : désactiver le bouton N secondes
```

### `/auth/guest/activate` et `/auth/guest/magic-link/activate`

```text
UC-F11  Lire le token dans l'URL au chargement de la page
UC-F12  Appeler l'API automatiquement (pas de bouton)
UC-F13  Stocker le JWT et rediriger vers /chat
UC-F14  Afficher les messages d'erreur appropriés (expiré / déjà utilisé)
```

### `/chat`

```text
UC-F15  Charger l'historique des conversations (sidebar)
UC-F16  Afficher l'état vide avec suggestions de questions
UC-F17  Envoyer une question + afficher l'indicateur de chargement (3 points)
UC-F18  Afficher la réponse avec carte source (document + date + lien Drive)
UC-F19  Afficher la réponse d'ignorance avec contact RH
UC-F20  Afficher les boutons de feedback sous chaque réponse assistant
UC-F21  Ouvrir le modal de signalement au clic "Réponse incorrecte"
UC-F22  Soumettre le signalement + toast succès
UC-F23  Auto-scroll vers le bas à chaque nouveau message
UC-F24  Compteur de caractères (800/1000 → orange · 950/1000 → rouge)
UC-F25  Shift+Entrée = saut de ligne · Entrée = envoi
```

### `/admin/documents`

```text
UC-F26  Afficher les 4 métriques du dashboard
UC-F27  Afficher l'alerte si documents en attente
UC-F28  Lister les documents avec tri par colonnes
UC-F29  Ouvrir le modal d'import avec barre de progression
UC-F30  Attribuer la confidentialité PUBLIC avant indexation
UC-F31  Indexer un document + polling du statut jusqu'à INDEXED
UC-F32  Désactiver avec modal de confirmation
UC-F33  Supprimer avec modal de confirmation (irréversible)
UC-F34  Déclencher la réindexation globale avec confirmation
```

### `/admin/signalements`

```text
UC-F35  Lister les signalements avec filtre PENDING / RESOLVED / all
UC-F36  Afficher le détail question + réponse + commentaire
UC-F37  Marquer comme résolu + mise à jour instantanée du badge
```

### `/admin/logs`

```text
UC-F38  Afficher les métriques du mois (taux sourcé, ignorance)
UC-F39  Filtrer par date, rôle, flagué
UC-F40  Paginer les résultats (10 par page)
UC-F41  Exporter en CSV les logs filtrés
```

### `/admin/guests`

```text
UC-F42  Lister les tokens GUEST avec statut (actif / expiré / utilisé)
UC-F43  Créer un token GUEST + générer le QR code depuis l'activateUrl
UC-F44  Afficher le QR code UNE SEULE FOIS avec bouton télécharger
UC-F45  Prolonger un token + afficher le nouveau lien
UC-F46  Révoquer un token avec confirmation
```
