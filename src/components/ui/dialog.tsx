'use client'

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  onClose: (id: string) => void
  autoClose?: boolean
  duration?: number
}

export function Dialog({ 
  id, 
  type, 
  title, 
  message, 
  confirmText = '确定',
  cancelText = '取消',
  onConfirm, 
  onCancel, 
  onClose,
  autoClose = false,
  duration = 3000
}: DialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // 自动关闭（非确认对话框）
    if (autoClose && type !== 'confirm') {
      const hideTimer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => {
        clearTimeout(showTimer)
        clearTimeout(hideTimer)
      }
    }

    return () => clearTimeout(showTimer)
  }, [id, autoClose, duration, type])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  const handleConfirm = () => {
    onConfirm?.()
    handleClose()
  }

  const handleCancel = () => {
    onCancel?.()
    handleClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />
    }
  }

  const getIconBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100'
      case 'error':
        return 'bg-red-100'
      case 'warning':
        return 'bg-yellow-100'
      case 'info':
        return 'bg-blue-100'
      case 'confirm':
        return 'bg-orange-100'
    }
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={type !== 'confirm' ? handleClose : undefined}
      />
      
      {/* 对话框 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={cn(
            "bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-300 transform",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-full", getIconBgColor())}>
                {getIcon()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            
            {/* 关闭按钮（非确认对话框） */}
            {type !== 'confirm' && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 内容 */}
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>

          {/* 底部按钮 */}
          <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className={cn(
                  "px-4 py-2 text-white rounded-lg transition-colors",
                  type === 'success' && "bg-green-600 hover:bg-green-700",
                  type === 'error' && "bg-red-600 hover:bg-red-700",
                  type === 'warning' && "bg-yellow-600 hover:bg-yellow-700",
                  type === 'info' && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Dialog容器组件
export interface DialogContainerProps {
  dialogs: DialogProps[]
  onClose: (id: string) => void
}

export function DialogContainer({ dialogs, onClose }: DialogContainerProps) {
  return (
    <>
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          {...dialog}
          onClose={onClose}
        />
      ))}
    </>
  )
}

// Dialog Hook
export function useDialog() {
  const [dialogs, setDialogs] = useState<DialogProps[]>([])

  const showDialog = (dialog: Omit<DialogProps, 'id' | 'onClose'>) => {
    const id = `dialog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setDialogs(prev => [...prev, { ...dialog, id, onClose: removeDialog }])
    return id
  }

  const removeDialog = (id: string) => {
    setDialogs(prev => prev.filter(dialog => dialog.id !== id))
  }

  // 便捷方法
  const showSuccess = (title: string, message: string, autoClose = true) => {
    return showDialog({ type: 'success', title, message, autoClose })
  }

  const showError = (title: string, message: string, autoClose = false) => {
    return showDialog({ type: 'error', title, message, autoClose })
  }

  const showWarning = (title: string, message: string, autoClose = false) => {
    return showDialog({ type: 'warning', title, message, autoClose })
  }

  const showInfo = (title: string, message: string, autoClose = true) => {
    return showDialog({ type: 'info', title, message, autoClose })
  }

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText = '确定',
    cancelText = '取消'
  ) => {
    return showDialog({ 
      type: 'confirm', 
      title, 
      message, 
      onConfirm, 
      onCancel,
      confirmText,
      cancelText
    })
  }

  return {
    dialogs,
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    removeDialog
  }
} 