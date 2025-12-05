'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Coffee, Utensils, Cookie, Wine, Gift, ChevronRight, Sparkles, Clock } from 'lucide-react'
import Image from 'next/image'
import MenuFooter from '@/components/MenuFooter'
import { apiPath } from '@/lib/api'

export default function CategoriesPage({ params }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableId, setTableId] = useState(null)
  const router = useRouter()

  const categoryIcons = {
    'kahvaltı': Coffee,
    'kahvaltılık': Coffee,
    'ana-yemek': Utensils,
    'ana-yemekler': Utensils,
    'aperatif': Cookie,
    'aperatifler': Cookie,
    'tatlı': Cookie,
    'tatlılar': Cookie,
    'içecek': Wine,
    'içecekler': Wine,
    'kahve': Coffee,
    'kahveler': Coffee,
    'kampanya': Gift,
    'kampanyalar': Gift,
    'default': Utensils
  }

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params
      setTableId(resolvedParams.tableId)
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    if (tableId) {
      fetchCategories()
    }
  }, [tableId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(apiPath('/api/admin/categories'))
      const data = await response.json()
      
      if (data.success) {
        const mainCategories = data.flatCategories?.filter(cat => !cat.parentId && cat.isActive) || []
        setCategories(mainCategories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (categoryName) => {
    const slug = categoryName.toLowerCase().replace(/\s+/g, '-')
    const IconComponent = categoryIcons[slug] || categoryIcons.default
    return IconComponent
  }

  const handleCategoryClick = (category) => {
    router.push(`/menu/${tableId}/${category.slug}`)
  }

  const handleBackClick = () => {
    router.back()
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
            Menümüz hazırlanıyor...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
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
          
          {/* 🏷️ QASA Logo + Table Info */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <Image
              src="/qasa.png"
              alt="QASA"
              width={120}
              height={36}
              className="brightness-0 invert opacity-90"
              priority
            />
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 text-sm font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Masa {tableId}
            </motion.p>
          </div>
          
          <div className="w-12"></div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 mt-6"
        >
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Menümüzü Keşfedin
          </h2>
          <p className="text-gray-600 text-lg font-medium flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-qasa-accent" />
            Taze, lezzetli ve sizin için hazır
          </p>
        </motion.div>

        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block p-8 bg-white rounded-3xl border-2 border-gray-200 shadow-xl">
              <Coffee className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz Kategori Eklenmemiş</h3>
              <p className="text-gray-600 text-lg">Lütfen daha sonra tekrar deneyin</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            <AnimatePresence mode="popLayout">
              {categories.map((category, index) => {
                const IconComponent = getCategoryIcon(category.name)
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ y: -8, scale: 1.01 }}
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer"
                  >
                    <div className="relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 h-52 border-2 border-gray-200 hover:border-qasa-accent">
                      {category.image ? (
                        <div className="absolute inset-0">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            priority={index < 2}
                          />
                          {/* Premium Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-gray-50/90 to-slate-50/85 group-hover:from-slate-50/90 group-hover:via-gray-50/85 group-hover:to-slate-50/80 transition-all duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-br from-qasa-accent/10 via-transparent to-qasa-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200" />
                      )}

                      <div className="relative h-full flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                          {/* Icon */}
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                            className="p-3 bg-gradient-to-br from-qasa-accent to-qasa-accent-light rounded-2xl shadow-xl"
                          >
                            <IconComponent className="w-7 h-7 text-white" />
                          </motion.div>

                          {/* Badge */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="px-4 py-2 bg-qasa-accent/20 backdrop-blur-md rounded-full border border-qasa-accent/30"
                          >
                            <span className="text-qasa-accent font-bold text-sm">Yeni</span>
                          </motion.div>
                        </div>

                        {/* Category Info */}
                        <div>
                          <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 drop-shadow-sm group-hover:text-qasa-accent transition-colors duration-300">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-gray-700 text-base font-medium leading-relaxed">
                                  {category.description}
                                </p>
                              )}
                            </div>

                            {/* Arrow Button */}
                            <motion.div
                              whileHover={{ x: 8 }}
                              className="flex-shrink-0 p-3 bg-qasa-accent rounded-xl shadow-lg group-hover:shadow-qasa-accent/50 transition-all duration-300"
                            >
                              <ChevronRight className="w-6 h-6 text-white" />
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Shine Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <MenuFooter />
    </div>
  )
}