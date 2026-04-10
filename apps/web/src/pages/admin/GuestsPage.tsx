import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Check, Copy, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import { admin } from "../../api/client"
import { AdminLayout } from "../../components/layout/AdminLayout"
import type { ApiError, GuestToken, CreateGuestTokenResult, ExtendGuestTokenResult } from "../../types"

const LIMIT = 10

function getApiMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: ApiError } }
  return e.response?.data?.message ?? fallback
}

function getApiCode(err: unknown): string | undefined {
  const e = err as { response?: { data?: ApiError } }
  return e.response?.data?.code
}

// ---- Create Guest Modal ----
interface CreateModalProps {
  onClose: () => void
  onSuccess: () => void
}

function CreateModal({ onClose, onSuccess }: CreateModalProps) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", expiresAt: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CreateGuestTokenResult | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.expiresAt) {
      setError("Tous les champs sont requis.")
      return
    }
    if (new Date(form.expiresAt) <= new Date()) {
      setError("La date d'expiration doit être dans le futur.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await admin.createGuest({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        expiresAt: new Date(form.expiresAt).toISOString(),
      })
      setResult(res)
    } catch (err) {
      if (getApiCode(err) === "USER_ALREADY_EXISTS") {
        setError("Cet email est déjà enregistré.")
      } else {
        setError(getApiMessage(err, "Erreur lors de la création"))
      }
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-4 font-semibold text-lg text-success">Accès créé</h2>
          <div className="flex flex-col items-center mb-4">
            <div className="mb-4 rounded-lg bg-white p-4">
              <QRCode value={result.activateUrl} size={150} />
            </div>
            <div className="flex w-full items-center justify-between gap-2 rounded border border-border bg-muted/50 p-2">
              <span className="truncate flex-1 font-mono text-sm">{result.activateUrl}</span>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.activateUrl)}>Copier le lien</Button>
            </div>
          </div>
          <div className="mb-6 rounded bg-orange-500/10 p-3 text-center text-sm font-medium text-orange-500">
            ⚠️ Ce lien ne sera plus affiché. Transmettez-le maintenant.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => { onSuccess(); onClose() }}>Fermer</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-4 font-semibold text-lg">Créer un accès invité</h2>
        {error && <div className="mb-3 rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Prénom <span className="text-destructive">*</span></label>
              <Input value={form.firstName} onChange={set("firstName")} placeholder="Jean" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nom <span className="text-destructive">*</span></label>
              <Input value={form.lastName} onChange={set("lastName")} placeholder="Dupont" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="jean.dupont@exemple.com" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expire le <span className="text-destructive">*</span></label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={set("expiresAt")}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "Création..." : "Créer"}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Extend Modal ----
interface ExtendModalProps {
  guest: GuestToken
  onClose: () => void
  onSuccess: () => void
}

