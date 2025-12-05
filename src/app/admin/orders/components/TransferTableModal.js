// src/app/admin/orders/components/TransferTableModal.js
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ArrowRightLeft, Users, MapPin, CheckCircle, Search,
  Filter, RefreshCw, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'
import TransferConfirmModal from './TransferConfirmModal'
import Image from 'next/image'
export default function TransferTableModal({
  show,
  sourceTable,
  onClose,
  onTransferComplete
}) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [selectedTargetTable, setSelectedTargetTable] = useState(null)
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (show) {
      loadTables()
    }
  }, [show])

  const loadTables = async () => {
    try {
      setLoading(true)
      
      // Tüm masaları yükle
      const tablesRes = await fetch(apiPath('/api/admin/tables'))
      const tablesData = await tablesRes.json()
      
      if (!tablesRes.ok) {
        toast.error('Masalar yüklenemedi')
        return
      }
      
      const allTables = tablesData.tables || tablesData || []
      
      // Aktif siparişleri yükle
      const ordersRes = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
      const ordersData = await ordersRes.json()
      
      const activeOrders = ordersData.success ? 
        (ordersData.originalOrders || ordersData.orders || []) : []
      
      // Masalara durum ekle
      const tablesWithStatus = allTables.map(table => {
        const tableNumberStr = table.number.toString().toUpperCase().trim()
        const hasActiveOrders = activeOrders.some(order => {
          const orderTableNum = (order.tableNumber || order.tableId)?.toString().toUpperCase().trim()
          return orderTableNum === tableNumberStr && 
                 !['completed', 'cancelled'].includes(order.status)
        })
        
        return {
          ...table,
          isEmpty: !hasActiveOrders && table.status !== 'maintenance'
        }
      })
      
      // Kaynak masayı çıkar
      const filteredTables = tablesWithStatus.filter(
        t => t.number.toString() !== sourceTable.tableNumber.toString()
      )
      
      setTables(filteredTables)
      
    } catch (error) {
      console.error('Load tables error:', error)
      toast.error('Masa yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!selectedTargetTable) {
      toast.error('Lütfen hedef masa seçin')
      return
    }

    try {
      setTransferring(true)

      const response = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transferTable',
          sourceTableNumber: sourceTable.tableNumber.toString(),
          targetTableNumber: selectedTargetTable.number.toString()
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`✅ Siparişler Masa ${selectedTargetTable.number}'e taşındı!`, {
          icon: '🔄',
          duration: 3000
        })
        
        setShowConfirmModal(false)
        onTransferComplete()
        onClose()
      } else {
        toast.error(result.error || 'Masa taşıma hatası')
      }
    } catch (error) {
      console.error('Transfer error:', error)
      toast.error('Masa taşıma hatası: ' + error.message)
    } finally {
      setTransferring(false)
    }
  }

  const filteredTables = tables.filter(table => {
    // Boş masa filtresi
    if (showOnlyEmpty && !table.isEmpty) return false
    
    // Arama filtresi
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        table.number.toString().includes(search) ||
        table.location?.toLowerCase().includes(search)
      )
    }
    
    return true
  })

  if (!show || !sourceTable) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-qasa via-qasa-light to-qasa-accent text-white flex-shrink-0">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      {/* 🎨 QASA LOGO */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
        <div className="relative bg-white/10 backdrop-blur-md p-3 rounded-2xl border-2 border-white/30">
          <Image
            src="/qasa.png"
            alt="QASA"
            width={90}
            height={27}
            className="drop-shadow-lg"
          />
        </div>
      </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">Masa Taşı</h2>
                  <p className="text-sm opacity-90 mt-1">
                    {sourceTable.tableName || `Masa ${sourceTable.tableNumber}`} → Hedef Masa
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Masa ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 outline-none"
                />
              </div>
              <button
                onClick={() => setShowOnlyEmpty(!showOnlyEmpty)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  showOnlyEmpty
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Sadece Boş</span>
              </button>
              <button
                onClick={loadTables}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Body - Tables Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Masalar yükleniyor...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Uygun masa bulunamadı</p>
                <p className="text-sm text-gray-500 mt-2">
                  {showOnlyEmpty ? 'Tüm boş masalar dolu' : 'Filtre kriterlerini değiştirin'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  {filteredTables.length} masa mevcut • {filteredTables.filter(t => t.isEmpty).length} boş
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredTables.map((table) => (
                    <motion.button
                      key={table._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTargetTable(table)}
                      disabled={table.status === 'maintenance'}
                      className={`
                        p-4 rounded-xl border-2 transition-all text-left
                        ${selectedTargetTable?._id === table._id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : table.status === 'maintenance'
                          ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          : table.isEmpty
                          ? 'border-green-300 bg-green-50 hover:border-green-400'
                          : 'border-amber-300 bg-amber-50 hover:border-amber-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${
                          table.isEmpty ? 'bg-green-100' : 'bg-qasa-accent/20'
                        }`}>
                          <Users className={`w-4 h-4 ${
                            table.isEmpty ? 'text-green-600' : 'text-qasa-accent'
                          }`} />
                        </div>
                        {selectedTargetTable?._id === table._id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        Masa {table.number}
                      </h3>
                      
                      {table.location && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {table.location}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{table.capacity} kişilik</span>
                      </div>
                      
                      <div className={`mt-2 px-2 py-1 rounded-full text-xs font-bold text-center ${
                        table.status === 'maintenance'
                          ? 'bg-red-100 text-red-600'
                          : table.isEmpty
                          ? 'bg-green-100 text-green-600'
                          : 'bg-qasa-accent/20 text-qasa-accent'
                      }`}>
                        {table.status === 'maintenance' ? 'Bakımda' : table.isEmpty ? 'Boş' : 'Dolu'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              disabled={transferring}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={() => {
                if (!selectedTargetTable) {
                  toast.error('Lütfen hedef masa seçin')
                  return
                }
                setShowConfirmModal(true)
              }}
              disabled={!selectedTargetTable || transferring}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                Masa Taşı
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Confirm Modal */}
      <TransferConfirmModal
        show={showConfirmModal}
        sourceTable={sourceTable}
        targetTable={selectedTargetTable}
        onConfirm={handleTransfer}
        onCancel={() => setShowConfirmModal(false)}
        loading={transferring}
      />
    </AnimatePresence>
  )
}