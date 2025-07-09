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

const ChatApp: React.FC<ChatAppProps> = ({ onClose }) => {
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
  const [chatSize, setChatSize] = useState(() => {
    const saved = localStorage.getItem('lovebug-chat-size')
    return saved ? JSON.parse(saved) : { width: 420, height: 600 }
  })
  const [chatPosition, setChatPosition] = useState(() => {
    const saved = localStorage.getItem('lovebug-chat-position')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 저장된 위치가 화면 밖에 있는 경우 조정
      return {
        x: Math.max(0, Math.min(window.innerWidth - 420, parsed.x)),
        y: Math.max(0, Math.min(window.innerHeight - 600, parsed.y))
      }
    }
    // 기본 위치: 우측 하단에서 약간 떨어진 곳
    return {
      x: typeof window !== 'undefined' ? Math.max(0, window.innerWidth - 440) : 20,
      y: typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 620) : 20
    }
  })
  const [isResizing, setIsResizing] = useState<string | false>(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [background, setBackground] = useState(() => {
    return localStorage.getItem('lovebug-background') || 'gradient1';
  });
  
  const currentBg = backgrounds.find(bg => bg.id === background) || backgrounds[0];
  const isDarkTheme = ['gradient4', 'gradient5', 'gradient6'].includes(background);

  useEffect(() => {
    const timer = setTimeout(() => {
      setChatPosition(prev => ({ ...prev }))
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SEND_TO_CHAT' && event.data.text) {
        setInput(event.data.text)
        setTimeout(() => {
          handleSend()
        }, 100)
      } else if (event.data.type === 'RESIZE_CHAT' && event.data.direction) {
        // 크기 조절 단축키 처리
        setChatSize((prevSize: { width: number, height: number }) => {
          const step = 50
          let newWidth, newHeight
          
          if (event.data.direction === 'larger') {
            newWidth = Math.min(window.innerWidth - 40, prevSize.width + step)
            newHeight = Math.min(window.innerHeight - 40, prevSize.height + step)
          } else {
            newWidth = Math.max(320, prevSize.width - step)
            newHeight = Math.max(400, prevSize.height - step)
          }
          
          // 크기가 변경되면 위치도 조정해야 할 수 있음
          setChatPosition((prevPos: { x: number, y: number }) => {
            // 화면 경계를 벗어나지 않도록 위치 조정
            const newX = Math.min(prevPos.x, window.innerWidth - newWidth)
            const newY = Math.min(prevPos.y, window.innerHeight - newHeight)
            return { x: Math.max(0, newX), y: Math.max(0, newY) }
          })
          
          return { width: newWidth, height: newHeight }
        })
      }
    }
    
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [input]) // input dependency 추가

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (!containerRect) return
        
        let newWidth = chatSize.width
        let newHeight = chatSize.height
        let newX = chatPosition.x
        let newY = chatPosition.y
        
        // 각 방향별 리사이징 처리
        if (isResizing.includes('right')) {
          newWidth = e.clientX - containerRect.left
        }
        if (isResizing.includes('left')) {
          const delta = containerRect.left - e.clientX
          newWidth = chatSize.width + delta
          newX = chatPosition.x - delta
        }
        if (isResizing.includes('bottom')) {
          newHeight = e.clientY - containerRect.top
        }
        if (isResizing.includes('top')) {
          const delta = containerRect.top - e.clientY
          newHeight = chatSize.height + delta
          newY = chatPosition.y - delta
        }
        
        // 최소/최대 크기 제한
        const finalWidth = Math.max(320, Math.min(window.innerWidth - 40, newWidth))
        const finalHeight = Math.max(400, Math.min(window.innerHeight - 40, newHeight))
        
        // 위치가 화면 밖으로 나가지 않도록 제한
        // left/top 리사이징의 경우에만 위치 조정
        if (isResizing.includes('left') && finalWidth !== newWidth) {
          // 최소 크기에 도달했을 때 위치 고정
          newX = chatPosition.x + (chatSize.width - finalWidth)
        }
        if (isResizing.includes('top') && finalHeight !== newHeight) {
          // 최소 크기에 도달했을 때 위치 고정
          newY = chatPosition.y + (chatSize.height - finalHeight)
        }
        
        // 화면 경계 체크
        const finalX = Math.max(0, Math.min(window.innerWidth - finalWidth, newX))
        const finalY = Math.max(0, Math.min(window.innerHeight - finalHeight, newY))
        
        setChatSize({ width: finalWidth, height: finalHeight })
        setChatPosition({ x: finalX, y: finalY })
      } else if (isDragging) {
        const newX = e.clientX - dragStart.x
        const newY = e.clientY - dragStart.y
        
        // 화면 밖으로 나가지 않도록 제한
        setChatPosition({
          x: Math.max(0, Math.min(window.innerWidth - chatSize.width, newX)),
          y: Math.max(0, Math.min(window.innerHeight - chatSize.height, newY))
        })
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setIsDragging(false)
    }
    
    if (isResizing || isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = isResizing ? (isResizing + '-resize') : 'move'
      document.body.style.userSelect = 'none'
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, isDragging, dragStart, chatSize, chatPosition])

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

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
  }

  // 크기와 위치가 변경될 때마다 저장
  useEffect(() => {
    localStorage.setItem('lovebug-chat-size', JSON.stringify(chatSize))
  }, [chatSize])
  
  useEffect(() => {
    localStorage.setItem('lovebug-chat-position', JSON.stringify(chatPosition))
  }, [chatPosition])
  
  // 브라우저 창 크기 변경 시 채팅창 위치 조정
  useEffect(() => {
    const handleResize = () => {
      setChatPosition((prev: { x: number, y: number }) => ({
        x: Math.max(0, Math.min(window.innerWidth - chatSize.width, prev.x)),
        y: Math.max(0, Math.min(window.innerHeight - chatSize.height, prev.y))
      }))
      setChatSize((prev: { width: number, height: number }) => ({
        width: Math.min(window.innerWidth - 40, prev.width),
        height: Math.min(window.innerHeight - 40, prev.height)
      }))
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [chatSize.width, chatSize.height])

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isMinimized ? styles.minimized : ''}`} 
      style={{ 
        '--chat-bg': currentBg.value,
        width: chatSize.width + 'px',
        height: isMinimized ? '60px' : chatSize.height + 'px',
        left: chatPosition.x + 'px',
        top: chatPosition.y + 'px'
      } as React.CSSProperties}
      data-theme={isDarkTheme ? 'dark' : 'light'}
    >
      {/* 크기 조절 핸들들 */}
      <div className={`${styles.resizeHandle} ${styles.resizeTop}`} onMouseDown={() => setIsResizing('top')} />
      <div className={`${styles.resizeHandle} ${styles.resizeRight}`} onMouseDown={() => setIsResizing('right')} />
      <div className={`${styles.resizeHandle} ${styles.resizeBottom}`} onMouseDown={() => setIsResizing('bottom')} />
      <div className={`${styles.resizeHandle} ${styles.resizeLeft}`} onMouseDown={() => setIsResizing('left')} />
      <div className={`${styles.resizeHandle} ${styles.resizeTopLeft}`} onMouseDown={() => setIsResizing('top-left')} />
      <div className={`${styles.resizeHandle} ${styles.resizeTopRight}`} onMouseDown={() => setIsResizing('top-right')} />
      <div className={`${styles.resizeHandle} ${styles.resizeBottomLeft}`} onMouseDown={() => setIsResizing('bottom-left')} />
      <div className={`${styles.resizeHandle} ${styles.resizeBottomRight}`} onMouseDown={() => setIsResizing('bottom-right')} />
      
      <div className={styles.header} onMouseDown={handleHeaderMouseDown}>
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
            aria-label={isMinimized ? '최대화' : '최소화'}
            data-testid="minimize-button"
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
            aria-label="닫기"
            data-testid="close-button"
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
              aria-label="전송"
              data-testid="send-button"
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