function ExtendModal({ guest, onClose, onSuccess }: ExtendModalProps) {
  const [expiresAt, setExpiresAt] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtendGuestTokenResult | null>(null)

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!expiresAt) { setError("Date requise."); return }
    if (new Date(expiresAt) <= new Date()) { setError("La date doit être dans le futur."); return }
    setLoading(true)
    try {
      const res = await admin.extendGuest(guest._id, new Date(expiresAt).toISOString())
      setResult(res)
    } catch (err) {
      setError(getApiMessage(err, "Erreur lors de la prolongation"))
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
          <h2 className="mb-4 font-semibold text-lg text-success">Accès prolongé</h2>
          <div className="flex flex-col items-center mb-4">
            <div className="mb-4 rounded-lg bg-white p-4">
              <QRCode value={result.activateUrl} size={150} />
            </div>
            <div className="flex w-full items-center justify-between gap-2 rounded border border-border bg-muted/50 p-2">
              <span className="truncate flex-1 font-mono text-sm">{result.activateUrl}</span>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(result.activateUrl)}>Copier</Button>
            </div>
          </div>
          <p className="mb-6 mt-2 text-center text-sm font-medium text-muted-foreground">Un email a également été envoyé au guest.</p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { onSuccess(); onClose() }}>Fermer</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-1 font-semibold">Prolonger l'accès</h2>
        <p className="mb-4 text-sm text-muted-foreground">{guest._firstName} {guest._lastName}</p>
        {error && <div className="mb-3 rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nouvelle date d'expiration</label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? "Prolongation..." : "Prolonger"}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Revoke Confirm ----
interface RevokeConfirmProps {
  guest: GuestToken
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

function RevokeConfirm({ guest, onConfirm, onClose, loading }: RevokeConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="mb-2 font-semibold">Révoquer l'accès ?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          L'accès de <strong>{guest._firstName} {guest._lastName}</strong> ({guest._email}) sera définitivement révoqué.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Révocation..." : "Révoquer"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---- Copy Token Button ----
function CopyTokenButton({ token }: { token?: string }) {
  const [copied, setCopied] = useState(false)

  if (!token) return <span className="text-xs text-muted-foreground">—</span>

  const handleCopy = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Copier le token"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="font-mono">{token.slice(0, 8)}…</span>
    </button>
  )
}

// ---- Main Page ----
export function GuestsPage() {
  const [tokens, setTokens] = useState<GuestToken[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [activeOnly, setActiveOnly] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [extendGuest, setExtendGuest] = useState<GuestToken | null>(null)
  const [revokeGuest, setRevokeGuest] = useState<GuestToken | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const load = (p = page) => {
    setIsLoading(true)
    admin
      .listGuests(activeOnly || undefined, p)
      .then((data) => {
        const list = data.tokens ?? []
        setTokens(list)
        setTotal(data.total ?? list.length)
      })
      .catch((err) => setError(getApiMessage(err, "Erreur lors du chargement")))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load(page) }, [page, activeOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRevoke = async () => {
    if (!revokeGuest) return
    setActionLoading(revokeGuest._id)
    try {
      await admin.revokeGuest(revokeGuest._id)
      setRevokeGuest(null)
      load(page)
    } catch (err) {
      setError(getApiMessage(err, "Erreur lors de la révocation"))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AdminLayout currentPage="guests">
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onSuccess={() => load(1)} />
      )}
      {extendGuest && (
        <ExtendModal
          guest={extendGuest}
          onClose={() => setExtendGuest(null)}
          onSuccess={() => { setExtendGuest(null); load(page) }}
        />
      )}
      {revokeGuest && (
        <RevokeConfirm
          guest={revokeGuest}
          onConfirm={handleRevoke}
          onClose={() => setRevokeGuest(null)}
          loading={actionLoading === revokeGuest._id}
        />
      )}

      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Accès invités</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => { setActiveOnly(e.target.checked); setPage(1) }}
                className="h-4 w-4"
              />
              Actifs uniquement
            </label>
            <Button variant="outline" size="sm" onClick={() => load(page)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Créer un invité
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        )}

        {!isLoading && tokens.length === 0 && (
          <div className="text-center text-muted-foreground">Aucun invité</div>
        )}

        {!isLoading && tokens.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Prénom</th>
                    <th className="px-4 py-3 text-left">Nom</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Token</th>
                    <th className="px-4 py-3 text-left">Utilisé</th>
                    <th className="px-4 py-3 text-left">Expire le</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((g) => {
                    const expired = new Date(g._expiresAt) < new Date()
                    return (
                      <tr key={g._id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{g._firstName}</td>
                        <td className="px-4 py-3">{g._lastName}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{g._email}</td>
                        <td className="px-4 py-3"><CopyTokenButton token={g._token} /></td>
                        <td className="px-4 py-3">
                          <Badge variant={g._used ? "success" : "outline"}>
                            {g._used ? "Oui" : "Non"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <span className={expired ? "text-destructive" : ""}>
                            {new Date(g._expiresAt).toLocaleDateString("fr-FR")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button
                              size="sm" variant="outline"
                              title="Prolonger"
                              onClick={() => setExtendGuest(g)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              title="Révoquer"
                              onClick={() => setRevokeGuest(g)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} — {total} au total
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Suivant
              </Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
