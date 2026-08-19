# WorkSpace Hub

Toimiston sisäinen yhteisösovellus asennettavana PWA:na.
Vite + React + Supabase.

Näkymät: **Syöte** (fiilismittari, Kenen fakta, postaukset, reaktiot,
kommentit) · **Areena** (vedot, hot takes, haasteet) · **Sanuli** ·
**Profiili** (faktapankki).

## Käynnistys

```
npm install
cp .env.example .env      # täytä arvot Supabasesta
npm run dev
```

Supabasen arvot: dashboard → Project Settings → API.
`Project URL` ja `anon public` -avain.

Dev-palvelin ajaa `base`-asetuksen takia osoitteessa
http://localhost:5173/taito-community/

**Lisää se osoite Supabaseen:** Authentication → URL Configuration →
Redirect URLs → `http://localhost:5173/**`. Muuten magic link ei
ohjaa takaisin kehityksessä.

## Julkaisu

Push `main`-haaraan julkaisee automaattisesti GitHub Pagesiin
osoitteeseen https://clararosaa.github.io/taito-community/
Workflow: `.github/workflows/deploy.yml`.

Vaatii kertaluontoisen asetuksen GitHubissa:

1. **Settings → Secrets and variables → Actions → New repository secret**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. **Supabase → Authentication → URL Configuration → Redirect URLs**
   → `https://clararosaa.github.io/taito-community/**`

Arvot paistetaan bundleen käännösaikana, joten secretin muuttuessa
pitää ajaa uusi deploy.

`.env` on `.gitignore`ssa eikä sitä committoida.

## Tietokanta

Skeematiedostoja ei säilytetä tässä repossa. Ne ajetaan Supabasen SQL
Editorista: `schema.sql` ensin, sitten `schema-2.sql`, jälkimmäisen
ensimmäinen `alter type` -lause omana ajonaan. Sovellus ei muuta
skeemaa.

Äänestäminen kulkee aina funktioiden kautta — `votes`- ja
`vote_receipts`-tauluihin ei ole suoraa pääsyä:

| Toiminto | Kutsu |
|---|---|
| Äänestä | `cast_vote(p_card, p_option)` |
| Tulokset | `card_results(p_card)` |
| Onko äänestänyt | `has_voted(p_card)` |
| Julkisen vedon äänestäjät | `card_voters(p_card)` |
| Sanulin arvaus | `check_guess(p_guess)` |
| Sanulin sana pelin jälkeen | `reveal_word()` |

Päivän sanaa ei koskaan lähetetä selaimeen.

### Siemendata

Näkymät ovat tyhjiä ennen kuin kantaan on lisätty päivän kortit:
`cards`-tauluun `mood`-, `mystery_fact`-, `bet`- ja `hot_take`-rivit,
`daily_words`-tauluun päivän sana ja `challenges`-tauluun haasteet.
Esimerkit ovat skeematiedostojen lopussa kommentoituna. Näiden syöttöön
ei ole käyttöliittymää.

## Rakenne

```
src/
  lib/supabase.js    Supabase-yhteys + RPC-kääreet
  lib/auth.jsx       Istunto ja profiili contextina
  lib/feed.js        Postaukset, reaktiot, kommentit, päivän kortit
  lib/arena.js       Vedot, hot takes, haasteet
  lib/game.js        Sanulin tulokset ja tulostaulu
  lib/profile.js     Faktapankki
  lib/format.js      Ajat, päivät, avatarvärit
  lib/toast.jsx      Toast-ilmoitukset
  styles/tokens.css  Kaikki design tokenit muuttujina
  components/        Jaetut osat + feed/ arena/ game/ icons/
  views/             Feed, Arena, Game, Me
```

Värit, fontit ja mitat tulevat `tokens.css`:stä. Älä kirjoita
hex-arvoja komponentteihin.

## Poikkeamat designista

Pistejärjestelmä, Hetket ja kamera on jätetty pois. Alanavigaatiossa on
kolme kohtaa ja profiili avautuu ylätunnisteen avatarista. Kommentit on
lisätty; niitä ei ole prototyypissä. Yksityiskohdat on kommentoitu
koodiin niiden komponenttien yhteyteen.
