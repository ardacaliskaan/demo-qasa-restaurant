// src/app/admin/orders/components/NotificationSettingsModal.jsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Volume2, VolumeX, Bell, BellOff, Play } from 'lucide-react'

export default function NotificationSettingsModal({
  show,
  soundEnabled,
  notificationEnabled,
  notificationPermission,
  volume,
  onClose,
  onSoundToggle,
  onNotificationToggle,
  onVolumeChange,
  onRequestPermission,
  onTestSound,
  onTestNotifications
}) {
  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Bildirim Ayarları</h2>
                <p className="text-sm opacity-90 mt-1">Yeni siparişler için uyarılar</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Sound Settings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-blue-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  <div>
                    <div className="font-semibold text-gray-900">Bildirim Sesi</div>
                    <div className="text-xs text-gray-500">Yeni sipariş geldiğinde ses çal</div>
                  </div>
                </div>
                <button
                  onClick={onSoundToggle}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    soundEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    soundEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {soundEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <VolumeX className="w-4 h-4 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <Volume2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <button
                    onClick={onTestSound}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Sesi Test Et
                  </button>
                </div>
              )}
            </div>

            {/* Browser Notifications */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {notificationEnabled ? <Bell className="w-5 h-5 text-green-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
                  <div>
                    <div className="font-semibold text-gray-900">Tarayıcı Bildirimleri</div>
                    <div className="text-xs text-gray-500">Masaüstü bildirim göster</div>
                  </div>
                </div>
                <button
                  onClick={onNotificationToggle}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    notificationEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  disabled={notificationPermission === 'denied'}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                    notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {notificationPermission === 'denied' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">
                    Bildirimler engellenmiş. Tarayıcı ayarlarından izin verin.
                  </p>
                </div>
              )}

              {notificationPermission === 'default' && (
                <button
                  onClick={onRequestPermission}
                  className="w-full px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Bildirimlere İzin Ver
                </button>
              )}
            </div>

            {/* Test All */}
            <button
              onClick={onTestNotifications}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
            >
              Tüm Bildirimleri Test Et
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
