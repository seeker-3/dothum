import {
  createContext,
  FC,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { AudioFilesDB, AudioFileStores, openAudioFiles } from '../db/indexedDB'

type AudioFilesReducerState = {
  tunes: File[]
  beats: File[]
}
const audioFilesReducer = (
  state: AudioFilesReducerState,
  update: Partial<AudioFilesReducerState>
) => ({
  ...state,
  ...update,
})

const useContextBody = () => {
  const ref = useRef<AudioFilesDB | null>(null)

  const [store, dispatch] = useReducer(audioFilesReducer, {
    tunes: [],
    beats: [],
  })

  useEffect(() => {
    void (async () => {
      const db = (ref.current = await openAudioFiles())

      const [tunes, beats] = await Promise.all([
        db.getAll('tunes'),
        db.getAll('beats'),
      ])

      dispatch({
        tunes,
        beats,
      })

      return () => db.close()
    })().catch(console.error)
  }, [])

  if (!ref.current) return null

  const db = ref.current

  const saveAudioFile = async (storeName: AudioFileStores, audioFile: File) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const { store } = transaction
    const fileExists = await store.get(audioFile.name)

    // this should display an error to the user
    if (fileExists) {
      await transaction.done
      return null
    }

    const result = await store.add(audioFile)
    const files = await store.getAll()
    await transaction.done

    dispatch({ [storeName]: files })
    return result
  }

  const deleteAudioFile = async (
    storeName: AudioFileStores,
    audioFile: File
  ) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const { store } = transaction

    await store.delete(audioFile.name)

    const files = await store.getAll()
    await transaction.done

    dispatch({ [storeName]: files })
  }

  return {
    ...store,
    saveAudioFile,
    deleteAudioFile,
  }
}

const AudioFilesIndexedDBContext = createContext<ReturnType<
  typeof useContextBody
> | null>(null)

export const AudioFilesIndexedDBProvider: FC = ({ children }) => {
  const audioFilesIndexedDBContext = useContextBody()
  if (!audioFilesIndexedDBContext) return null

  return (
    <AudioFilesIndexedDBContext.Provider value={audioFilesIndexedDBContext}>
      {children}
    </AudioFilesIndexedDBContext.Provider>
  )
}

export default function useAudioFilesIndexedDB() {
  const audioFilesIndexedDBContext = useContext(AudioFilesIndexedDBContext)
  if (!audioFilesIndexedDBContext)
    throw Error('audio files indexedDB context did not load properly')
  return audioFilesIndexedDBContext
}