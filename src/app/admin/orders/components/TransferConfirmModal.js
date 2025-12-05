// src/app/admin/orders/components/TransferConfirmModal.js
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
export default function TransferConfirmModal({
  show,
  sourceTable,
  targetTable,
  onConfirm,
  onCancel,
  loading
}) {
  if (!show || !sourceTable || !targetTable) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
     <div className="p-6 bg-gradient-to-r from-qasa via-qasa-light to-qasa-accent text-white">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      {/* 🎨 QASA LOGO - Küçük */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-white/20 blur-lg rounded-full" />
        <div className="relative bg-white/10 backdrop-blur-md p-2 rounded-lg border-2 border-white/30">
          <Image
            src="/qasa.png"
            alt="QASA"
            width={60}
            height={18}
            className="drop-shadow-lg"
          />
        </div>
      </motion.div>
                <h3 className="text-xl font-bold">Masa Taşıma Onayı</h3>
              </div>
              <button
                onClick={onCancel}
                disabled={loading}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm opacity-90">
              Bu işlem geri alınamaz, emin misiniz?
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Kaynak Masa */}
              <div className="flex-1 p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
                <div className="text-xs font-medium text-qasa-accent mb-1">Kaynak Masa</div>
                <div className="text-2xl font-bold text-amber-900">
                  {sourceTable.tableName || `Masa ${sourceTable.tableNumber}`}
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  {sourceTable.orders?.length || 0} sipariş
                </div>
              </div>

              {/* Ok İşareti */}
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex-shrink-0"
              >
                <ArrowRightLeft className="w-8 h-8 text-purple-500" />
              </motion.div>

              {/* Hedef Masa */}
              <div className="flex-1 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="text-xs font-medium text-green-600 mb-1">Hedef Masa</div>
                <div className="text-2xl font-bold text-green-900">
                  Masa {targetTable.number}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {targetTable.isEmpty ? 'Boş masa' : 'Dolu masa'}
                </div>
              </div>
            </div>

            {/* Uyarı Mesajı */}
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-qasa-accent mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <div className="font-bold mb-1">Dikkat!</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Tüm aktif siparişler hedef masaya taşınacak</li>
                    <li>Kaynak masa otomatik olarak boşaltılacak</li>
                    <li>Bu işlem geri alınamaz</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              İptal Et
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Taşınıyor...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-5 h-5" />
                  Onayla ve Taşı
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}