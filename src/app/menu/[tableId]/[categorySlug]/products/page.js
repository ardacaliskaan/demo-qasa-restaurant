'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Plus, Minus, X, ShoppingCart, Trash2, Send,
  Coffee, Clock, Flame, Star, MessageSquare
} from 'lucide-react'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import { SessionManager } from '@/lib/sessionManager'
import { apiPath } from '@/lib/api'

export default function ProductsPage({ params }) {
  // States
  const [menuItems, setMenuItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [categories, setCategories] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [currentCategory, setCurrentCategory] = useState(null)
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [customizations, setCustomizations] = useState({
    removed: [],
    extras: []
  })
  const [quantity, setQuantity] = useState(1)
  const [itemNotes, setItemNotes] = useState('')
  
  // 🛒 Sepet state'leri
  const [cart, setCart] = useState([])
  const [showCartModal, setShowCartModal] = useState(false)
  
  // 🔐 Session state'leri
  const [session, setSession] = useState(null)
  const [sessionManager, setSessionManager] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // Zorunlu Seçimler
  const [selectedOptions, setSelectedOptions] = useState({})
  
  const router = useRouter()

  // 🛒 Cart key
  const getCartKey = () => `meva-cart-${tableId}`

  // 🛒 Load/Save cart
  useEffect(() => {
    if (tableId) {
      const savedCart = localStorage.getItem(getCartKey())
      if (savedCart) setCart(JSON.parse(savedCart))
    }
  }, [tableId])

  useEffect(() => {
    if (tableId && cart.length >= 0) {
      localStorage.setItem(getCartKey(), JSON.stringify(cart))
    }
  }, [cart, tableId])

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
      setCategorySlug(resolvedParams.categorySlug)
    }
    unwrapParams()
  }, [params])

  // 🔐 Session init
  useEffect(() => {
    if (tableId) initSession()
  }, [tableId])

  useEffect(() => {
    if (tableId && categorySlug) {
      loadData()
    }
  }, [tableId, categorySlug])

  // 🔐 Session Başlatma Fonksiyonu
  const initSession = async () => {
    try {
      setSessionLoading(true)
      const manager = new SessionManager(tableId)
      setSessionManager(manager)
      const result = await manager.initSession()
      if (result.success) {
        setSession(result.session)
      }
    } catch (error) {
      console.error('Session error:', error)
    } finally {
      setSessionLoading(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Paralel API çağrıları
      const [menuRes, categoriesRes, ingredientsRes] = await Promise.all([
        fetch(apiPath('/api/menu')),
        fetch(apiPath('/api/admin/categories')),
        fetch(apiPath('/api/admin/ingredients'))
      ])

      const [menuData, categoriesData, ingredientsData] = await Promise.all([
        menuRes.json(),
        categoriesRes.json(),
        ingredientsRes.json()
      ])

      if (menuData.success) {
        setMenuItems(menuData.items || [])
      }

      if (categoriesData.success) {
        const allCategories = categoriesData.flatCategories || []
        setCategories(allCategories)
        
        // Mevcut kategoriyi bul
        const category = allCategories.find(cat => cat.slug === categorySlug)
        setCurrentCategory(category)
        
        // Ürünleri filtrele
        if (category) {
          const filtered = (menuData.items || []).filter(item => 
            item.categoryId === category.id && item.available !== false
          )
          setFilteredItems(filtered)
        }
      }

      if (ingredientsData.success) {
        setIngredients(ingredientsData.ingredients || [])
      }

    } catch (error) {
      console.error('Veri yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const openItemModal = (item) => {
    setSelectedItem(item)
    setCustomizations({ removed: [], extras: [] })
    setQuantity(1)
    setItemNotes('')
    setSelectedOptions({})
    setShowItemModal(true)
  }

  const closeItemModal = () => {
    setShowItemModal(false)
    setSelectedItem(null)
  }

  const getIngredientName = (ingredientId) => {
    const ingredient = ingredients.find(ing => ing.id === ingredientId)
    return ingredient ? ingredient.name : ''
  }

  const calculateItemPrice = () => {
    if (!selectedItem) return 0
    
    let basePrice = selectedItem.price || 0
    
    // Zorunlu seçimler
    if (selectedItem?.requiredOptions) {
      selectedItem.requiredOptions.forEach(optGroup => {
        const selectedValue = selectedOptions[optGroup.id]
        if (selectedValue) {
          const option = optGroup.options.find(opt => opt.value === selectedValue)
          if (option && option.price) {
            basePrice += option.price
          }
        }
      })
    }
    
    const extrasPrice = customizations.extras.reduce((sum, extra) => sum + extra.price, 0)
    
    return basePrice + extrasPrice
  }

  // 🛒 Cart actions
  const openCartModal = () => setShowCartModal(true)
  const closeCartModal = () => setShowCartModal(false)

  const canAddToCart = () => {
    if (!selectedItem?.requiredOptions) return true
    return selectedItem.requiredOptions.every(optGroup => {
      return selectedOptions[optGroup.id] !== undefined
    })
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      toast.error('Lütfen zorunlu seçimleri yapın!', { icon: '⚠️' })
      return
    }
    
    const itemPrice = calculateItemPrice()
    const formattedSelectedOptions = []
    
    if (selectedItem?.requiredOptions) {
      selectedItem.requiredOptions.forEach(optGroup => {
        const selectedValue = selectedOptions[optGroup.id]
        if (selectedValue) {
          const option = optGroup.options.find(opt => opt.value === selectedValue)
          if (option) {
            formattedSelectedOptions.push({
              groupId: optGroup.id,
              groupLabel: optGroup.label,
              selectedValue: option.value,
              selectedLabel: option.label,
              price: option.price || 0
            })
          }
        }
      })
    }
    
    const cartItem = {
      id: `${selectedItem.id}-${Date.now()}`,
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      basePrice: selectedItem.price,
      price: itemPrice,
      image: selectedItem.image,
      quantity: quantity,
      selectedOptions: formattedSelectedOptions,
      customizations: customizations,
      notes: itemNotes
    }
    
    setCart([...cart, cartItem])
    toast.success(`${selectedItem.name} sepete eklendi!`, { icon: '✅' })
    closeItemModal()
  }

  const updateCartItemQuantity = (item, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(item)
      return
    }
    setCart(cart.map(cartItem => 
      cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
    ))
  }

  const removeFromCart = (item) => {
    setCart(cart.filter(cartItem => cartItem.id !== item.id))
    toast.success('Ürün sepetten kaldırıldı')
  }

  const clearCart = () => {
    setCart([])
    toast.success('Sepet temizlendi')
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Sepetiniz boş!')
      return
    }

    if (!session || !sessionManager) {
      toast.error('Oturum hatası! Lütfen sayfayı yenileyin.')
      return
    }

    try {
      const orderData = {
        sessionId: session.sessionId,
        deviceFingerprint: sessionManager.deviceInfo.fingerprint,
        tableNumber: tableId.toString(),
        tableId: tableId.toString(),
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          customizations: item.customizations,
          selectedOptions: item.selectedOptions,
          notes: item.notes
        })),
        totalAmount: getCartTotal(),
        customerNotes: cart.map(item => item.notes).filter(n => n).join(' | ')
      }

      const response = await fetch(apiPath('/api/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Siparişiniz alındı! 🎉', { duration: 4000, icon: '🎊' })
        clearCart()
        closeCartModal()
      } else {
        switch (data.code) {
          case 'INVALID_SESSION':
          case 'SESSION_EXPIRED':
            toast.error('Oturum süresi doldu!')
            localStorage.removeItem(`session_table_${tableId}`)
            setSession(null)
            break
          case 'DUPLICATE_SUSPECTED':
            const confirm = window.confirm(data.error)
            if (confirm) {
              orderData.confirmed = true
              const retryResponse = await fetch(apiPath('/api/orders'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
              })
              const retryData = await retryResponse.json()
              if (retryData.success) {
                toast.success('Siparişiniz alındı! 🎉')
                clearCart()
                closeCartModal()
              }
            }
            break
          default:
            toast.error(data.error || 'Sipariş gönderilemedi')
        }
      }
    } catch (error) {
      console.error('Order error:', error)
      toast.error('Bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-qasa-accent/30 border-t-qasa-accent rounded-full mx-auto"
          />
          <p className="text-gray-700 mt-4 font-medium">
            {sessionLoading ? 'Bağlantı kuruluyor...' : 'Ürünler yükleniyor...'}
          </p>
        </div>
      </div>
    )
  }

  return (
  <>
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 2500,
        style: {
          background: '#A855F7',
          color: '#ffffff',
          borderRadius: '12px',
          fontSize: '13px',
          padding: '10px 14px',
        },
      }}
    />

    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pb-24">
      {/* 🎨 QASA Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-qasa via-qasa-light to-qasa backdrop-blur-xl border-b border-qasa-accent/20 shadow-xl">
        <div className="flex items-center justify-between p-4">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          
          {/* 🏷️ QASA Logo + Category */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <Image
              src="/qasa.png"
              alt="QASA"
              width={100}
              height={30}
              className="brightness-0 invert opacity-90"
              priority
            />
            <div className="text-center">
              <h1 className="text-lg font-bold text-white">
                {currentCategory?.name}
              </h1>
              <p className="text-xs text-white/70">Masa {tableId}</p>
            </div>
          </div>
          
          {/* 🛒 Cart Icon */}
          <button
            onClick={openCartModal}
            className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-qasa-accent text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
              >
                {cart.length}
              </motion.span>
            )}
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bu kategoride henüz ürün yok
            </h3>
            <p className="text-gray-500">Lütfen başka bir kategori deneyin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => openItemModal(item)}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group active:scale-95 overflow-hidden border-2 border-gray-200 hover:border-qasa-accent"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 to-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Coffee className="w-16 h-16 text-gray-300" />
                    </div>
                  )}

                  {item.spicyLevel > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {item.spicyLevel}
                    </div>
                  )}

                  {item.featured && (
                    <div className="absolute top-3 right-3 bg-qasa-accent text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ Özel
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-qasa-accent transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-xl font-bold text-qasa-accent">
                        ₺{item.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Product Features */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {item.cookingTime && (
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{item.cookingTime}dk</span>
                        </div>
                      )}
                      {item.spicyLevel > 0 && (
                        <div className="flex items-center text-red-500">
                          <Flame className="w-3 h-3 mr-1" />
                          <span>Acı</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-gray-600 ml-1">4.8</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {showItemModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={closeItemModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                {selectedItem.image ? (
                  <div className="relative h-64 bg-gradient-to-br from-qasa to-qasa-light">
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-gray-300" />
                  </div>
                )}
                
                <button
                  onClick={closeItemModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-20rem)] space-y-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedItem.name}
                  </h2>
                  <span className="text-2xl font-bold text-qasa-accent">
                    ₺{selectedItem.price?.toFixed(2)}
                  </span>
                </div>

                {selectedItem.description && (
                  <p className="text-gray-600 mb-6">
                    {selectedItem.description}
                  </p>
                )}

                {/* Zorunlu Seçimler */}
                {selectedItem.requiredOptions?.map((optionGroup) => (
                  <div key={optionGroup.id} className="space-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">
                        {optionGroup.label}
                      </h3>
                      {optionGroup.required && (
                        <span className="text-red-500 text-sm font-semibold">* Zorunlu</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {optionGroup.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSelectedOptions({
                            ...selectedOptions,
                            [optionGroup.id]: option.value
                          })}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedOptions[optionGroup.id] === option.value
                              ? 'border-qasa-accent bg-qasa-accent/10 shadow-sm'
                              : 'border-gray-200 hover:border-qasa-accent/50'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-900">{option.label}</div>
                          {option.price > 0 && (
                            <div className="text-xs text-qasa-accent font-bold mt-1">+₺{option.price.toFixed(2)}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ingredients */}
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Malzemeler</h3>
                    <div className="space-y-2">
                      {selectedItem.ingredients.map((ingredientId, index) => {
                        const ingredientName = getIngredientName(ingredientId)
                        
                        return (
                          <div key={`ingredient-${ingredientId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700">
                              {ingredientName}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Extras */}
                {ingredients.filter(ing => ing.extraPrice > 0).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ekstra Malzemeler (Opsiyonel)</h3>
                    <div className="space-y-2">
                      {ingredients.filter(ing => ing.extraPrice > 0).map(ingredient => (
                        <div key={ingredient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-700">{ingredient.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-qasa-accent">
                            +₺{ingredient.extraPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutritional Info */}
                {selectedItem.nutritionInfo && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Besin Değerleri</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedItem.nutritionInfo.calories && (
                        <div>
                          <span className="text-gray-600">Kalori:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {selectedItem.nutritionInfo.calories} kcal
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.protein && (
                        <div>
                          <span className="text-gray-600">Protein:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {selectedItem.nutritionInfo.protein}g
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.carbs && (
                        <div>
                          <span className="text-gray-600">Karbonhidrat:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {selectedItem.nutritionInfo.carbs}g
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.fat && (
                        <div>
                          <span className="text-gray-600">Yağ:</span>
                          <span className="font-semibold text-gray-900 ml-2">
                            {selectedItem.nutritionInfo.fat}g
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Not Alanı */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Özel Notlar
                  </label>
                  <textarea
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Örn: Az şekerli olsun"
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-qasa-accent focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                {/* Miktar */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Miktar
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Sepete Ekle */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart()}
                  className="w-full py-4 bg-qasa-accent hover:bg-qasa-accent-light disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors shadow-lg flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-6 h-6" />
                  Sepete Ekle - ₺{(calculateItemPrice() * quantity).toFixed(2)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🛒 Cart Modal */}
      <AnimatePresence>
        {showCartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={closeCartModal}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Cart Header */}
              <div className="p-6 bg-gradient-to-r from-qasa to-qasa-light border-b border-qasa-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Sepetim</h2>
                      <p className="text-sm text-white/80">{cart.length} ürün</p>
                    </div>
                  </div>
                  <button
                    onClick={closeCartModal}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="overflow-y-auto max-h-[calc(85vh-16rem)] p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Sepetiniz boş</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex gap-4">
                          {item.image && (
                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900">{item.name}</h4>
                            <p className="text-sm text-qasa-accent font-bold mt-1">
                              ₺{item.price.toFixed(2)}
                            </p>
                            
                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.selectedOptions.map((opt, idx) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    ✓ {opt.selectedLabel}
                                    {opt.price > 0 && ` (+₺${opt.price.toFixed(2)})`}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-2">
                                💬 {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItemQuantity(item, item.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-gray-900 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartItemQuantity(item, item.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 space-y-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Toplam</span>
                    <span className="text-2xl font-bold text-qasa-accent">
                      ₺{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={clearCart}
                      className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-200"
                    >
                      <Trash2 className="w-5 h-5" />
                      Temizle
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      className="flex-[2] py-3 bg-qasa-accent hover:bg-qasa-accent-light text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Send className="w-5 h-5" />
                      Siparişi Gönder
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
)
}