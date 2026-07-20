import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, type QueryConstraint } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useCollection<T>(path: string, ...constraints: QueryConstraint[]) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, path), ...constraints)
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
      setLoading(false)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])

  return { data, loading }
}
