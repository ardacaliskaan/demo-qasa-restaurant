// src/app/admin/orders/components/YazarKasaV2Modal.js
'use client'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, DollarSign, Package, CheckCircle, Clock, 
  Coffee, MessageSquare, Minus, Plus, ShoppingCart,
  CreditCard, Banknote, Smartphone, ArrowRight, Receipt,
  AlertCircle, Users, Percent, ChevronDown // 🆕 ChevronDown eklendi
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function YazarKasaModal({
  show,
  selectedTable,
  getTimeAgo,
  updateItemPaidStatus,
  onClose,
  onComplete
}) {
  // State: Her ürün için ödeme yapılacak miktar
  const [paymentQuantities, setPaymentQuantities] = useState({})
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash') // cash, card
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false)
  
  // 🆕 Bölme ve İndirim State'leri
  const [discountAmount, setDiscountAmount] = useState(0) // İndirim tutarı
  const [discountPercent, setDiscountPercent] = useState(0) // İndirim yüzdesi
  const [discountType, setDiscountType] = useState('percent') // 'percent' veya 'amount'
  const [splitCount, setSplitCount] = useState(1) // Kaça bölünecek (1 = bölme yok)
  
  // 🆕 Accordion state'leri
  const [showSplitPanel, setShowSplitPanel] = useState(false) // Hesabı böl paneli açık mı?
  const [showDiscountPanel, setShowDiscountPanel] = useState(false) // İndirim paneli açık mı?

  // ✅ HOOK'LAR EARLY RETURN'DEN ÖNCE OLMALI
  // Tüm ürünleri flatten et (order bazından ürün bazına çevir)
  const allItems = useMemo(() => {
    if (!selectedTable) return []
    
    const items = []
    selectedTable.orders?.forEach(order => {
      order.items?.forEach((item, idx) => {
        // Ödenen ve ödenmemiş miktarları hesapla
        const totalQuantity = item.quantity
        const paidQuantity = item.paidQuantity || 0
        const remainingQuantity = totalQuantity - paidQuantity
        
        // HEM ödenen HEM ödenmemiş ürünleri ekle (görünüm için)
        items.push({
          orderId: order._id || order.id,
          itemIdx: idx,
          ...item,
          totalQuantity,
          paidQuantity,
          remainingQuantity,
          orderNumber: order.orderNumber,
          orderTime: order.createdAt,
          isPaid: item.paid || paidQuantity === totalQuantity,
          isPartiallyPaid: paidQuantity > 0 && paidQuantity < totalQuantity
        })
      })
    })
    
    console.log('📦 [ALL ITEMS] Updated', {
      total: items.length,
      paid: items.filter(i => i.isPaid).length,
      partial: items.filter(i => i.isPartiallyPaid).length,
      unpaid: items.filter(i => !i.isPaid && !i.isPartiallyPaid).length,
      tableNumber: selectedTable.tableNumber,
      items: items.map(i => ({
        name: i.name,
        total: i.totalQuantity,
        paid: i.paidQuantity,
        remaining: i.remainingQuantity,
        isPaid: i.isPaid
      }))
    })
    
    return items
  }, [selectedTable])

  // 🆕 selectedTable değiştiğinde paymentQuantities'i temizle
  useEffect(() => {
    if (selectedTable) {
      console.log('🔄 [MODAL] selectedTable updated, resetting selections')
      setPaymentQuantities({})
    }
  }, [selectedTable?.orders?.length, selectedTable?.totalAmount])

  // Seçili ürünlerin toplam tutarını hesapla
  const selectedTotal = useMemo(() => {
    if (!selectedTable) return 0
    
    return Object.entries(paymentQuantities).reduce((sum, [key, qty]) => {
      const item = allItems.find(i => `${i.orderId}-${i.itemIdx}` === key)
      if (item && qty > 0) {
        return sum + (item.price * qty)
      }
      return sum
    }, 0)
  }, [paymentQuantities, allItems, selectedTable])

  // 🆕 İndirim hesaplaması
  const discountAmountCalculated = useMemo(() => {
    if (discountPercent > 0) {
      return (selectedTotal * discountPercent) / 100
    }
    return discountAmount
  }, [selectedTotal, discountAmount, discountPercent])

  // 🆕 İndirimli toplam
  const totalAfterDiscount = useMemo(() => {
    return Math.max(0, selectedTotal - discountAmountCalculated)
  }, [selectedTotal, discountAmountCalculated])

  // 🆕 Bölünmüş tutar (kişi başı)
  const perPersonAmount = useMemo(() => {
    if (splitCount <= 1) return totalAfterDiscount
    return totalAfterDiscount / splitCount
  }, [totalAfterDiscount, splitCount])

  // Toplam kalan tutar
  const totalRemaining = useMemo(() => {
    if (!selectedTable) return 0
    
    return allItems.reduce((sum, item) => 
      sum + (item.price * item.remainingQuantity), 0
    )
  }, [allItems, selectedTable])

  // Toplam ödenen tutar
  const totalPaid = useMemo(() => {
    if (!selectedTable) return 0
    
    return selectedTable.orders?.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        const paidQty = item.paidQuantity || 0
        return itemSum + (item.price * paidQty)
      }, 0)
    }, 0) || 0
  }, [selectedTable])

  // 🆕 TÜM ÜRÜNLER ÖDENDİ Mİ?
  const allPaid = useMemo(() => {
    const result = allItems.every(item => item.remainingQuantity === 0 || item.isPaid)
    
    console.log('🔍 [ALLPAID CHECK]', {
      allPaid: result,
      totalItems: allItems.length,
      paidItems: allItems.filter(i => i.isPaid).length,
      zeroRemaining: allItems.filter(i => i.remainingQuantity === 0).length,
      items: allItems.map(i => ({
        name: i.name,
        remaining: i.remainingQuantity,
        isPaid: i.isPaid,
        paidQty: i.paidQuantity,
        totalQty: i.totalQuantity
      }))
    })
    
    return result
  }, [allItems])

  // ✅ EARLY RETURN HOOK'LARDAN SONRA
  if (!show || !selectedTable) return null

  // Miktar değiştirme
  const handleQuantityChange = (itemKey, delta) => {
    const item = allItems.find(i => `${i.orderId}-${i.itemIdx}` === itemKey)
    if (!item) return

    setPaymentQuantities(prev => {
      const current = prev[itemKey] || 0
      const newValue = Math.max(0, Math.min(item.remainingQuantity, current + delta))
      
      if (newValue === 0) {
        const { [itemKey]: _, ...rest } = prev
        return rest
      }
      
      return {
        ...prev,
        [itemKey]: newValue
      }
    })
  }

  // Hızlı seçim (Tümünü seç/temizle)
  const handleQuickSelect = (itemKey, selectAll = false) => {
    const item = allItems.find(i => `${i.orderId}-${i.itemIdx}` === itemKey)
    if (!item) return

    setPaymentQuantities(prev => {
      if (selectAll) {
        return {
          ...prev,
          [itemKey]: item.remainingQuantity
        }
      } else {
        const { [itemKey]: _, ...rest } = prev
        return rest
      }
    })
  }

  // Tümünü seç
  const selectAllItems = () => {
    const newQuantities = {}
    allItems.forEach(item => {
      const key = `${item.orderId}-${item.itemIdx}`
      newQuantities[key] = item.remainingQuantity
    })
    setPaymentQuantities(newQuantities)
  }

  // Tümünü temizle
  const clearAll = () => {
    setPaymentQuantities({})
  }

  // Ödeme işlemi - önce modal aç
  const handleProcessPayment = () => {
    if (selectedTotal === 0) return
    setShowPaymentMethodModal(true)
  }

  // 🆕 MASAYI KAPAT FONKSİYONU
  const handleCloseTable = async () => {
    if (!selectedTable) return

    try {
      setProcessing(true)

      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'closeTable',
          tableNumber: selectedTable.tableNumber.toString()
        })
      })

      const result = await res.json()

      if (result.success) {
        // 🔊 SES ÇALDIR
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.7
        audio.play().catch(e => console.log('Audio play failed:', e))
        
        toast.success(`✅ Masa ${selectedTable.tableNumber} kapatıldı!`, {
          icon: '🎉',
          duration: 3000
        })
        
        // Silent refresh
        if (onComplete) {
          await onComplete(0, 'completed')
        }
        
        // Her iki modalı da kapat
        setShowConfirmCloseModal(false)
        
        setTimeout(() => {
          onClose() // Ana modal'ı kapat
        }, 500)
      } else {
        toast.error(result.error || 'Masa kapatılamadı')
      }
    } catch (error) {
      console.error('Close table error:', error)
      toast.error('Masa kapatma hatası')
    } finally {
      setProcessing(false)
    }
  }

  // Gerçek ödeme işlemi
  const confirmPayment = async () => {
    try {
      setProcessing(true)
      setShowPaymentMethodModal(false)

      console.log('🚀 ÖDEME BAŞLADI')
      console.log('📦 Payment Quantities:', paymentQuantities)
      console.log('💳 Payment Method:', paymentMethod)
      console.log('📋 All Items:', allItems)

      // Her seçili ürün için ödeme yap
      for (const [key, qty] of Object.entries(paymentQuantities)) {
        if (qty > 0) {
          const [orderId, itemIdx] = key.split('-')
          const item = allItems.find(i => 
            `${i.orderId}-${i.itemIdx}` === key
          )
          
          console.log('💰 İşlem yapılıyor:', {
            key,
            orderId,
            itemIdx,
            qty,
            item: item?.name
          })
          
          if (item) {
            // Backend'e kısmi ödeme bilgisi gönder
            const payload = {
              id: orderId,
              action: 'updateItemPartialPaid',
              itemOrderId: orderId,
              itemIdx: parseInt(itemIdx),
              quantityPaid: qty,
              paymentMethod: paymentMethod
            }
            
            console.log('📤 API Request:', payload)

            const res = await fetch(apiPath('/api/orders'), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })

            const result = await res.json()
            console.log('📥 API Response:', result)

            if (!result.success) {
              throw new Error(result.error || 'Ödeme hatası')
            }

            toast.success(`✅ ${item.name} - ${qty} adet ödendi`)
          }
        }
      }

      console.log('✅ TÜM ÖDEMELER TAMAMLANDI')

      // Toast göster
      toast.success('Ödeme işlemi tamamlandı!', { duration: 3000 })
      
      // Seçimi temizle
      setPaymentQuantities({})
      
      // Callback çağır (silent refresh için)
      if (onComplete) {
        await onComplete(selectedTotal, paymentMethod)
      }
      
      // ❌ MODAL KAPATMA - KALDIRILDI
      // setTimeout(() => {
      //   onClose()
      // }, 500)

    } catch (error) {
      console.error('❌ Payment error:', error)
      toast.error(error.message || 'Ödeme işlemi başarısız')
    } finally {
      setProcessing(false)
    }
  }

  const paymentMethods = [
    { id: 'cash', label: 'Nakit', icon: Banknote, color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
    { id: 'card', label: 'Kredi Kartı', icon: CreditCard, color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-700' }
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-[95vw] h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex-shrink-0 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Receipt className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Yazar Kasa</h1>
                  <p className="text-lg opacity-90 mt-1">
                    {selectedTable.tableName || `Masa ${selectedTable.tableNumber}`}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Quick Stats - Küçültülmüş */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-xs opacity-90">Toplam</div>
                <div className="text-xl font-bold mt-1">
                  ₺{(totalPaid + totalRemaining).toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-green-400/30 backdrop-blur-sm rounded-lg border border-green-300">
                <div className="text-xs opacity-90">Ödenen</div>
                <div className="text-xl font-bold mt-1">₺{totalPaid.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-red-400/30 backdrop-blur-sm rounded-lg border border-red-300">
                <div className="text-xs opacity-90">Kalan</div>
                <div className="text-xl font-bold mt-1">₺{totalRemaining.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* BODY - SPLIT LAYOUT - EŞİT PANELLER */}
          <div className="flex-1 flex overflow-hidden">
            {/* SOL: ÜRÜN LİSTESİ - Eşit genişlik */}
            <div className="flex-1 min-w-0 overflow-y-auto p-6 bg-gray-50 border-r-2 border-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-emerald-600" />
                  Ürünler ({allItems.length})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllItems}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg font-medium text-sm transition-colors"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                  >
                    Temizle
                  </button>
                </div>
              </div>

              {/* Ürün Kartları - Normal boyut, sadece liste dar */}
              <div className="space-y-2">
                {allItems.map((item) => {
                  const itemKey = `${item.orderId}-${item.itemIdx}`
                  const selectedQty = paymentQuantities[itemKey] || 0
                  const isSelected = selectedQty > 0
                  const canSelect = item.remainingQuantity > 0 && !item.isPaid

                  return (
                    <motion.div
                      key={itemKey}
                      layout
                      onClick={() => {
                        if (canSelect && selectedQty === 0) {
                          handleQuickSelect(itemKey, true)
                        }
                      }}
                      className={`
                        bg-white rounded-lg p-3 border-2 transition-all
                        ${item.isPaid 
                          ? 'opacity-60 cursor-not-allowed border-green-200 bg-green-50' 
                          : canSelect 
                            ? 'cursor-pointer ' + (isSelected 
                              ? 'border-emerald-500 shadow-md ring-1 ring-emerald-300' 
                              : 'border-gray-200 hover:border-emerald-400')
                            : 'opacity-50 cursor-not-allowed border-gray-200'
                        }
                      `}
                    >
                      <div className="flex gap-3">
                        {/* Ürün Görseli - Normal */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Coffee className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                          
                          {/* Ödendi Badge - Resim üzerinde */}
                          {item.isPaid && (
                            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          {/* İsim + Fiyat */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                                {item.name}
                              </h3>
                              
                              {/* Ödeme Durumu Badge */}
                              {item.isPaid && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded mt-1">
                                  <CheckCircle className="w-3 h-3" />
                                  ÖDENDİ
                                </span>
                              )}
                              {item.isPartiallyPaid && !item.isPaid && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded mt-1">
                                  {item.paidQuantity}x ÖDENDİ
                                </span>
                              )}
                            </div>
                            <div className="text-base font-bold text-emerald-600 whitespace-nowrap">
                              ₺{item.price.toFixed(2)}
                            </div>
                          </div>

                          {/* Badge'ler */}
                          <div className="flex items-center gap-1.5 text-[10px] mb-2">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
                              Toplam: {item.totalQuantity}
                            </span>
                            {item.paidQuantity > 0 && (
                              <span className="px-1.5 py-0.5 bg-green-100 rounded font-medium text-green-600">
                                Ödenen: {item.paidQuantity}
                              </span>
                            )}
                            {item.remainingQuantity > 0 && (
                              <span className="px-1.5 py-0.5 bg-orange-100 rounded font-medium text-orange-600">
                                Kalan: {item.remainingQuantity}
                              </span>
                            )}
                          </div>

                          {/* Miktar kontrolleri - Sadece ödenmemiş ürünler için */}
                          {canSelect && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleQuantityChange(itemKey, -1)
                                }}
                                disabled={selectedQty === 0}
                                className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center"
                              >
                                <Minus className="w-4 h-4 text-gray-700" />
                              </button>

                              <input
                                type="number"
                                min="0"
                                max={item.remainingQuantity}
                                value={selectedQty}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  const clamped = Math.max(0, Math.min(item.remainingQuantity, val))
                                  
                                  setPaymentQuantities(prev => {
                                    if (clamped === 0) {
                                      const { [itemKey]: _, ...rest } = prev
                                      return rest
                                    }
                                    return { ...prev, [itemKey]: clamped }
                                  })
                                }}
                                className="w-12 text-center text-sm font-bold border border-gray-300 rounded-md py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                              />
                              <span className="text-xs text-gray-400 font-medium">/ {item.remainingQuantity}</span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleQuantityChange(itemKey, 1)
                                }}
                                disabled={selectedQty >= item.remainingQuantity}
                                className="w-7 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 text-white flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {selectedQty === 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickSelect(itemKey, true)
                                  }}
                                  className="px-2.5 py-1 bg-emerald-500 text-white hover:bg-emerald-600 rounded-md font-bold text-xs"
                                >
                                  SEÇ
                                </button>
                              )}
                            </div>
                          )}

                          {/* Ödendi mesajı - Ödenen ürünler için */}
                          {item.isPaid && (
                            <div className="text-xs text-green-700 font-medium mt-2">
                              ✅ Bu ürün ödenmiştir
                            </div>
                          )}

                          {/* Seçim göstergesi */}
                          {selectedQty > 0 && canSelect && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 pt-2 border-t border-emerald-200"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-emerald-700">
                                  {selectedQty} adet seçildi
                                </span>
                                <span className="font-bold text-emerald-600">
                                  ₺{(item.price * selectedQty).toFixed(2)}
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {allItems.length === 0 && (
                <div className="text-center py-20">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Tüm Ürünler Ödendi! 🎉
                  </h3>
                  <p className="text-gray-600">Bu masada ödeme bekleyen ürün kalmadı.</p>
                </div>
              )}
            </div>

            {/* SAĞ: ÖDEME PANELİ - Eşit genişlik */}
            <div className="flex-1 min-w-0 bg-white flex flex-col border-l-2 border-gray-300">
              {/* Ödeme Özeti */}
              <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-gray-900 flex-shrink-0">
                  <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  Ödeme Özeti
                </h2>

                {/* Seçili Ürünler - Scrollable & Centered */}
                <div className="flex-1 flex items-center justify-center overflow-hidden">
                  <div className="w-full max-h-full overflow-y-auto pr-2">
                    {Object.entries(paymentQuantities).length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <ShoppingCart className="w-12 h-12 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-bold">Ödeme için ürüne tıklayın</p>
                        <p className="text-gray-400 text-sm mt-1">Soldan ürün seçin</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(paymentQuantities).map(([key, qty]) => {
                          if (qty === 0) return null
                          const item = allItems.find(i => `${i.orderId}-${i.itemIdx}` === key)
                          if (!item) return null

                          return (
                            <motion.div 
                              key={key} 
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-emerald-200 shadow-md hover:shadow-lg transition-all"
                            >
                              <div className="flex-1">
                                <div className="font-bold text-base text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {qty} adet × ₺{item.price.toFixed(2)}
                                </div>
                              </div>
                              <div className="text-xl font-black text-emerald-600">
                                ₺{(item.price * qty).toFixed(2)}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toplam - Dengeli */}
              <div className="flex-shrink-0 p-6 border-t-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Ara Toplam */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base font-medium text-gray-600">Ara Toplam</span>
                  <span className="text-xl font-bold text-gray-900">₺{selectedTotal.toFixed(2)}</span>
                </div>

                {/* 🆕 HESABI BÖL - ACCORDION */}
                <div className="mb-3 pb-3 border-b border-gray-300">
                  {/* Header - Her zaman görünür */}
                  <button
                    onClick={() => setShowSplitPanel(!showSplitPanel)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Hesabı Böl
                      {splitCount > 1 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          {splitCount} Kişi
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {splitCount > 1 && (
                        <span className="text-sm font-bold text-blue-600">₺{perPersonAmount.toFixed(2)}/kişi</span>
                      )}
                      <motion.div
                        animate={{ rotate: showSplitPanel ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Body - Açıldığında görünür */}
                  <AnimatePresence>
                    {showSplitPanel && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">Kaç kişiye bölünecek?</span>
                            {splitCount > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSplitCount(1)
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Sıfırla
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[2, 3, 4, 5].map(count => (
                              <button
                                key={count}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSplitCount(count)
                                }}
                                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                                  splitCount === count
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-400'
                                }`}
                              >
                                {count}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 🆕 İNDİRİM UYGULA - ACCORDION */}
                <div className="mb-3 pb-3 border-b border-gray-300">
                  {/* Header - Her zaman görünür */}
                  <button
                    onClick={() => setShowDiscountPanel(!showDiscountPanel)}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-orange-600" />
                      İndirim
                      {discountAmountCalculated > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                          {discountType === 'percent' ? `%${discountPercent}` : `₺${discountAmount}`}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {discountAmountCalculated > 0 && (
                        <span className="text-sm font-bold text-orange-600">-₺{discountAmountCalculated.toFixed(2)}</span>
                      )}
                      <motion.div
                        animate={{ rotate: showDiscountPanel ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </button>

                  {/* Body - Açıldığında görünür */}
                  <AnimatePresence>
                    {showDiscountPanel && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">İndirim türü seçin</span>
                            {(discountAmount > 0 || discountPercent > 0) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDiscountAmount(0)
                                  setDiscountPercent(0)
                                  setDiscountType('percent')
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Sıfırla
                              </button>
                            )}
                          </div>
                          
                          {/* Toggle: Yüzde / Tutar */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDiscountType('percent')
                                setDiscountAmount(0)
                              }}
                              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                                discountType === 'percent'
                                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-orange-400'
                              }`}
                            >
                              <Percent className="w-4 h-4 inline mr-1" />
                              Yüzde
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDiscountType('amount')
                                setDiscountPercent(0)
                              }}
                              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                                discountType === 'amount'
                                  ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                  : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-orange-400'
                              }`}
                            >
                              <DollarSign className="w-4 h-4 inline mr-1" />
                              Tutar
                            </button>
                          </div>

                          {/* Yüzde Seçiliyse */}
                          {discountType === 'percent' && (
                            <div className="grid grid-cols-4 gap-2">
                              {[5, 10, 15, 20].map(percent => (
                                <button
                                  key={percent}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDiscountPercent(percent)
                                    setDiscountAmount(0)
                                  }}
                                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                                    discountPercent === percent
                                      ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
                                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-orange-400'
                                  }`}
                                >
                                  %{percent}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Tutar Seçiliyse */}
                          {discountType === 'amount' && (
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max={selectedTotal}
                                value={discountAmount || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const val = Math.min(selectedTotal, Math.max(0, parseFloat(e.target.value) || 0))
                                  setDiscountAmount(val)
                                  setDiscountPercent(0)
                                }}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-lg font-bold"
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* TOPLAM */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-gray-400">
                  <span className="text-lg font-black text-gray-900">TOPLAM</span>
                  <div className="text-right">
                    {discountAmountCalculated > 0 && (
                      <div className="text-sm text-gray-500 line-through mb-1">₺{selectedTotal.toFixed(2)}</div>
                    )}
                    <span className="text-2xl font-black text-emerald-600">
                      ₺{totalAfterDiscount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ödeme Butonu - Conditional */}
              <div className="flex-shrink-0 p-6 bg-gradient-to-br from-white to-gray-50">
                {allPaid ? (
                  // TÜM ÜRÜNLER ÖDENDİ - MASAYI KAPAT BUTONU
                  <button
                    onClick={() => setShowConfirmCloseModal(true)}
                    disabled={processing}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white font-black text-xl hover:from-purple-600 hover:via-purple-700 hover:to-indigo-700 transition-all shadow-xl hover:shadow-purple-500/50 disabled:opacity-50"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Package className="w-6 h-6" />
                        </motion.div>
                        KAPATILIYOR...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        MASAYI KAPAT
                        <ArrowRight className="w-6 h-6" />
                      </span>
                    )}
                  </button>
                ) : (
                  // ÖDEME AL BUTONU (Normal)
                  <button
                    onClick={handleProcessPayment}
                    disabled={selectedTotal === 0 || processing}
                    className={`
                      w-full py-5 rounded-xl font-black text-xl transition-all transform
                      ${selectedTotal > 0 && !processing
                        ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed text-gray-500 shadow-sm'
                      }
                    `}
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Package className="w-6 h-6" />
                        </motion.div>
                        İŞLENİYOR...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-3">
                        ÖDEME AL
                        <ArrowRight className="w-6 h-6" />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ÖDEME YÖNTEMİ MODALI */}
        <AnimatePresence>
          {showPaymentMethodModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10"
              onClick={() => setShowPaymentMethodModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ödeme Yöntemi</h3>
                <p className="text-gray-600 mb-6">Ödeme şeklini seçin</p>

                {/* Yan yana 2 kolon */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {paymentMethods.map(method => {
                    const Icon = method.icon
                    const isSelected = paymentMethod === method.id
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`
                          p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3
                          ${isSelected 
                            ? `${method.borderColor} ${method.bgColor} shadow-lg ring-2 ${method.borderColor.replace('border', 'ring')}` 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className={`p-4 rounded-xl ${isSelected ? method.bgColor : 'bg-gray-100'}`}>
                          <Icon className={`w-8 h-8 ${isSelected ? method.textColor : 'text-gray-600'}`} />
                        </div>
                        <div className={`font-bold text-lg ${isSelected ? method.textColor : 'text-gray-900'}`}>
                          {method.label}
                        </div>
                        {isSelected && (
                          <CheckCircle className={`w-6 h-6 ${method.textColor}`} />
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="text-center mb-6">
                  <div className="text-sm text-gray-500 mb-1">Ödenecek Tutar</div>
                  <div className="text-4xl font-black text-emerald-600">
                    ₺{selectedTotal.toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentMethodModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={confirmPayment}
                    disabled={processing}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {processing ? 'İşleniyor...' : 'Onayla'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🆕 MASAYI KAPAT ONAY MODALI */}
        <AnimatePresence>
          {showConfirmCloseModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              onClick={() => setShowConfirmCloseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Masayı Kapat</h3>
                      <p className="text-sm opacity-90 mt-1">
                        {selectedTable?.tableName || `Masa ${selectedTable?.tableNumber}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900 font-medium mb-2">
                          Masa kapatılacak, emin misiniz?
                        </p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• Tüm siparişler tamamlanacak</li>
                          <li>• Masa boş duruma geçecek</li>
                          <li>• Bu işlem geri alınamaz</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Toplam Tutar</span>
                      <span className="text-2xl font-black text-purple-600">
                        ₺{selectedTable?.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{selectedTable?.orders?.length} sipariş</span>
                      <span className="text-green-600 font-bold">✓ Tümü ödendi</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirmCloseModal(false)}
                      disabled={processing}
                      className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCloseTable}
                      disabled={processing}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Package className="w-5 h-5" />
                          </motion.div>
                          Kapatılıyor...
                        </span>
                      ) : (
                        'Evet, Kapat'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}