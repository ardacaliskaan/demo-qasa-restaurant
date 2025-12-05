'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Coffee, Plus, Minus, X, Flame, 
  Clock, Sparkles, MessageSquare
} from 'lucide-react'
import Image from 'next/image'
import toast, { Toaster } from 'react-hot-toast'
import MenuFooter from '@/components/MenuFooter'
import { apiPath } from '@/lib/api'

export default function SubcategoryProductsPage({ params }) {
  const [products, setProducts] = useState([])
  const [currentSubcategory, setCurrentSubcategory] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const [categorySlug, setCategorySlug] = useState(null)
  const [subcategorySlug, setSubcategorySlug] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  // Zorunlu Seçimler ve Özelleştirme (sadece görüntüleme için)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [customizations, setCustomizations] = useState({ removed: [], extras: [] })
  const [customerNotes, setCustomerNotes] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
      setCategorySlug(resolvedParams.categorySlug)
      setSubcategorySlug(resolvedParams.subcategorySlug)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId && categorySlug && subcategorySlug) {
      fetchData()
    }
  }, [tableId, categorySlug, subcategorySlug])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const categoriesRes = await fetch(apiPath('/api/admin/categories'))
      const categoriesData = await categoriesRes.json()
      
      const productsRes = await fetch(apiPath('/api/menu'))
      const productsData = await productsRes.json()
      
      if (categoriesData.success) {
        const allCategories = categoriesData.flatCategories || []
        
        const parentCat = allCategories.find(cat => cat.slug === categorySlug)
        setParentCategory(parentCat)
        
        const subCat = allCategories.find(cat => cat.slug === subcategorySlug)
        setCurrentSubcategory(subCat)
        
        if (subCat && productsData.success) {
          const subcategoryProducts = productsData.items?.filter(item => 
            item.subcategoryId === subCat.id && item.available !== false
          ) || []
          setProducts(subcategoryProducts)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
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

  // Fiyat hesaplama (sadece gösterim için)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-purple-300 border-t-purple-600 rounded-full mx-auto mb-6"
          />
          <motion.p className="text-teal-700 text-lg font-medium">
            Yükleniyor...
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
          background: '#10b981',
          color: '#ffffff',
          borderRadius: '12px',
          fontSize: '13px',
          padding: '10px 14px',
        },
      }}
    />
<div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-100 relative overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-teal-200 shadow-lg"
      >
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBackClick}
            className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-xl shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>
          
          <div className="text-center flex-1">
            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xl font-black text-teal-800"
            >
              {currentSubcategory?.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-teal-600 text-sm font-semibold mt-1"
            >
              Masa {tableId}
            </motion.p>
          </div>
          
          <div className="w-12"></div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black text-teal-800 mb-3 text-center">
            {parentCategory?.name} - {currentSubcategory?.name}
          </h2>
          <p className="text-teal-600 text-center mb-8">
            {products.length} ürün bulundu
          </p>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-8 bg-white rounded-3xl border border-teal-200 shadow-xl">
                <Coffee className="w-20 h-20 text-teal-300 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-teal-800 mb-3">Ürün Bulunamadı</h3>
                <p className="text-teal-600 text-lg">Bu kategoride henüz ürün eklenmemiş</p>
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
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-teal-100 to-cyan-100 overflow-hidden">
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
                          <Coffee className="w-16 h-16 text-teal-300" />
                        </div>
                      )}

                      {product.spicyLevel > 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {product.spicyLevel}
                        </div>
                      )}

                      {product.featured && (
                        <div className="absolute top-3 right-3 bg-qasa-accent text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Özel
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-teal-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-teal-600 text-sm line-clamp-2 mb-3">
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
                          <span className="text-xs bg-qasa-accent/20 text-amber-700 px-2 py-0.5 rounded-full font-medium">
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
                        <span className="text-2xl font-black text-teal-700">
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

      {/* Product Modal - SADECE GÖRÜNTÜLEME */}
      <AnimatePresence>
        {showProductModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={closeProductModal}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="relative aspect-video w-full overflow-hidden">
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
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-teal-300" />
                  </div>
                )}
                
                <button
                  onClick={closeProductModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <X className="w-6 h-6 text-teal-700" />
                </button>

                {selectedProduct.spicyLevel > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 shadow-lg">
                    <Flame className="w-4 h-4" />
                    Acılık: {selectedProduct.spicyLevel}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
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
                    <span className="text-sm bg-qasa-accent/20 text-amber-700 px-3 py-1 rounded-full font-semibold">
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
                  <h2 className="text-3xl font-black text-teal-900 mb-2">
                    {selectedProduct.name}
                  </h2>
                  {selectedProduct.description && (
                    <p className="text-teal-600 mb-4">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>

                {/* Zorunlu Seçimler - SADECE GÖRÜNTÜLEME */}
                {selectedProduct.requiredOptions?.map((optionGroup) => (
                  <div key={optionGroup.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-teal-900">
                        {optionGroup.label}
                      </h3>
                      {optionGroup.required && (
                        <span className="text-red-500 text-sm font-semibold">* Zorunlu</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {optionGroup.options.map((option) => (
                        <div
                          key={option.value}
                          className="p-3 rounded-lg border-2 border-teal-200 text-teal-700 bg-white shadow-sm"
                        >
                          <div className="text-sm">{option.label}</div>
                          {option.price > 0 && (
                            <div className="text-xs text-teal-600 mt-1">+₺{option.price.toFixed(2)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Çıkarılabilir Malzemeler - SADECE GÖRÜNTÜLEME */}
                {selectedProduct.customizations?.removable?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-teal-900">
                      Çıkarılabilir Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.removable.map((ing) => (
                        <div
                          key={ing._id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm">{ing.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ekstra Malzemeler - SADECE GÖRÜNTÜLEME */}
                {selectedProduct.customizations?.extras?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-teal-900">
                      Ekstra Malzemeler
                    </h3>
                    <div className="space-y-2">
                      {selectedProduct.customizations.extras.map((extra) => (
                        <div
                          key={extra.ingredientId}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
                        >
                          <span className="text-sm">{extra.name}</span>
                          <span className="text-sm font-semibold text-teal-700">
                            +₺{extra.price?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fiyat Gösterimi */}
                <div className="p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
                  <div className="text-sm text-teal-700 mb-1">Başlangıç Fiyatı</div>
                  <div className="text-3xl font-black text-teal-800">
                    ₺{selectedProduct.price?.toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MenuFooter />
</div>
  </>
  )
}