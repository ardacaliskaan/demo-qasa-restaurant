'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, QrCode, Users, Clock, CheckCircle, XCircle, MapPin, Eye, Printer, Search, Filter, Grid, List, ShoppingCart, Coffee, MessageSquare, RefreshCw, X as XIcon } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'
import Image from 'next/image'

export default function TablesPage() {
  const [tables, setTables] = useState([])
  const [filteredTables, setFilteredTables] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  
  // 🆕 SIPARIŞ OLUŞTURMA MODALI
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  const [creatingOrder, setCreatingOrder] = useState(false)
  const [menuSearchTerm, setMenuSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [orderItems, setOrderItems] = useState([]) // Sepet
  
  const [formData, setFormData] = useState({
    number: '',
    capacity: 2,
    location: 'main',
    status: 'empty',
    qrCode: '',
    notes: ''
  })

  const statusOptions = [
    { value: 'empty', label: 'Boş', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, bgColor: 'bg-green-500' },
    { value: 'occupied', label: 'Dolu', color: 'bg-red-100 text-red-800 border-red-200', icon: Users, bgColor: 'bg-red-500' },
    { value: 'reserved', label: 'Rezerve', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, bgColor: 'bg-yellow-500' },
    { value: 'maintenance', label: 'Bakımda', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, bgColor: 'bg-gray-500' }
  ]

  const locationOptions = [
    { value: 'main', label: 'Ana Salon', icon: '' },
    { value: 'terrace', label: 'Teras', icon: '' },
    { value: 'garden', label: 'Bahçe', icon: '' },
    { value: 'private', label: 'Özel Bölüm', icon: '' },
    { value: 'bar', label: 'Bar', icon: '' }
  ]

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    filterTables()
  }, [tables, searchTerm, statusFilter, locationFilter])

  // 🆕 DEBUG: Log selected product details
  useEffect(() => {
    if (selectedProduct) {
      console.log('🎯 [PRODUCT SELECTED]:', {
        name: selectedProduct.name,
        _id: selectedProduct._id,
        id: selectedProduct.id,
        hasValidId: !!(selectedProduct._id || selectedProduct.id),
        fullProduct: selectedProduct
      })
    }
  }, [selectedProduct])

  // 🆕 MASA DURUMUNU AKTİF SİPARİŞLERE GÖRE GÜNCELLE
  const fetchTables = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 [TABLES] Masalar yükleniyor...')
      
      // 1️⃣ Masaları yükle
      const tablesRes = await fetch(apiPath('/api/admin/tables'))
      const tablesData = await tablesRes.json()
      
      if (!tablesRes.ok) {
        toast.error('Masalar yüklenemedi')
        return
      }
      
      const allTables = tablesData.tables || tablesData || []
      console.log(`📋 [TABLES] ${allTables.length} masa yüklendi`, allTables.map(t => ({ 
        number: t.number, 
        status: t.status 
      })))
      
      // 2️⃣ Aktif siparişleri yükle (groupByTable=true ile originalOrders'ı al)
      const ordersRes = await fetch(apiPath('/api/orders?groupByTable=true&excludeCompleted=true'))
      const ordersData = await ordersRes.json()
      
      console.log('📦 [TABLES] Orders API yanıtı:', {
        success: ordersData.success,
        hasOriginalOrders: !!ordersData.originalOrders,
        hasOrders: !!ordersData.orders,
        originalOrdersCount: ordersData.originalOrders?.length,
        ordersCount: ordersData.orders?.length
      })
      
      // ✅ FIX: originalOrders yoksa orders'ı kullan (fallback)
      const activeOrders = ordersData.success ? 
        (ordersData.originalOrders || ordersData.orders || []) : []
      
      console.log(`🔍 [TABLES] ${activeOrders.length} aktif sipariş bulundu`)
      
      if (activeOrders.length > 0) {
        console.log('📌 [TABLES] Aktif siparişler:', activeOrders.map(o => ({
          id: o._id,
          tableNumber: o.tableNumber,
          tableId: o.tableId,
          status: o.status,
          items: o.items?.length
        })))
      }
      
      // 3️⃣ Her masa için aktif sipariş var mı kontrol et
      const tablesWithStatus = allTables.map(table => {
        // ✅ FIX: Case-insensitive karşılaştırma (L12 ve l12 için)
        const tableNumberStr = table.number.toString().toUpperCase().trim()
        
        const matchingOrders = activeOrders.filter(order => {
          const orderTableNum = (order.tableNumber || order.tableId)?.toString().toUpperCase().trim()
          const matches = orderTableNum === tableNumberStr && 
            !['completed', 'cancelled'].includes(order.status)
          
          if (matches) {
            console.log(`✅ [TABLES] Masa ${tableNumberStr} için eşleşen sipariş:`, {
              orderId: order._id,
              orderTableNumber: order.tableNumber,
              orderTableId: order.tableId,
              status: order.status
            })
          }
          
          return matches
        })
        
        const hasActiveOrders = matchingOrders.length > 0
        
        console.log(`🔎 [TABLES] Masa ${tableNumberStr}:`, {
          currentStatus: table.status,
          hasActiveOrders,
          matchingOrdersCount: matchingOrders.length,
          shouldUpdate: (hasActiveOrders && table.status === 'empty') || 
                       (!hasActiveOrders && table.status === 'occupied')
        })
        
        // 🔥 Eğer aktif sipariş varsa ama masa empty ise, occupied yap
        if (hasActiveOrders && table.status === 'empty') {
          console.log(`📌 [TABLES] Masa ${tableNumberStr} -> OCCUPIED (${matchingOrders.length} aktif sipariş)`)
          return { ...table, status: 'occupied', hasActiveOrders: true }
        }
        
        // 🔥 Eğer aktif sipariş yoksa ama masa occupied ise, empty yap
        if (!hasActiveOrders && table.status === 'occupied') {
          console.log(`📌 [TABLES] Masa ${tableNumberStr} -> EMPTY (sipariş yok)`)
          return { ...table, status: 'empty', hasActiveOrders: false }
        }
        
        return { ...table, hasActiveOrders }
      })
      
      setTables(tablesWithStatus)
      
      console.log(`✅ [TABLES] ${tablesWithStatus.length} masa güncellendi`)
      console.log('📊 [TABLES] Masa durumları:', tablesWithStatus.map(t => ({
        number: t.number,
        status: t.status,
        hasActiveOrders: t.hasActiveOrders
      })))
      
    } catch (error) {
      console.error('❌ [TABLES] Masalar yüklenirken hata:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const filterTables = () => {
    let filtered = tables

    if (searchTerm) {
      filtered = filtered.filter(table => 
        table.number.toString().includes(searchTerm) ||
        table.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getLocationLabel(table.location).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(table => table.status === statusFilter)
    }

    if (locationFilter !== 'all') {
      if (locationFilter === 'custom') {
        filtered = filtered.filter(table => !locationOptions.find(opt => opt.value === table.location))
      } else {
        filtered = filtered.filter(table => table.location === locationFilter)
      }
    }

    setFilteredTables(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = apiPath('/api/admin/tables')
      const method = editingTable ? 'PUT' : 'POST'
      
      const normalizedNumber = formData.number.toString().toUpperCase().trim()
      
      if (!normalizedNumber) {
        toast.error('Masa numarası boş olamaz')
        setLoading(false)
        return
      }

      const submitData = {
        ...formData,
        number: normalizedNumber
      }
      
      const body = editingTable ? 
        JSON.stringify({ ...submitData, _id: editingTable._id }) :
        JSON.stringify(submitData)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      })

      const data = await res.json()

      if (res.ok) {
        await fetchTables()
        resetForm()
        setShowModal(false)
        toast.success(editingTable ? 'Masa güncellendi' : 'Masa eklendi')
      } else {
        toast.error(data.error || 'İşlem başarısız')
      }
    } catch (error) {
      console.error('Masa kaydedilirken hata:', error)
      toast.error('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (table) => {
    setEditingTable(table)
    setFormData({
      number: table.number.toString().toUpperCase().trim(),
      capacity: table.capacity,
      location: table.location,
      status: table.status,
      qrCode: table.qrCode || '',
      notes: table.notes || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id, tableNumber) => {
    if (!confirm(`Masa ${tableNumber} silinecek. Emin misiniz?`)) return

    try {
      const res = await fetch(apiPath('/api/admin/tables'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const data = await res.json()

      if (res.ok) {
        await fetchTables()
        toast.success('Masa silindi')
      } else {
        toast.error(data.error || 'Silme işlemi başarısız')
      }
    } catch (error) {
      console.error('Masa silinirken hata:', error)
      toast.error('Bağlantı hatası')
    }
  }

  const resetForm = () => {
    setFormData({
      number: '',
      capacity: 2,
      location: 'main',
      status: 'empty',
      qrCode: '',
      notes: ''
    })
    setEditingTable(null)
  }

  const generateQRCode = async (table) => {
    try {
      const baseUrl = window.location.origin
      const menuUrl = `${baseUrl}/menu/${table.number}`
      
      const res = await fetch(apiPath('/api/admin/tables/qr'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: table.number, menuUrl })
      })

      if (res.ok) {
        const { qrCode } = await res.json()
        
        await fetch(apiPath('/api/admin/tables'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...table, 
            qrCode,
            _id: table._id 
          })
        })
        
        await fetchTables()
        toast.success('QR kod oluşturuldu')
      }
    } catch (error) {
      console.error('QR kod oluşturulurken hata:', error)
      toast.error('QR kod oluşturulamadı')
    }
  }

  const printQRCode = (table) => {
    if (!table.qrCode) {
      toast.error('QR kod bulunamadı')
      return
    }

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Masa ${table.number} QR Kod</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 0; }
            body { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              padding: 20px;
            }
            .qr-container { 
              text-align: center; 
              padding: 40px 35px; 
              border: 3px solid #2c3e50;
              border-radius: 30px;
              background: white;
              max-width: 420px;
              width: 100%;
            }
            .restaurant-name { 
              font-size: 32px;
              color: #2c3e50;
              margin-bottom: 20px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .table-number {
              font-size: 72px;
              font-weight: 900;
              color: #2c3e50;
              margin-bottom: 25px;
              line-height: 1;
            }
            .qr-wrapper {
              padding: 20px;
              background: #f8f9fa;
              border-radius: 20px;
              margin-bottom: 25px;
            }
            img { 
              max-width: 240px;
              width: 100%;
              height: auto;
              border-radius: 12px;
            }
            .instructions { 
              font-size: 18px;
              color: #2c3e50;
              font-weight: 500;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .divider {
              width: 60px;
              height: 2px;
              background: #2c3e50;
              margin: 20px auto;
              border-radius: 2px;
            }
            .capacity {
              display: inline-block;
              padding: 8px 20px;
              background: #ecf0f1;
              border-radius: 20px;
              color: #2c3e50;
              font-weight: 600;
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              .qr-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="restaurant-name">Ayışığı Pasta Cafe</div>
            <h1 class="table-number">${table.number}</h1>
            <div class="qr-wrapper">
              <img src="${table.qrCode}" alt="QR Kod" />
            </div>
            <div class="instructions">
              Menüyü görmek için QR kodu okutun
            </div>
            <div class="divider"></div>
            <div class="capacity">
              ${table.capacity} Kişilik • ${getLocationLabel(table.location)}
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // 🆕 MENÜ İTEMLERİNİ YÜKLE
  const loadMenuItems = async () => {
    try {
      setLoadingMenu(true)
      
      console.log('📦 [LOAD MENU] Fetching menu items...')
      
      const menuRes = await fetch(apiPath('/api/admin/menu?available=true&limit=1000'))
      const menuData = await menuRes.json()
      
      const catRes = await fetch(apiPath('/api/admin/categories?isActive=true'))
      const catData = await catRes.json()
      
      if (menuData.success) {
        const items = menuData.items || []
        setMenuItems(items)
        
        console.log('✅ [LOAD MENU] Loaded items:', items.length)
        console.log('🔍 [LOAD MENU] Sample item:', items[0])
        console.log('🆔 [LOAD MENU] Sample ID check:', {
          _id: items[0]?._id,
          id: items[0]?.id,
          hasValidId: !!(items[0]?._id || items[0]?.id)
        })
      } else {
        toast.error('Menü yüklenemedi')
      }
      
      if (catData.success) {
        setCategories(catData.flatCategories || catData.categories || [])
        console.log('✅ [LOAD MENU] Loaded categories:', catData.flatCategories?.length || catData.categories?.length || 0)
      }
    } catch (error) {
      console.error('❌ [LOAD MENU] Error:', error)
      toast.error('Menü yükleme hatası')
    } finally {
      setLoadingMenu(false)
    }
  }

  // 🆕 SEPETE ÜRÜN EKLE
  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Lütfen bir ürün seçin')
      return
    }

    // ✅ ID Extraction - _id veya id alanını al
    const productId = selectedProduct._id || selectedProduct.id
    
    if (!productId) {
      console.error('❌ [ADD TO CART] Product has no ID:', selectedProduct)
      toast.error('Ürün ID bulunamadı. Lütfen sayfayı yenileyin.')
      return
    }

    // ✅ CLEAN ITEM - Sadece API'nin kabul ettiği alanlar
    const newItem = {
      menuItemId: productId.toString(), // ✅ String'e çevir
      name: selectedProduct.name,
      price: parseFloat(selectedProduct.price),
      quantity: parseInt(itemQuantity),
      notes: itemNotes || '',
      customizations: {
        removed: [],
        extras: []
      }
    }

    console.log('🛒 [ADD TO CART] Product ID:', productId)
    console.log('🛒 [ADD TO CART] Item:', newItem)

    setOrderItems(prev => [...prev, newItem])
    toast.success(`${selectedProduct.name} sepete eklendi!`, { icon: '✅' })
    
    // Reset form
    setSelectedProduct(null)
    setItemQuantity(1)
    setItemNotes('')
  }

  // 🆕 SEPETTEN ÜRÜN ÇIKAR
  const removeFromCart = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index))
    toast.success('Ürün sepetten çıkarıldı')
  }

  // 🆕 SİPARİŞ OLUŞTUR
  const handleCreateOrder = async () => {
    if (!selectedTableForOrder) {
      toast.error('Masa seçili değil')
      return
    }

    if (orderItems.length === 0) {
      toast.error('Sepette ürün yok')
      return
    }

    try {
      setCreatingOrder(true)

      const totalAmount = orderItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      )

      // ✅ CLEAN PAYLOAD - Sadece API'nin beklediği alanları gönder
      const payload = {
        tableNumber: selectedTableForOrder.number.toString(),
        tableId: selectedTableForOrder.number.toString(),
        items: orderItems.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
          notes: item.notes || '',
          customizations: item.customizations || { removed: [], extras: [] }
        })),
        totalAmount: parseFloat(totalAmount),
        customerNotes: 'Manuel sipariş - Garson tarafından oluşturuldu',
        status: 'pending'
      }

      console.log('🛒 [CREATE ORDER] Payload:', JSON.stringify(payload, null, 2))
      console.log('📊 [CREATE ORDER] Items count:', payload.items.length)
      console.log('💰 [CREATE ORDER] Total amount:', payload.totalAmount)

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      console.log('📦 [CREATE ORDER] Response:', result)

      if (result.success) {
        toast.success(`✅ Sipariş oluşturuldu! Masa ${selectedTableForOrder.number} açıldı.`, {
          icon: '🎉',
          duration: 3000
        })
        
        // Reset
        setShowOrderModal(false)
        setSelectedTableForOrder(null)
        setOrderItems([])
        setSelectedProduct(null)
        setItemQuantity(1)
        setItemNotes('')
        setMenuSearchTerm('')
        setSelectedCategory('all')
        
        // Masaları yenile
        await fetchTables()
      } else {
        console.error('❌ [CREATE ORDER] Error:', result.error || result.errors)
        toast.error(result.error || result.errors?.join(', ') || 'Sipariş oluşturulamadı')
      }
    } catch (error) {
      console.error('❌ [CREATE ORDER] Exception:', error)
      toast.error('Sipariş oluşturma hatası: ' + error.message)
    } finally {
      setCreatingOrder(false)
    }
  }

  // 🆕 SİPARİŞ OLUŞTUR BUTONUNA TIKLANDIĞINDA
  const openOrderModal = (table) => {
    if (table.hasActiveOrders) {
      toast.error('Bu masanın zaten aktif siparişi var!')
      return
    }
    
    setSelectedTableForOrder(table)
    setShowOrderModal(true)
    setOrderItems([])
    setSelectedProduct(null)
    setMenuSearchTerm('')
    setSelectedCategory('all')
    loadMenuItems()
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0]
  }

  const getLocationLabel = (location) => {
    const locationOption = locationOptions.find(option => option.value === location)
    return locationOption ? locationOption.label : location
  }

  const getLocationIcon = (location) => {
    const locationOption = locationOptions.find(option => option.value === location)
    return locationOption ? locationOption.icon : '📍'
  }

  const totalTables = tables.length
  const occupiedTables = tables.filter(t => t.status === 'occupied').length
  const availableTables = tables.filter(t => t.status === 'empty').length
  const reservedTables = tables.filter(t => t.status === 'reserved').length

  const customLocations = [...new Set(tables
    .map(t => t.location)
    .filter(loc => !locationOptions.find(opt => opt.value === loc))
  )]

  if (loading && tables.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Masalar yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Masa Yönetimi</h1>
          <p className="text-gray-600">Restoran masalarınızı yönetin ve QR kodlarını oluşturun</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchTables}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"
            title="Yenile"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Yeni Masa Ekle
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Masa</p>
              <p className="text-3xl font-bold text-gray-900">{totalTables}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Müsait</p>
              <p className="text-3xl font-bold text-green-600">{availableTables}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dolu</p>
              <p className="text-3xl font-bold text-red-600">{occupiedTables}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rezerve</p>
              <p className="text-3xl font-bold text-yellow-600">{reservedTables}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Masa numarası, konum veya notlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">Tüm Durumlar</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">Tüm Konumlar</option>
              {locationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
              {customLocations.length > 0 && (
                <option value="custom">📍 Özel Konumlar</option>
              )}
            </select>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tables Display */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredTables.length === 0 ? (
          <div className="p-12 text-center">
            {tables.length === 0 ? (
              <>
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Henüz masa eklenmemiş</h3>
                <p className="text-gray-600 mb-6">İlk masanızı ekleyerek başlayın</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  İlk Masayı Ekle
                </button>
              </>
            ) : (
              <>
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Sonuç bulunamadı</h3>
                <p className="text-gray-600">Arama kriterlerinizi değiştirip tekrar deneyin</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTables.map((table, index) => {
                  const statusInfo = getStatusInfo(table.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <motion.div
                      key={table._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-xl flex items-center justify-center`}>
                            <span className="text-white font-bold text-lg">M{table.number}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">Masa {table.number}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {table.capacity} kişilik
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Konum:
                          </span>
                          <span className="text-gray-900 font-medium">
                            {getLocationIcon(table.location)} {getLocationLabel(table.location)}
                          </span>
                        </div>
                        
                        {table.qrCode && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <QrCode className="w-4 h-4" />
                              QR Kod:
                            </span>
                            <span className="text-green-600 font-medium">✓ Mevcut</span>
                          </div>
                        )}

                        {table.notes && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
                            <strong>Not:</strong> {table.notes}
                          </div>
                        )}
                      </div>

                      {/* 🆕 SİPARİŞ OLUŞTUR BUTONU - En Üstte */}
                      {table.status === 'empty' && (
                        <button
                          onClick={() => openOrderModal(table)}
                          className="w-full mb-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all font-bold shadow-lg hover:shadow-xl"
                        >
                          <ShoppingCart className="w-5 h-5" />
                          Sipariş Oluştur
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEdit(table)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Düzenle
                        </button>
                        
                        {table.qrCode ? (
                          <div className="flex gap-1">
                            <Link
                              href={`/menu/${table.number}`}
                              target="_blank"
                              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-2 rounded-lg text-sm flex items-center justify-center"
                              title="Menüyü Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => printQRCode(table)}
                              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-2 rounded-lg text-sm flex items-center justify-center"
                              title="QR Kod Yazdır"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateQRCode(table)}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            QR
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(table._id, table.number)}
                        className="w-full mt-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Masa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kapasite</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Konum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">QR Kod</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTables.map((table, index) => {
                  const statusInfo = getStatusInfo(table.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <motion.tr
                      key={table._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${statusInfo.bgColor} rounded-lg flex items-center justify-center`}>
                            <span className="text-white font-bold">M{table.number}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Masa {table.number}</div>
                            {table.notes && (
                              <div className="text-xs text-gray-500 max-w-32 truncate">{table.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 w-fit ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-900">
                          <Users className="w-4 h-4 text-gray-500" />
                          {table.capacity} kişi
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-900">
                          <span>{getLocationIcon(table.location)}</span>
                          {getLocationLabel(table.location)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {table.qrCode ? (
                          <span className="text-green-600 font-medium text-sm">✓ Mevcut</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {/* 🆕 SİPARİŞ OLUŞTUR BUTONU - List View */}
                          {table.status === 'empty' && (
                            <button
                              onClick={() => openOrderModal(table)}
                              className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                              title="Sipariş Oluştur"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleEdit(table)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {table.qrCode ? (
                            <>
                              <Link
                                href={`/menu/${table.number}`}
                                target="_blank"
                                className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                                title="Menüyü Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => printQRCode(table)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                                title="QR Kod Yazdır"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => generateQRCode(table)}
                              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-2 rounded-lg transition-colors"
                              title="QR Kod Oluştur"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(table._id, table.number)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Table Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingTable ? 'Masa Düzenle' : 'Yeni Masa Ekle'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {editingTable ? 'Masa bilgilerini güncelleyin' : 'Yeni masa bilgilerini girin'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Masa Numarası *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        placeholder="Örn: M1, VIP2, A12..."
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        #
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kapasite *
                    </label>
                    <select
                      required
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20].map(num => (
                        <option key={num} value={num}>
                          {num} kişi {num === 1 ? '(Tek kişilik)' : num >= 10 ? '(Grup masası)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Konum
                    </label>
                    <div className="space-y-3">
                      <select
                        value={locationOptions.find(opt => opt.value === formData.location) ? formData.location : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            setFormData({...formData, location: e.target.value})
                          }
                        }}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                      >
                        {locationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                        <option value="custom">📍 Özel Konum Gir...</option>
                      </select>

                      {(!locationOptions.find(opt => opt.value === formData.location)) && (
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                          placeholder="Örn: Balkon, VIP Salon..."
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Özel Notlar
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    rows="4"
                    placeholder="Masa hakkında özel notlar..."
                  />
                </div>

                {editingTable && editingTable.qrCode && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800 mb-1">QR Kod Aktif</h4>
                        <p className="text-sm text-green-600 mb-4">
                          Bu masa için QR kod oluşturulmuş ve aktif.
                        </p>
                        <div className="flex gap-3">
                          <Link
                            href={`/menu/${editingTable.number}`}
                            target="_blank"
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Menüyü Önizle
                          </Link>
                          <button
                            type="button"
                            onClick={() => printQRCode(editingTable)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Printer className="w-4 h-4" />
                            QR Kod Yazdır
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingTable ? 'Güncelleniyor...' : 'Ekleniyor...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        {editingTable ? (
                          <>
                            <Edit className="w-4 h-4" />
                            Güncelle
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Masa Ekle
                          </>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🆕 CREATE ORDER MODAL */}
      <AnimatePresence>
        {showOrderModal && selectedTableForOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">Sipariş Oluştur</h2>
                      <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                        Masa {selectedTableForOrder.number} • {selectedTableForOrder.capacity} kişilik
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* SEARCH BAR */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={menuSearchTerm}
                      onChange={(e) => setMenuSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 outline-none transition-all"
                    />
                    {menuSearchTerm && (
                      <button
                        onClick={() => setMenuSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <XIcon className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CATEGORY FILTERS */}
                {categories.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-white text-green-600 shadow-lg'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Tümü
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id || cat._id}
                        onClick={() => setSelectedCategory(cat.id || cat._id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                          selectedCategory === (cat.id || cat._id)
                            ? 'bg-white text-green-600 shadow-lg'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* BODY - SPLIT LAYOUT */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {loadingMenu ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Menü yükleniyor...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* LEFT: PRODUCT GRID */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {menuItems
                          .filter(item => {
                            const matchesSearch = !menuSearchTerm || 
                              item.name.toLowerCase().includes(menuSearchTerm.toLowerCase())
                            const matchesCategory = selectedCategory === 'all' || 
                              item.categoryId === selectedCategory || 
                              item.subcategoryId === selectedCategory
                            return matchesSearch && matchesCategory
                          })
                          .map((item) => (
                            <motion.button
                              key={item._id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedProduct(item)}
                              className={`relative p-3 sm:p-4 rounded-xl border-2 transition-all text-left h-full ${
                                selectedProduct?._id === item._id
                                  ? 'border-green-500 bg-green-50 shadow-lg'
                                  : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-md'
                              }`}
                            >
                              {item.image ? (
                                <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={200}
                                    height={200}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-2">
                                  <Coffee className="w-8 h-8 text-amber-600" />
                                </div>
                              )}

                              <div>
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                                  {item.name}
                                </h3>
                                <p className="text-lg sm:text-xl font-bold text-green-600">
                                  ₺{item.price}
                                </p>
                              </div>

                              {selectedProduct?._id === item._id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                      </div>
                    </div>

                    {/* RIGHT: CART & SELECTED PRODUCT */}
                    <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 flex flex-col">
                      {selectedProduct ? (
                        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
                          {/* Product Summary */}
                          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                              {selectedProduct.image ? (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                  <Image
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center flex-shrink-0">
                                  <Coffee className="w-10 h-10 text-amber-600" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 mb-1">
                                  {selectedProduct.name}
                                </h3>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                  ₺{selectedProduct.price}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-3">Miktar</label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                className="w-16 h-16 rounded-xl bg-white border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center font-bold text-3xl shadow-sm active:scale-95"
                              >
                                -
                              </button>
                              <div className="flex-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={itemQuantity}
                                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-full text-center text-4xl font-bold text-gray-900 bg-white rounded-xl border-2 border-gray-300 py-4 outline-none focus:border-green-500 transition-colors"
                                />
                              </div>
                              <button
                                onClick={() => setItemQuantity(itemQuantity + 1)}
                                className="w-16 h-16 rounded-xl bg-white border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all flex items-center justify-center font-bold text-3xl shadow-sm active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Notes */}
                          <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              <MessageSquare className="w-4 h-4 inline mr-2" />
                              Not (Opsiyonel)
                            </label>
                            <textarea
                              value={itemNotes}
                              onChange={(e) => setItemNotes(e.target.value)}
                              placeholder="Örn: Az şekerli, soğuk..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 outline-none transition-colors resize-none text-sm"
                            />
                          </div>

                          <div className="flex-1"></div>

                          {/* Add to Cart Button */}
                          <button
                            onClick={addToCart}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            Sepete Ekle
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 text-center">
                          <div>
                            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <ShoppingCart className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Ürün Seçin</h3>
                            <p className="text-sm text-gray-600">
                              Soldan eklemek istediğiniz ürünü seçin
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* FOOTER - CART SUMMARY */}
              <div className="flex-shrink-0 border-t border-gray-200 bg-white">
                {orderItems.length > 0 && (
                  <div className="p-4 border-b border-gray-200 max-h-48 overflow-y-auto">
                    <h3 className="font-bold text-gray-900 mb-3">Sepet ({orderItems.length} ürün)</h3>
                    <div className="space-y-2">
                      {orderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.quantity}x {item.name}</div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 mt-1">Not: {item.notes}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-900">Toplam:</span>
                    <span className="text-3xl font-bold text-green-600">
                      ₺{orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={creatingOrder || orderItems.length === 0}
                      className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingOrder ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Oluşturuluyor...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Sipariş Oluştur ({orderItems.length})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}