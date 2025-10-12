'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageSquare, Mic, Sparkles, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Suggestion {
  icon: any
  text: string
  action: () => void
}

export function AICopilotAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [suggestions] = useState<Suggestion[]>([
    {
      icon: Zap,
      text: 'Find VPs at fintech companies',
      action: () => console.log('Suggest 1')
    },
    {
      icon: MessageSquare,
      text: 'Draft follow-up email',
      action: () => console.log('Suggest 2')
    },
    {
      icon: Sparkles,
      text: 'Optimize my campaign',
      action: () => console.log('Suggest 3')
    }
  ])

  // Voice input using Web Speech API
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input not supported in your browser')
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputValue(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  return (
    <>
      {/* Floating assistant bubble */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="lg"
          className="h-14 w-14 rounded-full glass gradient-border shadow-lg float-animation relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity" />
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6 text-purple-500" />
          )}
        </Button>
      </motion.div>

      {/* Expanded chat interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-96"
          >
            <Card className="glass elevation-4 border-0 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/10 frosted-purple">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-semibold text-sm">Hermes Assistant</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask me anything about prospecting
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Quick actions:
                </p>
                {suggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={suggestion.action}
                    className="w-full flex items-center gap-3 p-3 rounded-lg glass-hover text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <suggestion.icon className="h-4 w-4 text-purple-500" />
                    </div>
                    <span className="text-sm">{suggestion.text}</span>
                  </motion.button>
                ))}
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-white/10 frosted-blue">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type or speak your question..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="glass border-white/20"
                  />
                  <Button
                    size="icon"
                    variant={isListening ? 'destructive' : 'outline'}
                    onClick={startVoiceInput}
                    className="glass"
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  Click mic for voice input
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
