'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff, Star } from 'lucide-react'
import Image from 'next/image'
import { apiPath } from '@/lib/api'

export default function AdminLogin() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!formData.username) newErrors.username = 'Kullanıcı adı gerekli'
    if (!formData.password) newErrors.password = 'Şifre gerekli'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const response = await fetch(apiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin')
      } else {
        setErrors({
          username: data.error || 'Giriş başarısız',
          password: ' '
        })
      }
    } catch (error) {
      setErrors({
        username: 'Bağlantı hatası',
        password: ' '
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#131925 1px, transparent 1px), linear-gradient(90deg, #131925 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
        }} />
      </div>

      {/* Gradient Orbs */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-qasa-accent/10 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-qasa/10 rounded-full blur-[120px]" 
      />

      {/* Stars Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            <Star className="w-2 h-2 text-qasa-accent fill-qasa-accent" />
          </motion.div>
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md z-10"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-qasa via-qasa-light to-qasa p-10 relative overflow-hidden">
            {/* Animated Pattern */}
            <motion.div
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />

            <div className="relative z-10 text-center">
              {/* Logo - ENHANCED VERSION */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6 flex justify-center"
              >
                <div className="relative">
                  {/* Outer Glow - Rotating */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-8 bg-gradient-to-r from-qasa-accent via-qasa-accent-light to-qasa-accent opacity-30 blur-3xl rounded-full"
                  />
                  
                  {/* Pulsing Glow */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute -inset-4 bg-qasa-accent/40 blur-2xl rounded-full"
                  />
                  
                  {/* White Container - Logo Background */}
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        '0 0 40px rgba(168, 85, 247, 0.4)',
                        '0 0 80px rgba(168, 85, 247, 0.6)',
                        '0 0 40px rgba(168, 85, 247, 0.4)'
                      ]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative bg-white/95 backdrop-blur-xl px-8 py-6 rounded-2xl border-2 border-white/50"
                  >
                    <Image
                      src="/qasa.png"
                      alt="QASA"
                      width={160}
                      height={48}
                      className="relative"
                      priority
                    />
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Hoş Geldiniz
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-white/80 text-sm font-light"
              >
                Admin Paneline Giriş
              </motion.p>
            </div>
          </div>

          {/* Form */}
          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className={`w-5 h-5 transition-colors ${
                      errors.username ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      errors.username
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-qasa-accent focus:ring-4 focus:ring-qasa-accent/10'
                    }`}
                    placeholder="admin"
                    disabled={loading}
                  />
                </div>
                {errors.username && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.username}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className={`w-5 h-5 transition-colors ${
                      errors.password ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-qasa-accent focus:ring-4 focus:ring-qasa-accent/10'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && errors.password !== ' ' && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-sm text-red-600 font-medium"
                  >
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="group relative w-full py-3.5 bg-gradient-to-r from-qasa via-qasa-accent to-qasa bg-size-200 bg-pos-0 hover:bg-pos-100 text-white rounded-xl font-semibold transition-all duration-500 shadow-lg hover:shadow-qasa-accent/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Giriş yapılıyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>

            {/* Demo Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-4 bg-qasa-accent/5 border border-qasa-accent/20 rounded-xl"
            >
              <p className="text-center text-sm text-gray-600">
                <span className="font-semibold text-qasa">Demo Giriş:</span>
                {' '}admin / admin123
              </p>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-10 pb-10 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 mb-2">
              © 2025 QASA. Tüm hakları saklıdır.
            </p>
            <a 
              href="https://ressolution.com.tr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-qasa-accent hover:text-qasa-accent-light transition-colors font-medium"
            >
R&apos;ES SOLUTION
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
