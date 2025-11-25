// src/app/admin/orders/components/AddItemModal.js
'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, ShoppingCart, Plus, Minus, Star, Grid, List,
  Package, ChefHat, Filter, Trash2, Check
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { apiPath } from '@/lib/api'

export default function AddItemModal({
  show,
  selectedTable,
  onClose,
  onComplete
}) {
  // State
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  
  // Cart (Sepet)
  const [cart, setCart] = useState([])
  const [favorites, setFavorites] = useState([])

  // Load data
  useEffect(() => {
    if (show) {
      loadMenuItems()
      loadFavorites()
    }
  }, [show])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const [menuRes, catRes] = await Promise.all([
        fetch(apiPath('/api/admin/menu?available=true&limit=1000')),
        fetch(apiPath('/api/admin/categories?isActive=true'))
      ])
      
      const menuData = await menuRes.json()
      const catData = await catRes.json()
      
      if (menuData.success) {
        setMenuItems(menuData.items || [])
      }
      
      if (catData.success) {
        setCategories(catData.flatCategories || catData.categories || [])
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Menü yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('adminFavoriteItems')
      if (saved) {
        setFavorites(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Favorites load error:', error)
    }
  }

  const toggleFavorite = (itemId) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId]
    
    setFavorites(newFavorites)
    localStorage.setItem('adminFavoriteItems', JSON.stringify(newFavorites))
    toast.success(
      favorites.includes(itemId) ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi',
      { icon: '⭐', duration: 1000 }
    )
  }

  // Cart functions
  const addToCart = (item) => {
    const existingIndex = cart.findIndex(c => c.id === item._id || c.id === item.id)
    
    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      setCart(newCart)
    } else {
      setCart([...cart, {
        id: item._id || item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1
      }])
    }
    
    toast.success(`${item.name} sepete eklendi`, { icon: '✅', duration: 1000 })
  }

  const updateCartQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== itemId))
      toast.success('Sepetten çıkarıldı', { icon: '🗑️', duration: 1000 })
    } else {
      setCart(cart.map(c => c.id === itemId ? { ...c, quantity: newQty } : c))
    }
  }

  const clearCart = () => {
    if (confirm('Sepeti temizlemek istediğinizden emin misiniz?')) {
      setCart([])
      toast.success('Sepet temizlendi', { icon: '🗑️' })
    }
  }

  const handleAddItems = async () => {
  if (cart.length === 0) {
    toast.error('Sepet boş')
    return
  }

  try {
    setAdding(true)

    // ✅ TEK API ÇAĞRISI - TÜM ÜRÜNLER BİRDEN
    const response = await fetch(apiPath('/api/orders'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedTable.orders?.[0]?._id || selectedTable.orders?.[0]?.id,
        action: 'addMultipleItems', // 🆕 YENİ ACTION
        items: cart.map(cartItem => ({
          menuItemId: cartItem.id,
          name: cartItem.name,
          price: cartItem.price,
          quantity: cartItem.quantity,
          image: cartItem.image
        }))
      })
    })

    const result = await response.json()

    if (result.success) {
      toast.success(`${cart.length} ürün eklendi!`, {
        icon: '🎉',
        duration: 2000
      })

      setCart([])
      onComplete()
      onClose()
    } else {
      toast.error(result.error || 'Ürün ekleme hatası')
    }
  } catch (error) {
    console.error('Add items error:', error)
    toast.error('Ürün ekleme hatası')
  } finally {
    setAdding(false)
  }
}

  // Filter items
  const filteredItems = menuItems.filter(item => {
    // Arama filtresi
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      if (!item.name.toLowerCase().includes(search)) return false
    }
    
    // Kategori filtresi - ALT KATEGORİ DESTEĞİ
    if (selectedCategory !== 'all') {
      const itemCategoryId = (item.categoryId || item.category || item._categoryId || item.categoryID)?.toString()
      const selectedCategoryId = selectedCategory.toString()
      
      // Direkt eşleşme
      if (itemCategoryId === selectedCategoryId) {
        return true
      }
      
      // Alt kategori kontrolü
      // Seçilen kategorinin alt kategorilerini bul
      const selectedCat = categories.find(c => (c._id || c.id)?.toString() === selectedCategoryId)
      
      if (selectedCat) {
        // Ürünün kategorisini bul
        const itemCat = categories.find(c => (c._id || c.id)?.toString() === itemCategoryId)
        
        // Ürünün kategorisi, seçilen kategorinin child'ı mı?
        if (itemCat && itemCat.parentId) {
          const parentId = itemCat.parentId?.toString()
          
          // Parent ID eşleşmesi
          if (parentId === selectedCategoryId) {
            return true
          }
        }
      }
      
      // Eşleşme yoksa filtrele
      return false
    }
    
    // Favori filtresi
    if (showFavoritesOnly && !favorites.includes(item._id || item.id)) {
      return false
    }
    
    return true
  })

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Ürün Ekle</h2>
                  <p className="text-sm opacity-90 mt-1">
                    {selectedTable.tableName || `Masa ${selectedTable.tableNumber}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Cart Badge */}
                {cart.length > 0 && (
                  <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="font-bold">{cartItemCount}</span>
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50 outline-none"
                />
              </div>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-medium focus:bg-white/30 focus:border-white/50 outline-none"
              >
                <option value="all" className="text-gray-900">Tüm Kategoriler</option>
                {categories.map(cat => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id} className="text-gray-900">
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Favorites Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  showFavoritesOnly
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-yellow-900' : ''}`} />
                <span className="hidden sm:inline">Favoriler</span>
              </button>

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

          {/* Body */}
          <div className="flex-1 overflow-hidden flex">
            {/* Products (70%) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Yükleniyor...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Ürün bulunamadı</p>
                </div>
              ) : viewMode === 'list' ? (
                // LIST VIEW - CLICKABLE CARDS
                <div className="space-y-3">
                  {filteredItems.map(item => {
                    const isFavorite = favorites.includes(item._id || item.id)
                    const inCart = cart.find(c => c.id === (item._id || item.id))
                    
                    return (
                      <motion.div
                        key={item._id || item.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => !inCart && addToCart(item)}
                        className={`bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all overflow-hidden relative ${!inCart ? 'cursor-pointer' : ''}`}
                      >
                        {/* Favorite Star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(item._id || item.id)
                          }}
                          className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>

                        <div className="flex items-center gap-4 p-4">
                          {/* Image */}
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-10 h-10 text-gray-300" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>
                            )}
                            <div className="text-2xl font-bold text-blue-600">
                              ₺{item.price.toFixed(2)}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {inCart && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateCartQuantity(item._id || item.id, inCart.quantity - 1)}
                                  className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                                <div className="w-12 text-center">
                                  <div className="text-xl font-bold text-gray-900">{inCart.quantity}</div>
                                  <div className="text-xs text-gray-500">adet</div>
                                </div>
                                <button
                                  onClick={() => updateCartQuantity(item._id || item.id, inCart.quantity + 1)}
                                  className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                // GRID VIEW - CLICKABLE CARDS
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                  {filteredItems.map(item => {
                    const isFavorite = favorites.includes(item._id || item.id)
                    const inCart = cart.find(c => c.id === (item._id || item.id))
                    
                    return (
                      <motion.div
                        key={item._id || item.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => !inCart && addToCart(item)}
                        className={`bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all overflow-hidden relative group ${!inCart ? 'cursor-pointer' : ''}`}
                      >
                        {/* Favorite Star */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(item._id || item.id)
                          }}
                          className="absolute top-1.5 right-1.5 z-10 p-1 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>

                        {/* Image */}
                        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 14vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Info - KOMPAKT */}
                        <div className="p-2">
                          <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">{item.name}</h3>
                          <div className="text-lg font-bold text-blue-600 mb-2">
                            ₺{item.price.toFixed(2)}
                          </div>

                          {/* Quantity Controls - sadece sepetteyse göster */}
                          {inCart && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => updateCartQuantity(item._id || item.id, inCart.quantity - 1)}
                                className="flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <div className="px-2 py-1.5 bg-gray-100 rounded-lg font-bold text-gray-900 text-sm min-w-[32px] text-center">
                                {inCart.quantity}
                              </div>
                              <button
                                onClick={() => updateCartQuantity(item._id || item.id, inCart.quantity + 1)}
                                className="flex-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Cart Sidebar (30%) */}
            {cart.length > 0 && (
              <motion.div
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                className="w-80 border-l bg-gray-50 flex flex-col"
              >
                {/* Cart Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Sepet</h3>
                    <button
                      onClick={clearCart}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{cartItemCount} ürün</p>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-3 border-2 border-gray-200">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <Package className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600">₺{item.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-bold text-blue-600">
                          ₺{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Footer */}
                <div className="p-4 border-t bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-900">Toplam:</span>
                    <span className="text-2xl font-bold text-blue-600">₺{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleAddItems}
                    disabled={adding}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Ekleniyor...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Sepeti Onayla ({cart.length} ürün)
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}