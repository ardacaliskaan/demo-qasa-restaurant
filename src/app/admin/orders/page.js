// src/app/admin/orders/page.js - REFACTORED VERSION
'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, Search, Filter, Package, Activity, 
  MapPin, MessageSquare, DollarSign, RefreshCw,
  Download, BarChart3, Grid, List, Bell, BellOff,
  Maximize, Minimize, ShoppingCart, Plus, Eye, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

// Import Components
import OrderDetailModal from './components/OrderDetailModal'
import YazarKasaModal from './components/YazarKasaModal'
import AddItemModal from './components/AddItemModal'
import NotificationSettingsModal from './components/NotificationSettingsModal'
import OpenTableModal from './components/OpenTableModal'
import StatsModal from './components/StatsModal'
import TransferTableModal from './components/TransferTableModal'

// 🆕 HELPER FUNCTION - Zorunlu seçimleri formatla
/**
 * Zorunlu seçimleri kısa formatta döndürür
 * Örnek: "(Büyük, Şekerli)" veya "(Orta Pişmiş)"
 */
const formatSelectedOptions = (selectedOptions) => {
  if (!selectedOptions || selectedOptions.length === 0) return ''
  
  // Sadece seçilen değerleri al (groupLabel'ı atla)
  const optionLabels = selectedOptions.map(opt => opt.selectedLabel).filter(Boolean)
  
  if (optionLabels.length === 0) return ''
  
  return ` (${optionLabels.join(', ')})`
}

