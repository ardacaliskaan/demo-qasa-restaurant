'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Plus, Minus, X, 
  Coffee, Clock, Flame, Star
} from 'lucide-react'
import Image from 'next/image'
import { Toaster } from 'react-hot-toast'
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
  
  const router = useRouter()

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
      setCategorySlug(resolvedParams.categorySlug)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId && categorySlug) {
      loadData()
    }
  }, [tableId, categorySlug])

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
    
    const basePrice = selectedItem.price || 0
    const extrasPrice = customizations.extras.reduce((sum, extra) => sum + extra.price, 0)
    
    return (basePrice + extrasPrice) * quantity
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-amber-600 mt-4 font-medium">
            Ürünler yükleniyor...
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
          background: '#10b981',
          color: '#ffffff',
          borderRadius: '12px',
          fontSize: '13px',
          padding: '10px 14px',
        },
      }}
    />

    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-amber-100 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-amber-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-amber-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-amber-700">
              {currentCategory?.name}
            </h1>
            <p className="text-sm text-amber-600">Masa {tableId}</p>
          </div>
          
          <div className="w-10"></div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Coffee className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-amber-600 mb-2">
              Bu kategoride henüz ürün yok
            </h3>
            <p className="text-amber-500">Lütfen başka bir kategori deneyin</p>
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
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group active:scale-95 overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Coffee className="w-16 h-16 text-amber-300" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-amber-800 text-lg leading-tight group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-right">
                      <span className="text-xl font-bold text-amber-600">
                        ₺{item.price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-amber-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Product Features */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {item.cookingTime && (
                        <div className="flex items-center text-amber-500">
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
                      <span className="text-amber-600 ml-1">4.8</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal - SADECE GÖRÜNTÜLEME */}
      <AnimatePresence>
        {showItemModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={closeItemModal}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                {selectedItem.image ? (
                  <div className="relative h-64">
                    <Image
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <Coffee className="w-20 h-20 text-amber-300" />
                  </div>
                )}
                
                <button
                  onClick={closeItemModal}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-16rem)]">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-amber-800">
                    {selectedItem.name}
                  </h2>
                  <span className="text-2xl font-bold text-amber-600">
                    ₺{selectedItem.price?.toFixed(2)}
                  </span>
                </div>

                {selectedItem.description && (
                  <p className="text-amber-600 mb-6">
                    {selectedItem.description}
                  </p>
                )}

                {/* Ingredients - SADECE GÖRÜNTÜLEME */}
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-amber-800 mb-3">Malzemeler</h3>
                    <div className="space-y-2">
                      {selectedItem.ingredients.map((ingredientId, index) => {
                        const ingredientName = getIngredientName(ingredientId)
                        
                        return (
                          <div key={`ingredient-${ingredientId}-${index}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <span className="text-amber-700">
                              {ingredientName}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Extras - SADECE GÖRÜNTÜLEME */}
                {ingredients.filter(ing => ing.extraPrice > 0).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-amber-800 mb-3">Ekstra Malzemeler (Opsiyonel)</h3>
                    <div className="space-y-2">
                      {ingredients.filter(ing => ing.extraPrice > 0).map(ingredient => (
                        <div key={ingredient.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                          <div>
                            <span className="text-amber-700">{ingredient.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-amber-600">
                            +₺{ingredient.extraPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutritional Info */}
                {selectedItem.nutritionInfo && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h3 className="font-semibold text-amber-800 mb-3">Besin Değerleri</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedItem.nutritionInfo.calories && (
                        <div>
                          <span className="text-amber-600">Kalori:</span>
                          <span className="font-semibold text-amber-800 ml-2">
                            {selectedItem.nutritionInfo.calories} kcal
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.protein && (
                        <div>
                          <span className="text-amber-600">Protein:</span>
                          <span className="font-semibold text-amber-800 ml-2">
                            {selectedItem.nutritionInfo.protein}g
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.carbs && (
                        <div>
                          <span className="text-amber-600">Karbonhidrat:</span>
                          <span className="font-semibold text-amber-800 ml-2">
                            {selectedItem.nutritionInfo.carbs}g
                          </span>
                        </div>
                      )}
                      {selectedItem.nutritionInfo.fat && (
                        <div>
                          <span className="text-amber-600">Yağ:</span>
                          <span className="font-semibold text-amber-800 ml-2">
                            {selectedItem.nutritionInfo.fat}g
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
)
}