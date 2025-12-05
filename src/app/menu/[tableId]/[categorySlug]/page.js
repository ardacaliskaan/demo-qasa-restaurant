'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Coffee, Thermometer, Snowflake, ChevronRight, Package, 
  Sparkles, Layers, Grid3x3, Plus, Minus, X, Flame, 
  Clock, AlertCircle, MessageSquare, ShoppingCart, Trash2, Send
} from 'lucide-react'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import MenuFooter from '@/components/MenuFooter'
import { SessionManager } from '@/lib/sessionManager'
import { apiPath } from '@/lib/api'

export default function SubcategoriesPage({ params }) {
  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [parentCategory, setParentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  // 🛒 Sepet state'leri
  const [cart, setCart] = useState([])
  const [showCartModal, setShowCartModal] = useState(false)
  
  // 🔐 Session state'leri
  const [session, setSession] = useState(null)
  const [sessionManager, setSessionManager] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // Zorunlu Seçimler ve Özelleştirme
  const [selectedOptions, setSelectedOptions] = useState({})
  const [customizations, setCustomizations] = useState({ removed: [], extras: [] })
  const [customerNotes, setCustomerNotes] = useState('')
  
  const router = useRouter()

  const subcategoryIcons = {
    'sicak': Thermometer,
    'sıcak': Thermometer,
    'sicak-icecekler': Thermometer,
    'sıcak-içecekler': Thermometer,
    'soguk': Snowflake,
    'soğuk': Snowflake,
    'soguk-icecekler': Snowflake,
    'soğuk-içecekler': Snowflake,
    'default': Package
  }

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
      fetchData()
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

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const categoriesRes = await fetch(apiPath('/api/admin/categories'))
      const categoriesData = await categoriesRes.json()
      
      const productsRes = await fetch(apiPath('/api/menu'))
      const productsData = await productsRes.json()
      
      if (categoriesData.success) {
        const allCategories = categoriesData.flatCategories || []
        
        const mainCategory = allCategories.find(cat => cat.slug === categorySlug)
        setParentCategory(mainCategory)
        
        if (mainCategory) {
          const subCats = allCategories.filter(cat => 
            cat.parentId === mainCategory.id && cat.isActive
          )
          setSubcategories(subCats)
          
          if (productsData.success) {
            const categoryProducts = productsData.items?.filter(item => 
              item.categoryId === mainCategory.id && item.available !== false
            ) || []
            setProducts(categoryProducts)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSubcategoryIcon = (subcategoryName) => {
    const slug = subcategoryName.toLowerCase().replace(/\s+/g, '-')
    const IconComponent = subcategoryIcons[slug] || subcategoryIcons.default
    return IconComponent
  }

  const handleSubcategoryClick = (subcategory) => {
    router.push(`/menu/${tableId}/${categorySlug}/${subcategory.slug}`)
  }

  const handleBackClick = () => {
    router.back()
  }

  const openProductModal = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setSelectedOptions({})
    setCustomizations({ removed: [], extras: [] })
    setCustomerNotes('')
    setShowProductModal(true)
  }

  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedProduct(null)
    setQuantity(1)
    setSelectedOptions({})
    setCustomizations({ removed: [], extras: [] })
    setCustomerNotes('')
  }

  // 🛒 Cart actions
  const openCartModal = () => setShowCartModal(true)
  const closeCartModal = () => setShowCartModal(false)

  const canAddToCart = () => {
    if (!selectedProduct?.requiredOptions) return true
    return selectedProduct.requiredOptions.every(optGroup => {
      return selectedOptions[optGroup.id] !== undefined
    })
  }

  const calculateItemPrice = () => {
    let basePrice = selectedProduct.price
    
    if (selectedProduct?.requiredOptions) {
      selectedProduct.requiredOptions.forEach(optGroup => {
        const selectedValue = selectedOptions[optGroup.id]
        if (selectedValue) {
          const option = optGroup.options.find(opt => opt.value === selectedValue)
          if (option && option.price) {
            basePrice += option.price
          }
        }
      })
    }
    
    customizations.extras.forEach(extra => {
      basePrice += extra.price || 0
    })
    
    return basePrice
  }

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      toast.error('Lütfen zorunlu seçimleri yapın!', { icon: '⚠️' })
      return
    }
    
    const itemPrice = calculateItemPrice()
    const formattedSelectedOptions = []
    
    if (selectedProduct?.requiredOptions) {
      selectedProduct.requiredOptions.forEach(optGroup => {
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
      id: `${selectedProduct.id}-${Date.now()}`,
      menuItemId: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      price: itemPrice,
      image: selectedProduct.image,
      quantity: quantity,
      selectedOptions: formattedSelectedOptions,
      customizations: customizations,
      notes: customerNotes
    }
    
    setCart([...cart, cartItem])
    toast.success(`${selectedProduct.name} sepete eklendi!`, { icon: '✅' })
    closeProductModal()
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
            className="w-20 h-20 border-4 border-qasa-accent/30 border-t-qasa-accent rounded-full mx-auto mb-6"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-700 text-lg font-medium"
          >
            {sessionLoading ? 'Bağlantı kuruluyor...' : 'Yükleniyor...'}
          </motion.p>
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
          fontSize: '14px',
          padding: '12px 16px',
        },
      }}
    />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 relative overflow-hidden pb-24">
      {/* 🎨 QASA Header - Premium */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-20 bg-gradient-to-r from-qasa via-qasa-light to-qasa backdrop-blur-xl border-b border-qasa-accent/20 shadow-xl"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackClick}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          
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
                {parentCategory?.name}
              </h1>
              <p className="text-xs text-white/70">
                Masa {tableId}
              </p>
            </div>
          </div>
          
          {/* 🛒 Cart Icon */}
          <button
            onClick={openCartModal}
            className="relative p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
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
      </motion.div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Subcategories */}
        {subcategories.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 mt-6"
            >
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
                {parentCategory?.name} Çeşitlerimiz
              </h2>
              <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-qasa-accent" />
                Kategori seçin veya tüm ürünlere göz atın
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
              <AnimatePresence mode="popLayout">
                {subcategories.map((subcategory, index) => {
                  const IconComponent = getSubcategoryIcon(subcategory.name)
                  
                  return (
                    <motion.div
                      key={subcategory.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handleSubcategoryClick(subcategory)}
                      className="group cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 h-44 border-2 border-gray-200 hover:border-qasa-accent">
                        {subcategory.image ? (
                          <div className="absolute inset-0">
                            <Image
                              src={subcategory.image}
                              alt={subcategory.name}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-gray-50/90 to-slate-50/85 group-hover:from-slate-50/90 group-hover:via-gray-50/85 group-hover:to-slate-50/80 transition-all duration-500" />
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200" />
                        )}

                        <div className="relative h-full flex flex-col justify-between p-5">
                          <div className="flex justify-between items-start">
                            <motion.div
                              whileHover={{ rotate: 360, scale: 1.15 }}
                              transition={{ duration: 0.6 }}
                              className="p-3 bg-gradient-to-br from-qasa-accent to-qasa-accent-light rounded-xl shadow-xl"
                            >
                              <IconComponent className="w-6 h-6 text-white" />
                            </motion.div>

                            <motion.div
                              whileHover={{ x: 5 }}
                              className="p-2 bg-white/80 backdrop-blur-sm rounded-full border border-qasa-accent/30"
                            >
                              <ChevronRight className="w-5 h-5 text-qasa-accent" />
                            </motion.div>
                          </div>

                          <div>
                            <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 drop-shadow-sm group-hover:text-qasa-accent transition-colors duration-300">
                              {subcategory.name}
                            </h3>
                            {subcategory.description && (
                              <p className="text-gray-700 text-sm font-medium leading-relaxed line-clamp-2">
                                {subcategory.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-6 py-2 rounded-full border-2 border-qasa-accent text-gray-900 font-bold flex items-center gap-2 shadow-sm">
                  <Grid3x3 className="w-5 h-5 text-qasa-accent" />
                  veya Tüm Ürünlere Göz Atın
                </span>
              </div>
            </div>
          </>
        )}

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 text-center">
            Tüm {parentCategory?.name}
          </h2>
          <p className="text-gray-600 text-center mb-8">
            {products.length} ürün bulundu
          </p>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-8 bg-white rounded-3xl border-2 border-gray-200 shadow-xl">
                <Coffee className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ürün Bulunamadı</h3>
                <p className="text-gray-600 text-lg">Bu kategoride henüz ürün eklenmemiş</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => openProductModal(product)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-qasa-accent">
                    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-gray-100 overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          priority={false}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Coffee className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {product.spicyLevel > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {product.spicyLevel}
                        </div>
                      )}

                      {product.featured && (
                        <div className="absolute top-3 right-3 bg-qasa-accent text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-3 h-3" />
                          Özel
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-qasa-accent transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.dietaryInfo?.isVegan && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🌱 Vegan
                          </span>
                        )}
                        {product.dietaryInfo?.isVegetarian && !product.dietaryInfo?.isVegan && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🥬 Vejetaryen
                          </span>
                        )}
                        {product.dietaryInfo?.isGlutenFree && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            🌾 Glutensiz
                          </span>
                        )}
                        {product.cookingTime && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {product.cookingTime}dk
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-qasa-accent">
                          ₺{product.price?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={closeProductModal}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-qasa to-qasa-light">
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover"
                    priority={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-white/50" />
                  </div>
                )}
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-gray-900" />
                </button>

                {selectedProduct.spicyLevel > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Flame className="w-4 h-4" />
                    Acılık: {selectedProduct.spicyLevel}
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-20rem)] p-6 space-y-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedProduct.dietaryInfo?.isVegan && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      🌱 Vegan
                    </span>
                  )}
                  {selectedProduct.dietaryInfo?.isVegetarian && !selectedProduct.dietaryInfo?.isVegan && (
                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      🥬 Vejetaryen
                    </span>
                  )}
                  {selectedProduct.dietaryInfo?.isGlutenFree && (
                    <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                      🌾 Glutensiz
                    </span>
                  )}
                  {selectedProduct.cookingTime && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedProduct.cookingTime} dakika
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.description && (
                    <p className="text-gray-600 mb-4">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Zorunlu Seçimler */}
                {selectedProduct.requiredOptions?.map((optionGroup) => (
                  <div key={optionGroup.id} className="space-y-3">
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

                {/* Çıkarılabilir Malzemeler */}
                {selectedProduct.customizations?.removable?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">
                      Çıkarılabilir Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.removable.map((ing) => (
                        <div
                          key={ing._id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">{ing.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ekstra Malzemeler */}
                {selectedProduct.customizations?.extras?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">
                      Ekstra Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.extras.map((extra) => (
                        <div
                          key={extra.ingredientId}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">{extra.name}</span>
                          <span className="text-sm font-semibold text-qasa-accent">
                            +₺{extra.price?.toFixed(2)}
                          </span>
                        </div>
                      ))}
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
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
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

              {/* Modal Footer */}
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

      <MenuFooter />
   </div>
  </>
  )
}