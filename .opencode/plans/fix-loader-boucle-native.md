# Plan de correction — Loader en boucle sur natif

## Problème

L'application mobile (TWA Android / WKWebView iOS) affiche un loader en boucle (spinner infini ou re-render cyclique) dans 3 scénarios :
1. Dashboard → clic sur exposant → `/annuaire/[exposantId]`
2. Feed → clic sur profil → `/annuaire/[exposantId]`
3. Annuaire listing → `/annuaire`

## Causes Racines

### Cause 1 — Boucle `router.replace` (annuaire listing)
**Fichier :** `app/(dashboard)/annuaire/page.tsx:92-101`

```tsx
router.replace(`${pathname}?${params.toString()}`, { scroll: false });
```

Quand `params.toString()` est vide, l'URL devient `/annuaire?` avec un `?` vide. Ce `?` additionnel fait que Next.js traite l'URL comme différente, déclenchant un nouveau render → l'effet refire → boucle infinie. En TWA, ceci force un rechargement complet de la SPA qui réaffiche le spinner du layout.

### Cause 2 — Service Worker cache les payloads RSC
**Fichier :** `public/sw.js:92-96`

```javascript
if (url.origin === self.location.origin) {
    event.respondWith(fromNetworkOrCache(request, DYNAMIC_CACHE));
    return;
}
```

Le catch-all intercepte les payloads RSC (`/_next/data/...`). Après un déploiement, le cache contient d'anciennes données RSC qui référencent des chunks inexistants → Next.js échoue à rendre → retente → le SW retourne le même cache obsolète → boucle de re-rendu.

### Cause 3 — `getSession()` sans timeout en WebView
**Fichiers :** `hooks/useExposants.ts`, `hooks/useProfilePosts.ts`, `hooks/useBlockedUsers.ts`

`supabaseClient.auth.getSession()` peut bloquer indéfiniment dans certains contextes WebView où le cookie adapter de `@supabase/ssr` ne répond pas correctement.

### Cause 4 — `useProfilePosts` early return sans reset du loading
**Fichier :** `hooks/useProfilePosts.ts:43`

```tsx
if (!profileId) return; // loading reste true
```

`loading` reste `true` quand `profileId` est `undefined` (premier render), ce qui pourrait bloquer d'éventuels consommateurs de ce state.

---

## Corrections

### Fix 1 — Boucle `router.replace`

**Fichier :** `app/(dashboard)/annuaire/page.tsx`

Changer :
```tsx
router.replace(`${pathname}?${params.toString()}`, { scroll: false });
```
→
```tsx
const qs = params.toString();
router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
```

### Fix 2 — SW exclure RSC payloads

**Fichier :** `public/sw.js`

Ajouter AVANT le bloc catch-all (ligne 86) :
```javascript
// ── RSC Data payloads : réseau uniquement ────────────────────────────
if (url.origin === self.location.origin && url.pathname.startsWith('/_next/data/')) {
    event.respondWith(fromNetworkOnly(request));
    return;
}
```

### Fix 3 — Timeout `getSession()`

**Fichier :** `lib/client.ts`

Ajouter helper :
```typescript
export async function getSessionWithTimeout(timeoutMs = 10000) {
  const result = await Promise.race([
    supabaseClient.auth.getSession(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Session timeout')), timeoutMs)
    ),
  ]);
  return result;
}
```

Puis remplacer `supabaseClient.auth.getSession()` par `getSessionWithTimeout()` dans :
- `hooks/useExposants.ts:63`
- `hooks/useProfilePosts.ts:46`
- `hooks/useBlockedUsers.ts:25`
- `hooks/useProfilePosts.ts:121, 166, 218, 246, 268, 338, 361, 410, 443`

### Fix 4 — Reset loading dans useProfilePosts early return

**Fichier :** `hooks/useProfilePosts.ts`

Changer :
```tsx
if (!profileId) return;
```
→
```tsx
if (!profileId) { setLoading(false); return; }
```

---

## Vérification

Après application :
1. `npm run build` — Vérifier que le build Next.js passe
2. `npm run type-check` — Vérifier TypeScript
3. Tester la navigation en TWA : Dashboard → exposant, Feed → profil, Annuaire listing → détail
4. Vérifier que le cache Service Worker n'interfère plus (ouvrir DevTools → Application → Cache Storage et vérifier qu'aucun payload RSC n'est présent)