export default function AdminOrdersPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // Orders & Data
  const [orders, setOrders] = useState([])
  const [originalOrders, setOriginalOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal States
  const [selectedTable, setSelectedTable] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [addItemToTable, setAddItemToTable] = useState(null)
  const [showNewAddItemModal, setShowNewAddItemModal] = useState(false)
const [newAddItemTable, setNewAddItemTable] = useState(null)
  const [showOpenTableModal, setShowOpenTableModal] = useState(false)
  const [showNewOpenTableModal, setShowNewOpenTableModal] = useState(false)

  const [showCloseTableModal, setShowCloseTableModal] = useState(false)
  const [showTransferTableModal, setShowTransferTableModal] = useState(false)

  // Add Item Modal States
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [menuSearchTerm, setMenuSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Open Table Modal States
  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [selectedTableToOpen, setSelectedTableToOpen] = useState(null)
  const [openingTable, setOpeningTable] = useState(false)
  
  // Close Table States
  const [selectedOrdersToClose, setSelectedOrdersToClose] = useState([])
  const [closingTable, setClosingTable] = useState(false)
  
  // Filters & View
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [fullScreenMode, setFullScreenMode] = useState(false)
  
  // Notification Settings
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [volume, setVolume] = useState(0.7)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const audioRef = useRef(null)
  const previousOrderCountRef = useRef(0)

  // ==================== STATUS CONFIG ====================
  
  const statusConfig = {
    pending: { label: 'Bekliyor', color: 'yellow', icon: Clock, gradient: 'from-yellow-400 to-orange-500' },
    confirmed: { label: 'Onaylandı', color: 'blue', icon: CheckCircle, gradient: 'from-blue-500 to-indigo-600' },
    preparing: { label: 'Hazırlanıyor', color: 'blue', icon: Activity, gradient: 'from-blue-500 to-indigo-600' },
    ready: { label: 'Hazır', color: 'green', icon: CheckCircle, gradient: 'from-green-500 to-emerald-600' },
    delivered: { label: 'Teslim Edildi', color: 'purple', icon: Package, gradient: 'from-purple-500 to-pink-600' },
    completed: { label: 'Tamamlandı', color: 'gray', icon: CheckCircle, gradient: 'from-gray-500 to-gray-600' },
    cancelled: { label: 'İptal', color: 'red', icon: Activity, gradient: 'from-red-500 to-red-600' }
  }

  // ==================== EFFECTS ====================
  
  // Load notification settings
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        setNotificationEnabled(true)
      }
    }
    
    try {
      const savedVolume = localStorage.getItem('orderNotificationVolume')
      const savedSound = localStorage.getItem('orderSoundEnabled')
      const savedNotif = localStorage.getItem('orderNotificationEnabled')
      const savedOrderCount = localStorage.getItem('lastOrderCount')
      
      if (savedOrderCount) previousOrderCountRef.current = parseInt(savedOrderCount)
      if (savedVolume) setVolume(parseFloat(savedVolume))
      if (savedSound !== null) setSoundEnabled(savedSound === 'true')
      if (savedNotif !== null && Notification.permission === 'granted') {
        setNotificationEnabled(savedNotif === 'true')
      }
    } catch (error) {
      console.error('LocalStorage error:', error)
    }
  }, [])

  // Save volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    try {
      localStorage.setItem('orderNotificationVolume', volume.toString())
    } catch (error) {
      console.error('LocalStorage save error:', error)
    }
  }, [volume])

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('orderSoundEnabled', soundEnabled.toString())
      localStorage.setItem('orderNotificationEnabled', notificationEnabled.toString())
    } catch (error) {
      console.error('LocalStorage save error:', error)
    }
  }, [soundEnabled, notificationEnabled])

  // Auto refresh
  useEffect(() => {
    loadOrders()
    if (autoRefresh) {
      const interval = setInterval(loadOrders, 5000)
      return () => clearInterval(interval)
    }
  }, [filterStatus, dateFilter, autoRefresh])

  // Detect new orders
  useEffect(() => {
    if (originalOrders.length > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      handleNewOrderNotification()
    }
    if (originalOrders.length >= 0) {
      previousOrderCountRef.current = originalOrders.length
      localStorage.setItem('lastOrderCount', originalOrders.length.toString())
    }
  }, [originalOrders.length])

  // ESC key for fullscreen exit
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && fullScreenMode) {
        setFullScreenMode(false)
        toast.success('Tam ekran modundan çıkıldı', { icon: '👋' })
      }
    }
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [fullScreenMode])

  // ==================== NOTIFICATION FUNCTIONS ====================
  
  const playNotificationSound = () => {
    if (!soundEnabled || !audioRef.current) return
    try {
      audioRef.current.load()
      audioRef.current.volume = volume
      audioRef.current.currentTime = 0
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Audio play prevented:', error)
          if (error.name === 'NotAllowedError') {
            toast.error('Ses çalınamadı. Sayfayla etkileşime geçin.', {
              duration: 2000,
              icon: '🔇'
            })
          }
        })
      }
    } catch (error) {
      console.error('Sound play error:', error)
    }
  }

  const triggerVibration = () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
    } catch (error) {
      console.error('Vibration error:', error)
    }
  }

  const showBrowserNotification = (title, body, options = {}) => {
    if (!notificationEnabled || notificationPermission !== 'granted') return
    try {
      const notification = new Notification(title, {
        body,
        tag: 'new-order',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        silent: false,
        ...options
      })
      notification.onclick = () => {
        window.focus()
        notification.close()
        if (orders.length > 0) {
          const newestTable = orders[0]
          setSelectedTable(newestTable)
          setShowModal(true)
        }
      }
      setTimeout(() => notification.close(), 10000)
    } catch (error) {
      console.error('Browser notification error:', error)
    }
  }

  const handleNewOrderNotification = () => {
    const newOrdersCount = originalOrders.length - previousOrderCountRef.current
    if (soundEnabled) playNotificationSound()
    triggerVibration()
    toast.success(
      `${newOrdersCount} yeni sipariş geldi! 🎉`,
      {
        duration: 5000,
        icon: '🔔',
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px'
        }
      }
    )
    if (notificationEnabled) {
      showBrowserNotification(
        '🍽️ Yeni Sipariş Geldi!',
        `${newOrdersCount} yeni sipariş aldınız. Toplam ${originalOrders.length} aktif sipariş.`
      )
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tarayıcınız bildirimleri desteklemiyor')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission === 'granted') {
        setNotificationEnabled(true)
        toast.success('Bildirimler açıldı! 🔔', { duration: 3000 })
        setTimeout(() => {
          showBrowserNotification('✅ Bildirimler Aktif!', 'Yeni siparişler için bildirim alacaksınız.')
        }, 500)
      } else if (permission === 'denied') {
        setNotificationEnabled(false)
        toast.error('Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.')
      }
    } catch (error) {
      console.error('Notification permission error:', error)
      toast.error('Bildirim izni alınamadı')
    }
  }

  // ==================== DATA LOADING ====================
  
  const loadOrders = async (silent = false) => {
    try {
      if (!silent && !loading) setRefreshing(true)
      
      const params = new URLSearchParams({
        groupByTable: 'true',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        today: dateFilter === 'today' ? 'true' : 'false',
        excludeCompleted: 'true',
        includeTableInfo: 'true',
        includeMenuImages: 'true'
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(apiPath(`/api/orders?${params}`))
      const data = await res.json()

      if (data.success) {
        setOrders(data.orders || [])
        setOriginalOrders(data.originalOrders || [])
        setStats(data.statistics)
      }
    } catch (error) {
      console.error('Load error:', error)
      if (!silent) toast.error('Yükleme hatası')
    } finally {
      setLoading(false)
      if (!silent) setRefreshing(false)
    }
  }

  const loadAvailableTables = async () => {
    try {
      setLoadingTables(true)
      console.log('🔍 [OPEN TABLE] Loading available tables...')
      
      const tablesRes = await fetch(apiPath('/api/admin/tables'))
      const tablesData = await tablesRes.json()
      
      if (!tablesRes.ok) {
        toast.error('Masalar yüklenemedi')
        return
      }
      
      const allTables = tablesData.tables || tablesData || []
      console.log(`📋 [OPEN TABLE] ${allTables.length} toplam masa`)
      
      const ordersRes = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
      const ordersData = await ordersRes.json()
      
      const activeOrders = ordersData.success ? 
        (ordersData.originalOrders || ordersData.orders || []) : []
      
      console.log(`🔍 [OPEN TABLE] ${activeOrders.length} aktif sipariş`)
      
      const emptyTables = allTables.filter(table => {
        if (table.status === 'maintenance') return false
        
        const tableNumberStr = table.number.toString().toUpperCase().trim()
        const hasActiveOrders = activeOrders.some(order => {
          const orderTableNum = (order.tableNumber || order.tableId)?.toString().toUpperCase().trim()
          return orderTableNum === tableNumberStr && 
                 !['completed', 'cancelled'].includes(order.status)
        })
        
        return !hasActiveOrders
      })
      
      console.log(`✅ [OPEN TABLE] ${emptyTables.length} boş masa bulundu`)
      setAvailableTables(emptyTables)
      
    } catch (error) {
      console.error('❌ [OPEN TABLE] Tables load error:', error)
      toast.error('Masa yükleme hatası')
    } finally {
      setLoadingTables(false)
    }
  }

  const loadMenuItems = async () => {
    try {
      setLoadingMenu(true)
      const menuRes = await fetch(apiPath('/api/admin/menu?available=true&limit=1000'))
      const menuData = await menuRes.json()
      const catRes = await fetch(apiPath('/api/admin/categories?isActive=true'))
      const catData = await catRes.json()
      
      if (menuData.success) {
        const items = menuData.items || []
        setMenuItems(items)
        console.log('📦 Menu items loaded:', items.length)
      } else {
        toast.error('Menü yüklenemedi')
      }
      
      if (catData.success) {
        const cats = catData.flatCategories || catData.categories || []
        setCategories(cats)
        console.log('📁 Categories loaded:', cats.length)
      }
    } catch (error) {
      console.error('Menu load error:', error)
      toast.error('Menü yükleme hatası')
    } finally {
      setLoadingMenu(false)
    }
  }

  // ==================== ORDER ACTIONS ====================
  
  const updateItemStatus = async (orderId, itemIndex, newStatus) => {
    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: orderId, 
          action: 'updateItemStatus', 
          itemIndex,
          itemStatus: newStatus 
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(`Ürün durumu güncellendi: ${statusConfig[newStatus]?.label}`, { icon: '✅' })
        loadOrders()
        
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          if (updatedTable) setSelectedTable(updatedTable)
        }
      }
    } catch (error) {
      toast.error('Güncelleme hatası')
    }
  }

  const updateItemQuantity = async (orderId, itemIdx, newQuantity) => {
  if (newQuantity < 0) return

  // ⚡ 1. ANINDA UI'ı güncelle (0ms)
  if (selectedTable) {
    const optimisticTable = { ...selectedTable }
    optimisticTable.orders = optimisticTable.orders.map(order => {
      if (order.id === orderId || order._id === orderId) {
        const updatedOrder = { ...order }
        updatedOrder.items = [...updatedOrder.items]
        
        if (newQuantity === 0) {
          updatedOrder.items.splice(itemIdx, 1)
        } else {
          updatedOrder.items[itemIdx] = {
            ...updatedOrder.items[itemIdx],
            quantity: newQuantity
          }
        }
        
        updatedOrder.totalAmount = updatedOrder.items.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        )
        
        return updatedOrder
      }
      return order
    })
    
    optimisticTable.totalAmount = optimisticTable.orders.reduce((sum, order) => 
      sum + order.totalAmount, 0
    )
    
    setSelectedTable(optimisticTable)  // ⚡ ANINDA
  }

  // ✅ 2. API arka planda
  try {
    if (newQuantity === 0) {
      await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'removeItem', itemIndex: itemIdx })
      })
      toast.success('Silindi', { icon: '🗑️', duration: 1000 })
    } else {
      await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, action: 'updateItemQuantity', itemIndex: itemIdx, newQuantity: parseInt(newQuantity) })
      })
      toast.success('Güncellendi', { icon: '✅', duration: 1000 })
    }

    // ✅ 3. Doğrulama (500ms sonra)
    setTimeout(async () => {
      await loadOrders(true)
      if (selectedTable) {
        const freshOrders = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
          .then(res => res.json())
          .then(data => data.orders || [])
        const updatedTable = freshOrders.find(t => t.tableNumber === selectedTable.tableNumber)
        if (updatedTable) setSelectedTable(updatedTable)
      }
    }, 500)
  } catch (error) {
    toast.error('Hata')
    await loadOrders(true)
  }
}

  const deleteOrder = async (orderId) => {
    if (!orderId) {
      toast.error('Sipariş ID bulunamadı!')
      return
    }

    if (!confirm('Bu siparişi silmek istediğinizden emin misiniz?')) return

    try {
      const res = await fetch(apiPath(`/api/orders?id=${orderId}`), { method: 'DELETE' })
      const result = await res.json()
      
      if (result.success) {
        toast.success('Sipariş silindi', { icon: '✅', duration: 2000 })
        await loadOrders(true)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          
          if (updatedTable && updatedTable.orders?.length > 0) {
            setSelectedTable(updatedTable)
          } else {
            setSelectedTable(null)
            setShowModal(false)
            toast.success('Masadaki tüm siparişler silindi', { icon: '🎉' })
          }
        }
      } else {
        toast.error(result.error || 'Silme hatası')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Silme hatası: ' + error.message)
    }
  }

  const updateItemPaidStatus = async (orderId, itemIdx, isPaid) => {
    try {
      const res = await fetch(apiPath('/api/orders'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          action: 'updateItemPaid',
          itemOrderId: orderId,
          itemIdx,
          isPaid
        })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(isPaid ? 'Ödeme alındı ✅' : 'Ödeme iptal edildi', { 
          icon: isPaid ? '💰' : '↩️',
          duration: 1500 
        })
        
        await loadOrders(true)
        await new Promise(resolve => setTimeout(resolve, 300))
        
        if (selectedTable) {
          const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
          if (updatedTable) {
            setSelectedTable(updatedTable)
          }
        }
      }
    } catch (error) {
      console.error('Update paid status error:', error)
      toast.error('Güncelleme hatası')
    }
  }

  // ==================== TABLE ACTIONS ====================
  
  const handleOpenTable = async () => {
    if (!selectedTableToOpen) {
      toast.error('Lütfen bir masa seçin')
      return
    }

    try {
      setOpeningTable(true)

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: selectedTableToOpen.number,
          tableId: selectedTableToOpen.number,
          items: [],
          totalAmount: 0,
          customerNotes: 'Masa açıldı - sipariş bekleniyor',
          status: 'pending'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${selectedTableToOpen.number} numaralı masa açıldı! ✅`)
        setShowOpenTableModal(false)
        setSelectedTableToOpen(null)
        await loadOrders()
      } else {
        toast.error(result.error || 'Masa açılamadı')
      }
    } catch (error) {
      console.error('Open table error:', error)
      toast.error('Masa açma hatası: ' + error.message)
    } finally {
      setOpeningTable(false)
    }
  }

  const handleAddItemToTable = async () => {
    if (!selectedProduct) {
      toast.error('Lütfen bir ürün seçin')
      return
    }
    
    if (!selectedTable) {
      toast.error('Masa seçili değil')
      return
    }

    try {
      setAddingItem(true)

      const productId = selectedProduct._id || selectedProduct.id || selectedProduct.menuItemId
      
      if (!productId) {
        console.error('❌ Product has no valid ID:', selectedProduct)
        toast.error('Ürün ID\'si bulunamadı. Lütfen menüyü yenileyin.')
        return
      }

      const newItem = {
        menuItemId: productId,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: itemQuantity,
        notes: itemNotes,
        image: selectedProduct.image
      }

      const activeOrder = selectedTable.orders?.find(o => 
        !['completed', 'cancelled'].includes(o.status)
      )

      let response
      
      if (activeOrder) {
        const payload = {
          id: activeOrder._id,
          action: 'addItem',
          item: newItem
        }
        
        response = await fetch(apiPath('/api/orders'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        const payload = {
          tableNumber: selectedTable.tableNumber,
          tableId: selectedTable.tableId,
          items: [newItem],
          customerNotes: 'Manuel eklenen sipariş'
        }
        
        response = await fetch(apiPath('/api/orders'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()

      if (result.success) {
        toast.success(
          `${selectedProduct.name} x${itemQuantity} eklendi!`,
          {
            icon: '✅',
            duration: 2000,
            style: {
              background: '#10B981',
              color: '#fff',
            }
          }
        )
        
        setSelectedProduct(null)
        setItemQuantity(1)
        setItemNotes('')
        
        loadOrders(true)
        
        setTimeout(() => {
          setOrders(currentOrders => {
            const updatedTable = currentOrders.find(t => t.tableNumber === selectedTable.tableNumber)
            if (updatedTable) {
              setSelectedTable(updatedTable)
            }
            return currentOrders
          })
        }, 300)
      } else {
        toast.error(result.error || 'Ürün eklenemedi')
      }
    } catch (error) {
      console.error('Add item error:', error)
      toast.error('Ürün ekleme hatası: ' + error.message)
    } finally {
      setAddingItem(false)
    }
  }
  // handleAddItemToTable fonksiyonunun ALTINA ekle
const handleAddItemComplete = async () => {
  await loadOrders(true)
  await new Promise(resolve => setTimeout(resolve, 200))
  
  if (selectedTable) {
    const freshOrders = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
      .then(res => res.json())
      .then(data => data.orders || [])
    const updatedTable = freshOrders.find(t => t.tableNumber === selectedTable.tableNumber)
    if (updatedTable) setSelectedTable(updatedTable)
  }
}
const handleTableOpened = async (table) => {
  console.log('✅ [ORDERS] Masa açıldı:', table.number)
  
  await loadOrders(true)
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const freshOrders = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
    .then(res => res.json())
    .then(data => data.orders || [])
  
  const openedTable = freshOrders.find(t => 
    t.tableNumber?.toString().toUpperCase().trim() === table.number?.toString().toUpperCase().trim()
  )
  
  if (openedTable) {
    // ✅ Bu satırları değiştir:
    setNewAddItemTable(openedTable)
    setShowNewAddItemModal(true)
  } else {
    toast.error('Masa bilgileri yüklenemedi')
  }
}

  const handleCloseTableWithSelection = async () => {
    if (!selectedTable) return
    
    if (selectedOrdersToClose.length === 0) {
      toast.error('Lütfen en az bir sipariş seçin')
      return
    }

    try {
      setClosingTable(true)

      const updatePromises = selectedOrdersToClose.map(orderId =>
        fetch(apiPath('/api/orders'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            action: 'updateStatus',
            status: 'completed'
          })
        })
      )

      await Promise.all(updatePromises)

      const remainingOrders = selectedTable.orders.filter(
        o => !selectedOrdersToClose.includes(o._id || o.id) &&
             !['completed', 'cancelled'].includes(o.status)
      )

      if (remainingOrders.length === 0) {
        await fetch(apiPath('/api/orders'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'closeTable',
            tableNumber: selectedTable.tableNumber.toString()
          })
        })
        
        toast.success(`✅ Masa ${selectedTable.tableNumber} kapatıldı!`, {
          icon: '🎉',
          duration: 3000
        })
        setShowModal(false)
      } else {
        toast.success(`✅ ${selectedOrdersToClose.length} sipariş tamamlandı`, {
          icon: '💰',
          duration: 2000
        })
      }

      setShowCloseTableModal(false)
      setSelectedOrdersToClose([])
      await loadOrders()

    } catch (error) {
      console.error('Close table error:', error)
      toast.error('Masa kapatma hatası')
    } finally {
      setClosingTable(false)
    }
  }

  const handleProcessPayment = async () => {
    if (selectedOrdersToClose.length === 0) {
      toast.error('Lütfen ödeme yapılacak ürünleri seçin')
      return
    }
    
    try {
      setClosingTable(true)
      
      for (const sel of selectedOrdersToClose) {
        await updateItemPaidStatus(sel.orderId, sel.itemIdx, true)
      }
      
      toast.success(`✅ ${selectedOrdersToClose.length} ürün ödendi!`, {
        icon: '💰',
        duration: 3000
      })
      
      setSelectedOrdersToClose([])
      await loadOrders()
      
      setTimeout(() => {
        const updatedTable = orders.find(t => t.tableNumber === selectedTable.tableNumber)
        if (updatedTable) {
          setSelectedTable(updatedTable)
        }
      }, 300)
      
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Ödeme hatası')
    } finally {
      setClosingTable(false)
    }
  }

  // ==================== HELPER FUNCTIONS ====================
  
  const exportData = () => {
    const dataStr = JSON.stringify(originalOrders, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    toast.success('Veriler indirildi')
  }

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000)
    if (minutes < 1) return 'Az önce'
    if (minutes < 60) return `${minutes} dk önce`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} saat önce`
    return `${Math.floor(hours / 24)} gün önce`
  }

  const filteredOrders = orders.filter(table => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        table.tableNumber?.toString().includes(search) ||
        table.tableName?.toLowerCase().includes(search) ||
        table.orders?.some(o => 
          o.orderNumber?.toLowerCase().includes(search) ||
          o.items?.some(i => i.name?.toLowerCase().includes(search))
        )
      )
    }
    return true
  })

  // ==================== RENDER ====================
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Siparişler Yükleniyor</h3>
          <p className="text-gray-600">Lütfen bekleyin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        preload="auto"
        src="/notification.mp3?v=3"
      />

      {/* Header */}
      <div className={`sticky top-0 z-30 ${
        fullScreenMode 
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200'
      } shadow-sm`}>
        <div className="p-4 sm:p-6">
          {fullScreenMode ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
                  <p className="text-sm opacity-90">
                    {filteredOrders.length} masa • {originalOrders.length} aktif sipariş
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">5s otomatik yenile</span>
                </div>
                
                <button
                  onClick={() => setFullScreenMode(false)}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
                  title="Çıkış (ESC)"
                >
                  <Minimize className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <ShoppingCart className="w-7 h-7 text-amber-600" />
                    Sipariş Yönetimi
                    {refreshing && (
                      <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    )}
                  </h1>
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {filteredOrders.length} masa • {originalOrders.length} sipariş
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Open Table Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
onClick={() => setShowNewOpenTableModal(true)}

                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Masa Aç</span>
                  </motion.button>

                  {/* Fullscreen Toggle */}
                  <button
                    onClick={() => {
                      setFullScreenMode(!fullScreenMode)
                      toast.success(fullScreenMode ? 'Normal moda dönüldü' : 'Tam ekran modu aktif', {
                        icon: fullScreenMode ? '🪟' : '🖥️'
                      })
                    }}
                    className={`p-2.5 rounded-xl transition-all ${
                      fullScreenMode
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } flex items-center gap-2`}
                    title={fullScreenMode ? "Normal Mod (ESC)" : "Tam Ekran Modu"}
                  >
                    {fullScreenMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    <span className="hidden sm:inline text-sm font-medium">
                      {fullScreenMode ? 'Normal Mod' : 'Tam Ekran'}
                    </span>
                  </button>

                  {/* Notification Button */}
                  <button
                    onClick={() => setShowNotificationSettings(true)}
                    className={`p-2.5 rounded-xl transition-all ${
                      notificationEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Bildirim Ayarları"
                  >
                    {notificationEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                  </button>

                  {/* View Mode */}
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  >
                    {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
                  </button>

                  {/* Auto Refresh */}
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2.5 rounded-xl transition-all ${
                      autoRefresh ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                    }`}
                    title="Otomatik Yenileme (5 saniye)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Filter */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-xl transition-all ${
                      showFilters ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>

                  {/* Stats */}
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </button>

                  {/* Export */}
                  <button
                    onClick={exportData}
                    className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {/* Refresh */}
                  <button
                    onClick={loadOrders}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Yenile</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar - Removed */}

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Masa, ürün ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Tüm Tarihler</option>
                        <option value="today">Bugün</option>
                      </select>

                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setFilterStatus('all')
                          setDateFilter('today')
                        }}
                        className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors font-medium"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Mode Info */}
      {fullScreenMode && (
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-800">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Siparişler 5 saniyede bir otomatik yenileniyor</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <span>ESC tuşu ile çıkış</span>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid/List */}
      <div className={`${fullScreenMode ? 'p-6' : 'p-4 sm:p-6'}`}>
        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white rounded-2xl shadow-sm"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Aktif Sipariş Yok</h3>
            <p className="text-gray-600 mb-6">
              {filterStatus !== 'all' || searchTerm 
                ? 'Bu filtrelerle eşleşen sipariş yok' 
                : 'Tüm masalar boş - yeni siparişler burada görünecek'}
            </p>
          </motion.div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }>
            {filteredOrders.map((table, idx) => {
  const totalItems = table.orders?.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0) || 0
  
  // 🆕 ÖDEME İSTATİSTİKLERİNİ HESAPLA
  const calculatePaymentStats = () => {
    let totalPaid = 0
    let totalUnpaid = 0
    let paidItemsCount = 0
    let totalItemsCount = 0

    table.orders?.forEach(order => {
      order.items?.forEach(item => {
        const itemTotal = item.price * item.quantity
        const paidQty = item.paidQuantity || 0
        const isPaid = item.paid || paidQty === item.quantity

        totalItemsCount += item.quantity

        if (isPaid) {
          totalPaid += itemTotal
          paidItemsCount += item.quantity
        } else if (paidQty > 0) {
          totalPaid += (item.price * paidQty)
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
    <motion.div
      key={table.tableNumber}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      onClick={() => {
        setSelectedTable(table)
        setShowModal(true)
      }}
      className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 hover:border-amber-300 transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer"
    >
      <div className={`p-4 bg-gradient-to-r ${statusConfig[table.status]?.gradient || 'from-gray-400 to-gray-600'}`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{table.tableName || `Masa ${table.tableNumber}`}</div>
              {table.tableLocation && (
                <div className="text-sm opacity-90">{table.tableLocation}</div>
              )}
              <div className="text-sm opacity-90 flex items-center gap-2 mt-1">
                <span>{table.orders?.length || 0} sipariş</span>
                <span>•</span>
                <span>{totalItems} ürün</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₺{table.totalAmount.toFixed(2)}</div>
            <div className="text-xs opacity-90">{getTimeAgo(table.createdAt)}</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 🆕 ÖDEME DURUMU BAR */}
        {paymentStats.totalPaid > 0 && (
          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-900">
                  Ödeme Durumu
                </span>
              </div>
              <span className="text-sm font-bold text-green-600">
                %{paymentStats.paidPercentage.toFixed(0)} ödendi
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paymentStats.paidPercentage}%` }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-700">
                ₺{paymentStats.totalPaid.toFixed(2)} ödendi
              </span>
              <span className="text-red-600">
                ₺{paymentStats.totalUnpaid.toFixed(2)} kalan
              </span>
            </div>
          </div>
        )}

        {table.customerNotes && (
          <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-900 line-clamp-2">{table.customerNotes}</p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {table.orders?.slice(0, 2).map((order) => (
            <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">#{order.orderNumber?.slice(-6) || order.id.slice(-6)}</span>
                <span className="text-sm font-bold text-amber-600">₺{order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-700">
                {order.items?.map((item, idx) => {
                  const isPaid = item.paid || (item.paidQuantity === item.quantity)
                  const optionsText = formatSelectedOptions(item.selectedOptions) // 🆕
                  
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="font-medium">{item.quantity}x</span>
                      <span className={`truncate ${isPaid ? 'text-green-600' : ''}`}>
                        {item.name}{optionsText}
                      </span>
                      {isPaid && <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {table.orders?.length > 2 && (
            <div className="text-xs text-center text-gray-500 font-medium">
              +{table.orders.length - 2} sipariş daha
            </div>
          )}
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t">
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card click
            setSelectedTable(table)
            setSelectedOrdersToClose([])
            setShowCloseTableModal(true)
          }}
          className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Kapat
        </button>
      </div>
    </motion.div>
  )
})}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}
      
      <OrderDetailModal
  showModal={showModal}
  selectedTable={selectedTable}
  statusConfig={statusConfig}
  getTimeAgo={getTimeAgo}
  updateItemStatus={updateItemStatus}
  updateItemQuantity={updateItemQuantity}
  deleteOrder={deleteOrder}
  onClose={() => setShowModal(false)}
  onAddItem={() => {
    setShowAddItemModal(true)
    setNewAddItemTable(selectedTable)
    setShowNewAddItemModal(true)
    setMenuSearchTerm('')
    setSelectedCategory('all')
    setSelectedProduct(null)
    setItemQuantity(1)
    setItemNotes('')
    loadMenuItems()
  }}
  
  onCloseTable={() => {
    setSelectedOrdersToClose([])
    setShowCloseTableModal(true)
  }}
  
  // 🆕 MASA TAŞI CALLBACK
  onTransferTable={() => setShowTransferTableModal(true)}
/>

    <YazarKasaModal
  show={showCloseTableModal}
  selectedTable={selectedTable}
  onClose={() => {
    setShowCloseTableModal(false)
    setSelectedOrdersToClose([])
  }}
  onComplete={async (paidAmount, paymentMethod) => {
    console.log('💰 [ORDERS] Ödeme/İşlem:', { paidAmount, paymentMethod })
    
    // 1. Silent refresh
    await loadOrders(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 2. 🆕 MASA KAPANDIYSA ANA MODAL'I DA KAPAT
    if (paymentMethod === 'completed') {
      console.log('🎉 [ORDERS] Masa kapatıldı, ana modal kapatılıyor')
      setShowModal(false)
      setSelectedTable(null)
      return
    }
    
    // 3. Normal ödeme - table güncelle
    setOrders(currentOrders => {
      const updatedTable = currentOrders.find(t => 
        t.tableNumber === selectedTable.tableNumber
      )
      if (updatedTable) {
        setSelectedTable({ ...updatedTable })
      }
      return currentOrders
    })
  }}
/>

      <AddItemModal
        show={showNewAddItemModal}
        selectedTable={newAddItemTable}
        menuItems={menuItems}
        categories={categories}
        loadingMenu={loadingMenu}
        selectedProduct={selectedProduct}
        itemQuantity={itemQuantity}
        itemNotes={itemNotes}
        addingItem={addingItem}
        menuSearchTerm={menuSearchTerm}
        selectedCategory={selectedCategory}
  onClose={() => {
    setShowNewAddItemModal(false)
    setNewAddItemTable(null)
  }}
    onComplete={handleAddItemComplete}

        onSelectProduct={setSelectedProduct}
        onQuantityChange={setItemQuantity}
        onNotesChange={setItemNotes}
        onSearchChange={setMenuSearchTerm}
        onCategoryChange={setSelectedCategory}
        onAddItem={handleAddItemToTable}
      />

      <NotificationSettingsModal
        show={showNotificationSettings}
        soundEnabled={soundEnabled}
        notificationEnabled={notificationEnabled}
        notificationPermission={notificationPermission}
        volume={volume}
        onClose={() => setShowNotificationSettings(false)}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        onNotificationToggle={() => {
          if (notificationPermission === 'default') {
            requestNotificationPermission()
          } else if (notificationPermission === 'granted') {
            setNotificationEnabled(!notificationEnabled)
          }
        }}
        onVolumeChange={setVolume}
        onRequestPermission={requestNotificationPermission}
        onTestSound={() => {
          playNotificationSound()
          triggerVibration()
          toast.success('Test sesi çalındı!', { icon: '✅' })
        }}
        onTestNotifications={() => {
          playNotificationSound()
          triggerVibration()
          showBrowserNotification('🧪 Test Bildirimi', 'Bildirimler düzgün çalışıyor! ✅')
          toast.success('Test bildirimi gönderildi!', { icon: '✅' })
        }}
      />

<OpenTableModal
  show={showNewOpenTableModal}
  onClose={() => setShowNewOpenTableModal(false)}
  onTableOpened={handleTableOpened}
/>

      <StatsModal
        show={showStatsModal}
        stats={stats}
        statusConfig={statusConfig}
        onClose={() => setShowStatsModal(false)}
      />
      <TransferTableModal
  show={showTransferTableModal}
  sourceTable={selectedTable}
  onClose={() => setShowTransferTableModal(false)}
  onTransferComplete={async () => {
    // Listeyi yenile
    await loadOrders()
    
    // Ana modal'ı kapat
    setShowModal(false)
    setSelectedTable(null)
    
    toast.success('Masa taşıma işlemi tamamlandı!', {
      icon: '🔄',
      duration: 3000
    })
  }}
/>
    </div>
  )
}