import React, { useState, useEffect, useRef } from 'react'
import styles from './ChatApp.module.css'
import type { ChatAppProps, Message } from './types'

const backgrounds = [
  {
    id: 'gradient1',
    name: 'Sunset Ocean',
    value: 'linear-gradient(135deg, rgba(255, 94, 98, 0.3), rgba(255, 154, 0, 0.3), rgba(237, 117, 255, 0.3))',
    color: '#FF5E62'
  },
  {
    id: 'gradient2',
    name: 'Aurora Night',
    value: 'linear-gradient(135deg, rgba(0, 210, 255, 0.3), rgba(146, 141, 255, 0.3), rgba(255, 0, 189, 0.3))',
    color: '#00D2FF'
  },
  {
    id: 'gradient3',
    name: 'Forest Dream',
    value: 'linear-gradient(135deg, rgba(0, 255, 135, 0.3), rgba(96, 239, 255, 0.3), rgba(0, 133, 255, 0.3))',
    color: '#00FF87'
  },
  {
    id: 'gradient4',
    name: 'Midnight Purple',
    value: 'linear-gradient(135deg, rgba(30, 20, 60, 0.9), rgba(60, 30, 90, 0.9), rgba(40, 20, 80, 0.9))',
    color: '#3C1E5A'
  },
  {
    id: 'gradient5',
    name: 'Deep Ocean',
    value: 'linear-gradient(135deg, rgba(10, 25, 47, 0.9), rgba(20, 40, 80, 0.9), rgba(15, 30, 60, 0.9))',
    color: '#14283D'
  },
  {
    id: 'gradient6',
    name: 'Black Night',
    value: 'linear-gradient(135deg, rgba(20, 20, 20, 0.9), rgba(35, 35, 35, 0.9), rgba(10, 10, 10, 0.9))',
    color: '#1A1A1A'
  }
];

export function BackgroundSelector({ background, setBackground }: {
  background: string,
  setBackground: (bg: string) => void
}) {
  return (
    <div className={styles.backgroundSelector}>
      <div className={styles.trafficLights}>
        {backgrounds.map((bg) => (
          <button 
            key={bg.id}
            className={`${styles.trafficLight} ${background === bg.id ? styles.active : ''}`}
            style={{ background: bg.color }}
            onClick={() => {
              setBackground(bg.id);
              localStorage.setItem('lovebug-background', bg.id);
            }}
            title={bg.name}
          />
        ))}
      </div>
    </div>
  );
}

const ChatApp: React.FC<ChatAppProps> = ({ onClose, windowSize = 'medium' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '안녕하세요! Lovebug AI 어시스턴트입니다. 무엇을 도와드릴까요?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [background, setBackground] = useState(() => {
    return localStorage.getItem('lovebug-background') || 'gradient1';
  });
  
  const currentBg = backgrounds.find(bg => bg.id === background) || backgrounds[0];
  const isDarkTheme = ['gradient4', 'gradient5', 'gradient6'].includes(background);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    // 선택된 텍스트 수신 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SEND_TO_CHAT' && event.data.text) {
        setInput(event.data.text)
        // 자동으로 전송
        setTimeout(() => {
          handleSend()
        }, 100)
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [input]) // input dependency 추가

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '목업용 대화입니다!',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div 
      className={`${styles.container} ${isMinimized ? styles.minimized : ''} ${styles[windowSize || 'medium']}`} 
      style={{ '--chat-bg': currentBg.value } as React.CSSProperties}
      data-theme={isDarkTheme ? 'dark' : 'light'}
    >
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.logoWrapper}>
            <svg width="36" height="36" viewBox="0 0 128 128" fill="currentColor" className={styles.logo}>
              <rect width="128" height="128" fill="url(#lovebug-gradient)" rx="24"/>
              <defs>
                <linearGradient id="lovebug-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#12c2e9" />
                  <stop offset="50%" stopColor="#c471ed" />
                  <stop offset="100%" stopColor="#f64f59" />
                </linearGradient>
              </defs>
              <text x="64" y="80" textAnchor="middle" fill="white" fontSize="60" fontFamily="Arial, sans-serif" fontWeight="bold">L</text>
            </svg>
          </div>
          <div>
            <p className={styles.title}>러브버그챗</p>
            <span className={styles.status}>
              <span className={styles.statusDot}></span>
              연결중
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <BackgroundSelector background={background} setBackground={setBackground} />
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className={styles.actionButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              {isMinimized ? (
                <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
              ) : (
                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
              )}
            </svg>
          </button>
          <button 
            onClick={onClose} 
            className={styles.actionButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className={styles.messagesContainer}>
            {messages.map((message) => (
              <div key={message.id} className={`${styles.messageWrapper} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
                <div className={`${styles.avatar} ${message.role === 'user' ? styles.userAvatar : styles.assistantAvatar}`}>
                  <span>{message.role === 'user' ? '👤' : '🤖'}</span>
                </div>
                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${message.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                    <p>{message.content}</p>
                  </div>
                  <span className={`${styles.timestamp} ${message.role === 'user' ? styles.userTimestamp : ''}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
                <div className={`${styles.avatar} ${styles.assistantAvatar}`}>
                  <span>🤖</span>
                </div>
                <div className={`${styles.messageBubble} ${styles.assistantBubble} ${styles.typingBubble}`}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div className={styles.inputContainer}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요"
              rows={1}
              className={styles.input}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={styles.sendButton}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatApp 