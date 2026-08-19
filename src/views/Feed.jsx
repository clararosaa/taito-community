import { useCallback, useEffect, useRef, useState } from 'react'
import Header, { Wordmark } from '../components/Header'
import EmptyState from '../components/EmptyState'
import MoodMeter from '../components/feed/MoodMeter'
import MysteryFact from '../components/feed/MysteryFact'
import Composer from '../components/feed/Composer'
import PostCard from '../components/feed/PostCard'
import CommentSheet from '../components/feed/CommentSheet'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import {
  loadPosts, createPost, addReaction, removeReaction,
  loadMoodCard, loadFactCard
} from '../lib/feed'

export default function Feed({ onProfile }) {
  const { profile, session } = useAuth()
  const toast = useToast()
  const userId = session?.user?.id
  const myName = profile?.display_name ?? ''

  const [posts, setPosts] = useState(null)      // null = ladataan
  const [mood, setMood] = useState(null)
  const [fact, setFact] = useState(null)
  const [error, setError] = useState('')
  const [openPost, setOpenPost] = useState(null)
  const composerRef = useRef(null)
  const loadSeq = useRef(0)

  /* Latauksia voi olla useampi lennossa (StrictMode, auth-tapahtumat,
     julkaisun jälkeinen päivitys). Vain viimeisin saa kirjoittaa tilan,
     muuten vanha vastaus voi jättää virheen näkyviin. */
  const refreshPosts = useCallback(async () => {
    if (!userId) return
    const seq = ++loadSeq.current
    try {
      const rows = await loadPosts(userId)
      if (seq !== loadSeq.current) return
      setPosts(rows)
      setError('')
    } catch (e) {
      if (seq !== loadSeq.current) return
      console.error('Syötteen lataus epäonnistui:', e)
      setPosts([])
      setError(e?.message ?? 'Tuntematon virhe')
    }
  }, [userId])

  useEffect(() => { refreshPosts() }, [refreshPosts])

  // Päivän kortit: kumpaakaan ei ole pakko olla olemassa.
  useEffect(() => {
    loadMoodCard().then(setMood).catch(() => setMood(null))
    loadFactCard().then(setFact).catch(() => setFact(null))
  }, [])

  async function publish(body) {
    try {
      await createPost(body, userId)
      await refreshPosts()
      toast('Postaus julkaistu')
      return true
    } catch {
      toast('Julkaisu ei onnistunut')
      return false
    }
  }

  /* Reaktio päivittyy heti näkymään ja perutaan jos kirjoitus kaatuu. */
  async function toggleReaction(post, emoji) {
    const on = post.mine.includes(emoji)
    const patch = p => {
      const counts = { ...p.reactions }
      counts[emoji] = Math.max(0, (counts[emoji] ?? 0) + (on ? -1 : 1))
      if (counts[emoji] === 0) delete counts[emoji]
      return {
        ...p,
        reactions: counts,
        mine: on ? p.mine.filter(e => e !== emoji) : [...p.mine, emoji]
      }
    }
    const before = posts
    setPosts(ps => ps.map(p => (p.id === post.id ? patch(p) : p)))
    try {
      if (on) await removeReaction(post.id, emoji, userId)
      else await addReaction(post.id, emoji, userId)
    } catch {
      setPosts(before)
      toast('Reaktio ei tallentunut')
    }
  }

  function setCommentCount(postId, count) {
    setPosts(ps => ps.map(p => (p.id === postId ? { ...p, comments: count } : p)))
    setOpenPost(p => (p && p.id === postId ? { ...p, comments: count } : p))
  }

  return (
    <>
      <Header title={<Wordmark />} name={myName} onAvatar={onProfile} />

      <div className="view-scroll">
        <div style={S.stack}>
          {mood && <MoodMeter card={mood} onVoted={() => setMood(m => ({ ...m, voted: true }))} />}
          {fact && fact.options.length > 0 && <MysteryFact card={fact} myName={myName} />}

          <Composer ref={composerRef} name={myName} userId={userId} onPublish={publish} />

          {posts === null && <div style={S.info}>Ladataan syötettä…</div>}

          {error && (
            <div style={S.error}>
              <div>Syötettä ei saatu ladattua.</div>
              <div style={S.errorDetail}>{error}</div>
              <button style={S.retry} onClick={refreshPosts}>Yritä uudelleen</button>
            </div>
          )}

          {posts?.length === 0 && !error && (
            <EmptyState
              emoji="🌱"
              title="Aloita ensimmäinen keskustelu"
              body="Syöte on vielä tyhjä. Kehu kollegaa, jaa päivän pieni voitto tai kysy jotain — muut näkevät sen heti."
              action="Kirjoita postaus"
              onAction={() => composerRef.current?.focus()}
            />
          )}

          {posts?.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onToggleReaction={toggleReaction}
              onOpenComments={setOpenPost}
            />
          ))}
        </div>
      </div>

      {openPost && (
        <CommentSheet
          post={openPost}
          me={{ id: userId, name: myName }}
          onClose={() => setOpenPost(null)}
          onCountChange={setCommentCount}
        />
      )}
    </>
  )
}

const S = {
  stack: {
    padding: '0 var(--content-pad) 14px',
    display: 'flex', flexDirection: 'column', gap: 12
  },
  info: { fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '18px 0' },
  error: {
    background: 'var(--red-bg-2)', color: 'var(--red-text)', borderRadius: 18,
    padding: 14, fontSize: 13, fontWeight: 600, lineHeight: 1.45,
    display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'
  },
  errorDetail: {
    fontFamily: 'var(--font-mono)', fontWeight: 400, fontSize: 11,
    color: 'var(--red-text-2)', wordBreak: 'break-word'
  },
  retry: {
    marginTop: 2, padding: '9px 14px', borderRadius: 'var(--r-pill)',
    background: 'var(--red-bg)', color: 'var(--red-text)', fontWeight: 700, fontSize: 12
  }
}
