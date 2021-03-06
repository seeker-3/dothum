import { createContext, useContext, useEffect, useState, type FC } from 'react'

interface BannerContextValue {
  mounted: boolean
  unmount: () => void
  message: string
  setMessage: React.Dispatch<React.SetStateAction<string>>
}

const BANNER_DURATION = 5000

const BannerContext = createContext<BannerContextValue | null>(null)

export const BannerProvider: FC = ({ children }) => {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) return

    const closeBanner = () => setMessage('')

    const closeEvent = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeBanner()
    }

    const timeout = setTimeout(closeBanner, BANNER_DURATION)

    window.addEventListener('keydown', closeEvent)

    return () => {
      if (timeout) clearTimeout(timeout)
      window.removeEventListener('keydown', closeEvent)
    }
  }, [message])

  return (
    <BannerContext.Provider
      value={{
        mounted: !!message,
        unmount: () => setMessage(''),
        message,
        setMessage,
      }}
    >
      {children}
    </BannerContext.Provider>
  )
}

export default function useBanner(): BannerContextValue {
  const bannerContextValue = useContext(BannerContext)
  if (!bannerContextValue) throw Error('banner context did not load properly')
  return bannerContextValue
}
