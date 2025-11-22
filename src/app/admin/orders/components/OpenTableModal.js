// src/app/admin/orders/components/OpenTableModal.js
'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, MapPin, Users, CheckCircle, Clock, 
  XCircle, Coffee, Loader, Grid, List, Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function OpenTableModal({
  show,
  onClose,
  onTableOpened // (table) => void - Masa açıldığında çağrılır
}) {
  // State
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [opening, setOpening] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  // Load tables when modal opens
  useEffect(() => {
    if (show) {
      loadTables()
    }
  }, [show])

  const loadTables = async () => {
    try {
      setLoading(true)
      console.log('🔄 [OPEN TABLE MODAL] Loading all tables...')
      
      // 1️⃣ Masaları yükle
      const tablesRes = await fetch(apiPath('/api/admin/tables'))
      const tablesData = await tablesRes.json()
      
      if (!tablesRes.ok) {
        toast.error('Masalar yüklenemedi')
        return
      }
      
      const allTables = tablesData.tables || tablesData || []
      console.log(`📋 [OPEN TABLE MODAL] ${allTables.length} masa yüklendi`)
      
      // 2️⃣ Aktif siparişleri yükle
      const ordersRes = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
      const ordersData = await ordersRes.json()
      
      const activeOrders = ordersData.success ? 
        (ordersData.originalOrders || ordersData.orders || []) : []
      
      console.log(`🔍 [OPEN TABLE MODAL] ${activeOrders.length} aktif sipariş`)
      
      // 3️⃣ Masa durumlarını güncelle
      const tablesWithStatus = allTables.map(table => {
        const tableNumberStr = table.number.toString().toUpperCase().trim()
        
        const hasActiveOrders = activeOrders.some(order => {
          const orderTableNum = (order.tableNumber || order.tableId)?.toString().toUpperCase().trim()
          return orderTableNum === tableNumberStr && 
                 !['completed', 'cancelled'].includes(order.status)
        })
        
        // Durumu güncelle
        let actualStatus = table.status
        if (hasActiveOrders && table.status === 'empty') {
          actualStatus = 'occupied'
        } else if (!hasActiveOrders && table.status === 'occupied') {
          actualStatus = 'empty'
        }
        
        return { 
          ...table, 
          actualStatus,
          hasActiveOrders,
          isAvailable: actualStatus === 'empty'
        }
      })
      
      setTables(tablesWithStatus)
      console.log(`✅ [OPEN TABLE MODAL] Masalar güncellendi`)
      
    } catch (error) {
      console.error('❌ [OPEN TABLE MODAL] Load error:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTable = async (table) => {
    if (!table.isAvailable) {
      toast.error('Bu masa müsait değil!')
      return
    }

    try {
      setOpening(true)
      setSelectedTable(table)
      
      console.log('🔓 [OPEN TABLE MODAL] Opening table:', table.number)

      // Boş sipariş oluştur
      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: table.number.toString(),
          tableId: table.number.toString(),
          items: [],
          totalAmount: 0,
          customerNotes: 'Masa açıldı - sipariş bekleniyor',
          status: 'pending'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`✅ Masa ${table.number} açıldı!`, {
          icon: '🎉',
          duration: 2000
        })
        
        // Modal'ı kapat
        onClose()
        
        // Parent'a bildir (AddItemModal'ı açması için)
        onTableOpened(table)
        
      } else {
        toast.error(result.error || 'Masa açılamadı')
      }
    } catch (error) {
      console.error('❌ [OPEN TABLE MODAL] Open error:', error)
      toast.error('Masa açma hatası: ' + error.message)
    } finally {
      setOpening(false)
      setSelectedTable(null)
    }
  }

  // Status config
  const statusConfig = {
    empty: { 
      label: 'Boş', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle, 
      bgColor: 'bg-green-500',
      available: true
    },
    occupied: { 
      label: 'Dolu', 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: Users, 
      bgColor: 'bg-red-500',
      available: false
    },
    reserved: { 
      label: 'Rezerve', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock, 
      bgColor: 'bg-yellow-500',
      available: false
    },
    maintenance: { 
      label: 'Bakımda', 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: XCircle, 
      bgColor: 'bg-gray-500',
      available: false
    }
  }

  // Location options (from tables page)
  const locationOptions = [
    { value: 'main', label: 'Ana Salon' },
    { value: 'terrace', label: 'Teras' },
    { value: 'garden', label: 'Bahçe' },
    { value: 'private', label: 'Özel Bölüm' },
    { value: 'bar', label: 'Bar' }
  ]

  const getLocationLabel = (location) => {
    const opt = locationOptions.find(o => o.value === location)
    return opt ? opt.label : location
  }

  // Filter tables
  const filteredTables = tables.filter(table => {
    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matches = 
        table.number.toString().includes(search) ||
        getLocationLabel(table.location).toLowerCase().includes(search) ||
        table.notes?.toLowerCase().includes(search)
      if (!matches) return false
    }
    
    // Status
    if (statusFilter === 'available') {
      return table.isAvailable
    } else if (statusFilter === 'occupied') {
      return !table.isAvailable
    } else if (statusFilter !== 'all') {
      return table.actualStatus === statusFilter
    }
    
    // Location
    if (locationFilter !== 'all') {
      return table.location === locationFilter
    }
    
    return true
  })

  // Stats
  const availableCount = tables.filter(t => t.isAvailable).length
  const occupiedCount = tables.filter(t => !t.isAvailable).length

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Coffee className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Masa Aç</h2>
                  <p className="text-sm opacity-90 mt-1">
                    {availableCount} boş masa • {occupiedCount} dolu masa
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Masa ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-medium focus:bg-white/30 focus:border-white/50 outline-none"
              >
                <option value="all" className="text-gray-900">Tüm Durumlar</option>
                <option value="available" className="text-gray-900">✅ Boş Masalar</option>
                <option value="occupied" className="text-gray-900">❌ Dolu Masalar</option>
                <option value="reserved" className="text-gray-900">🕐 Rezerve</option>
                <option value="maintenance" className="text-gray-900">🔧 Bakımda</option>
              </select>

              {/* Location Filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-medium focus:bg-white/30 focus:border-white/50 outline-none"
              >
                <option value="all" className="text-gray-900">Tüm Konumlar</option>
                {locationOptions.map(opt => (
                  <option key={opt.value} value={opt.value} className="text-gray-900">
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2.5 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                <span className="hidden sm:inline">{viewMode === 'grid' ? 'Liste' : 'Grid'}</span>
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Masalar yükleniyor...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-center py-20">
                <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Masa bulunamadı</p>
              </div>
            ) : viewMode === 'grid' ? (
              // GRID VIEW - BÜYÜK KARTLAR
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredTables.map((table) => {
                  const statusInfo = statusConfig[table.actualStatus]
                  const StatusIcon = statusInfo.icon
                  const isSelected = selectedTable?.number === table.number
                  
                  return (
                    <motion.button
                      key={table._id}
                      whileHover={table.isAvailable ? { scale: 1.02 } : {}}
                      whileTap={table.isAvailable ? { scale: 0.98 } : {}}
                      onClick={() => table.isAvailable && handleOpenTable(table)}
                      disabled={!table.isAvailable || opening}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                        table.isAvailable
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:border-green-400 cursor-pointer'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      } ${isSelected ? 'ring-4 ring-green-400' : ''}`}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Table Icon */}
                      <div className={`w-16 h-16 ${statusInfo.bgColor} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                        <span className="text-white font-bold text-lg">M{table.number}</span>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          Masa {table.number}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Users className="w-4 h-4" />
                          {table.capacity} kişilik
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {getLocationLabel(table.location)}
                        </div>
                      </div>

                      {/* Loading Overlay */}
                      {isSelected && opening && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <Loader className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                      )}

                      {/* Available Badge */}
                      {table.isAvailable && !opening && (
                        <div className="absolute bottom-2 left-2 right-2 bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg text-center">
                          Tıkla ve Aç
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            ) : (
              // LIST VIEW
              <div className="space-y-3">
                {filteredTables.map((table) => {
                  const statusInfo = statusConfig[table.actualStatus]
                  const StatusIcon = statusInfo.icon
                  const isSelected = selectedTable?.number === table.number
                  
                  return (
                    <motion.button
                      key={table._id}
                      whileHover={table.isAvailable ? { scale: 1.01 } : {}}
                      onClick={() => table.isAvailable && handleOpenTable(table)}
                      disabled={!table.isAvailable || opening}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        table.isAvailable
                          ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg hover:border-green-400 cursor-pointer'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                      } ${isSelected ? 'ring-4 ring-green-400' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Table Icon */}
                        <div className={`w-16 h-16 ${statusInfo.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-lg">M{table.number}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">
                              Masa {table.number}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {table.capacity} kişilik
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {getLocationLabel(table.location)}
                            </div>
                          </div>
                          {table.notes && (
                            <p className="text-xs text-gray-500 mt-1">{table.notes}</p>
                          )}
                        </div>

                        {/* Status Indicator */}
                        {table.isAvailable ? (
                          isSelected && opening ? (
                            <Loader className="w-6 h-6 text-green-600 animate-spin" />
                          ) : (
                            <div className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg">
                              Aç →
                            </div>
                          )
                        ) : (
                          <div className="px-4 py-2 bg-gray-300 text-gray-600 font-bold rounded-lg">
                            Kapalı
                          </div>
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-bold text-green-600">{availableCount} boş</span>
                {' • '}
                <span className="font-bold text-red-600">{occupiedCount} dolu</span>
                {' • '}
                <span className="font-bold text-gray-900">{tables.length} toplam</span>
              </div>
              
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}