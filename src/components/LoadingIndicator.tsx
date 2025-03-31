"use client"

import { useState, useEffect } from "react"

const LoadingComponent = ({ isLoading }: { isLoading: boolean }) => {
  const [loadingMsg, setLoadingMsg] = useState("Processing...")
  const [fade, setFade] = useState(false) // State to trigger fade effect

  useEffect(() => {
    if (isLoading) {
      const messages = [
        "Hang tight, I'm almost done cooking! 🍳",
        "Still working... good things take time! ⏳",
        "Almost there... just putting on the finishing touches! ✨",
        "Just a few moments more... patience pays off! 💡",
      ]

      let index = 0
      const interval = setInterval(() => {
        setFade(true) // Start fading out
        setTimeout(() => {
          setLoadingMsg(messages[index % messages.length]) // Change message
          setFade(false) // Fade back in
          index++
        }, 500) // Half-second fade effect before changing text
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-black text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#ff4500] mx-auto"></div>
        <p
          className={`mt-6 text-xl font-bold text-black tracking-wide transition-opacity duration-500 ${
            fade ? "opacity-0" : "opacity-100"
          }`}
        >
          {loadingMsg}
        </p>
      </div>
    </div>
  )
}

export default LoadingComponent

