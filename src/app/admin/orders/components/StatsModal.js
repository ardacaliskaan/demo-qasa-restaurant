// src/app/admin/orders/components/StatsModal.jsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, ShoppingCart, Activity } from 'lucide-react'

export default function StatsModal({
  show,
  stats,
  statusConfig,
  onClose
}) {
  if (!show || !stats) return null

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">İstatistikler</h2>
                <p className="text-sm opacity-90 mt-1">Detaylı sipariş analizi</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(statusConfig).map(([status, config]) => {
                const count = stats[status] || 0
                const Icon = config.icon
                return (
                  <div key={status} className={`p-4 rounded-xl bg-${config.color}-50 border border-${config.color}-200`}>
                    <Icon className={`w-6 h-6 text-${config.color}-600 mb-2`} />
                    <div className={`text-2xl font-bold text-${config.color}-700`}>{count}</div>
                    <div className={`text-xs text-${config.color}-600 mt-1`}>{config.label}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <DollarSign className="w-6 h-6 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-700">₺{stats.totalRevenue?.toFixed(2)}</div>
                <div className="text-xs text-blue-600 mt-1">Toplam Ciro</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-700">₺{stats.avgOrderValue?.toFixed(2)}</div>
                <div className="text-xs text-green-600 mt-1">Ortalama Sipariş</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <Activity className="w-6 h-6 text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-700">{stats.totalOrders}</div>
                <div className="text-xs text-purple-600 mt-1">Toplam Sipariş</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
