// src/app/admin/orders/components/OrderDetailModal.js
'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ShoppingCart, Package, Clock, Activity, Plus, Printer, 
  CheckCircle, DollarSign, Trash2, MessageSquare, ChefHat,
  ArrowRightLeft, Minus, TrendingUp, Receipt, Coffee
} from 'lucide-react'
import Image from 'next/image'

export default function OrderDetailModal({
  showModal,
  selectedTable,
  statusConfig,
  getTimeAgo,
  updateItemStatus,
  updateItemQuantity,
  deleteOrder,
  onClose,
  onAddItem,
  onCloseTable,
  onTransferTable
}) {
  if (!showModal || !selectedTable) return null

  const totalItems = selectedTable.orders?.reduce((sum, o) => 
    sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0) || 0

  // Ödeme istatistikleri hesapla
  const calculatePaymentStats = () => {
    let totalPaid = 0
    let totalUnpaid = 0
    let paidItemsCount = 0
    let totalItemsCount = 0

    selectedTable.orders?.forEach(order => {
      order.items?.forEach(item => {
        const itemTotal = item.price * item.quantity
        const paidQty = item.paidQuantity || 0
        const isPaid = item.paid || paidQty === item.quantity

        totalItemsCount += item.quantity

        if (isPaid) {
          totalPaid += itemTotal
          paidItemsCount += item.quantity
        } else if (paidQty > 0) {
          const paidAmount = (item.price * paidQty)
          totalPaid += paidAmount
          totalUnpaid += (item.price * (item.quantity - paidQty))
          paidItemsCount += paidQty
        } else {
          totalUnpaid += itemTotal
        }
      })
    })

    return {
      totalPaid,
      totalUnpaid,
      paidItemsCount,
      totalItemsCount,
      paidPercentage: totalItemsCount > 0 ? (paidItemsCount / totalItemsCount * 100) : 0
    }
  }

  const paymentStats = calculatePaymentStats()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky */}
          <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                    {selectedTable.tableName || `Masa ${selectedTable.tableNumber}`}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm opacity-90">
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {selectedTable.orders?.length || 0} sipariş
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      {totalItems} ürün
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {getTimeAgo(selectedTable.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onTransferTable}
                  className="p-2 sm:px-4 sm:py-2 bg-white text-purple-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Masa Taşı</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAddItem}
                  className="p-2 sm:px-4 sm:py-2 bg-white text-amber-600 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Ürün Ekle</span>
                </motion.button>
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <div className="text-xs opacity-80">Toplam Tutar</div>
                </div>
                <div className="text-2xl font-bold">₺{selectedTable.totalAmount?.toFixed(2)}</div>
              </div>
              
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <div className="text-xs opacity-80">Ödenen</div>
                </div>
                <div className="text-2xl font-bold text-green-300">₺{paymentStats.totalPaid.toFixed(2)}</div>
              </div>
              
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <div className="text-xs opacity-80">Kalan</div>
                </div>
                <div className="text-2xl font-bold text-amber-100">₺{paymentStats.totalUnpaid.toFixed(2)}</div>
              </div>
              
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt className="w-4 h-4" />
                  <div className="text-xs opacity-80">Ödeme Oranı</div>
                </div>
                <div className="text-2xl font-bold">%{paymentStats.paidPercentage.toFixed(0)}</div>
                <div className="mt-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentStats.paidPercentage}%` }}
                    className="h-full bg-green-400 rounded-full"
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Sol taraf - Siparişler (2/3) */}
                <div className="xl:col-span-2 space-y-4">
                  {(selectedTable.orders || []).map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-5 border-2 border-gray-200 hover:border-amber-300 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-300">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Sipariş #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                            </h3>
                            <p className="text-sm text-gray-600">{getTimeAgo(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-amber-600">₺{order.totalAmount.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {(order.items || []).map((item, itemIdx) => {
                          const totalQuantity = item.quantity
                          const paidQuantity = item.paidQuantity || 0
                          const isPaid = item.paid || paidQuantity === totalQuantity
                          const isPartiallyPaid = paidQuantity > 0 && paidQuantity < totalQuantity

                          return (
                            <motion.div
                              key={itemIdx}
                              whileHover={{ scale: 1.01 }}
                              className={`bg-white rounded-xl p-3 sm:p-4 border-2 relative transition-all ${
                                isPaid 
                                  ? 'border-green-300 shadow-green-100 shadow-lg' 
                                  : isPartiallyPaid
                                  ? 'border-amber-300 shadow-amber-100 shadow-lg'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {/* Ödendi Badge */}
                              {isPaid && (
                                <div className="absolute top-2 right-2 z-10">
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    ÖDENDİ
                                  </motion.div>
                                </div>
                              )}

                              {/* Kısmi Ödeme Badge */}
                              {isPartiallyPaid && !isPaid && (
                                <div className="absolute top-2 right-2 z-10">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg"
                                  >
                                    {paidQuantity}/{totalQuantity} ÖDENDİ
                                  </motion.div>
                                </div>
                              )}

                              <div className="flex items-start gap-3 mb-3">
                                {/* Image */}
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                                  {item.image ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                      sizes="80px"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-8 h-8 text-amber-400" />
                                    </div>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 pr-24">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-gray-900 text-base sm:text-lg">{item.name}</h4>
                                    <span className="text-lg font-bold text-amber-600 whitespace-nowrap">
                                      ₺{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Birim: ₺{item.price.toFixed(2)}
                                  </p>

                                  {/* 🆕 Zorunlu Seçimler (selectedOptions) */}
                                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Coffee className="w-4 h-4 text-purple-600" />
                                        <span className="text-xs font-bold text-purple-600 uppercase">Seçimler</span>
                                      </div>
                                      <div className="space-y-1">
                                        {item.selectedOptions.map((sel, selIdx) => (
                                          <div key={selIdx} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-100">
                                            <span className="text-xs text-gray-700">
                                              <span className="font-bold text-purple-700">{sel.groupLabel}:</span> {sel.selectedLabel}
                                            </span>
                                            {sel.price > 0 && (
                                              <span className="text-xs font-bold text-amber-600">+₺{sel.price.toFixed(2)}</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Customizations */}
                                  {(item.customizations?.removed?.length > 0 || item.customizations?.extras?.length > 0) && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <ChefHat className="w-4 h-4 text-amber-600" />
                                        <span className="text-xs font-bold text-amber-600 uppercase">Özelleştirme</span>
                                      </div>
                                      {item.customizations.removed?.length > 0 && (
                                        <div className="text-xs text-red-600 mb-1">
                                          <strong>Çıkarılan:</strong> {item.customizations.removed.map(r => r.name || r).join(', ')}
                                        </div>
                                      )}
                                      {item.customizations.extras?.length > 0 && (
                                        <div className="text-xs text-green-600">
                                          <strong>Ekstra:</strong> {item.customizations.extras.map(e => e.name || e).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {item.notes && (
                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-gray-700">{item.notes}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Status Buttons */}
                              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-200 mb-3">
                                {Object.entries(statusConfig).filter(([key]) => 
                                  ['pending', 'preparing', 'ready', 'delivered'].includes(key)
                                ).map(([status, config]) => {
                                  const Icon = config.icon
                                  const isActive = item.status === status
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => updateItemStatus(order.id, itemIdx, status)}
                                      disabled={isActive}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                                        ${isActive 
                                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-md` 
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                      <Icon className="w-3 h-3" />
                                      <span className="hidden sm:inline">{config.label}</span>
                                    </button>
                                  )
                                })}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                <span className="text-sm font-medium text-gray-700">Miktar:</span>
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      const newQty = item.quantity - 1
                                      
                                      // Son ürün ise confirm göster
                                      if (newQty === 0) {
                                        if (!confirm(`${item.name} ürününü silmek istediğinizden emin misiniz?`)) {
                                          return
                                        }
                                      }
                                      
                                      updateItemQuantity(order.id || order._id, itemIdx, newQty)
                                    }}
                                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </motion.button>
                                  
                                  <div className="w-16 text-center">
                                    <div className="text-2xl font-bold text-gray-900">{item.quantity}</div>
                                    <div className="text-xs text-gray-500">adet</div>
                                  </div>
                                  
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      updateItemQuantity(order.id || order._id, itemIdx, item.quantity + 1)
                                    }}
                                    className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Order Notes */}
                      {order.customerNotes && (
                        <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                            <p className="text-sm text-amber-900">{order.customerNotes}</p>
                          </div>
                        </div>
                      )}

                      {/* Delete Order */}
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <button
                          onClick={() => deleteOrder(order._id || order.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Bu Siparişi Sil
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Sağ taraf - Özet (1/3) */}
                <div className="xl:col-span-1 space-y-4">
                  {/* Toplam Özet */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200 sticky top-4">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-amber-200">
                      <div className="p-2.5 bg-amber-500 rounded-xl">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Sipariş Özeti</h3>
                    </div>

                    {/* Ürün Listesi Özet */}
                    <div className="space-y-2 mb-4">
                      {selectedTable.orders?.map(order => 
                        order.items?.map((item, idx) => {
                          const isPaid = item.paid || (item.paidQuantity === item.quantity)
                          return (
                            <div 
                              key={`${order.id}-${idx}`} 
                              className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                                isPaid ? 'bg-green-100 text-green-900' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                {isPaid && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                <span className={`font-medium ${isPaid ? 'line-through opacity-70 text-green-700' : 'text-gray-900'}`}>
                                  {item.quantity}x {item.name}
                                </span>
                              </div>
                              <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
                                ₺{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Toplam Hesaplar */}
                    <div className="space-y-3 pt-4 border-t-2 border-amber-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-medium">Ara Toplam:</span>
                        <span className="font-bold text-lg text-gray-900">₺{selectedTable.totalAmount?.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-green-600">
                        <span className="flex items-center gap-2 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Ödenen:
                        </span>
                        <span className="font-bold text-lg">₺{paymentStats.totalPaid.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-amber-600">
                        <span className="flex items-center gap-2 font-medium">
                          <TrendingUp className="w-4 h-4" />
                          Kalan:
                        </span>
                        <span className="font-bold text-lg">₺{paymentStats.totalUnpaid.toFixed(2)}</span>
                      </div>
                      
                      <div className="pt-3 border-t-2 border-amber-300">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-bold text-gray-900">Genel Toplam:</span>
                          <span className="text-2xl font-bold text-amber-600">
                            ₺{selectedTable.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                          {paymentStats.paidItemsCount}/{totalItems} ürün ödendi (%{paymentStats.paidPercentage.toFixed(0)})
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-amber-200">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{selectedTable.orders?.length || 0}</div>
                        <div className="text-xs text-gray-600">Sipariş</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                        <div className="text-xs text-gray-600">Ürün</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex-shrink-0 p-4 sm:p-6 bg-gray-50 border-t flex flex-wrap gap-3">
            <button
              onClick={onClose}
              className="flex-1 min-w-[120px] px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-bold"
            >
              Kapat
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 min-w-[120px] px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Yazdır
            </button>
            <button
              onClick={onCloseTable}
              className="flex-1 min-w-[120px] px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <DollarSign className="w-5 h-5" />
              Masayı Kapat
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}