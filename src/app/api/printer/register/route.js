import { NextResponse } from 'next/server'
import { getDeviceCollection } from '@/lib/mongodb-printer'
import { randomBytes } from 'crypto'

// Generate API Key
function generateApiKey() {
  const prefix = process.env.NODE_ENV === 'production' ? 'ays_live' : 'ays_test'
  const randomPart = randomBytes(16).toString('hex')
  return `${prefix}_${randomPart}`
}

// POST - Register new printer device
export async function POST(request) {
  try {
    const body = await request.json()
    const { deviceName, restaurantId = 'demo-restaurant' } = body

    if (!deviceName) {
      return NextResponse.json(
        { success: false, error: 'Device name is required' },
        { status: 400 }
      )
    }

    const apiKey = generateApiKey()
    const devicesCollection = await getDeviceCollection()

    const device = {
      restaurantId,
      apiKey,
      deviceName,
      status: 'offline',
      ipAddress: null,
      lastSeen: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await devicesCollection.insertOne(device)

    return NextResponse.json({
      success: true,
      apiKey,
      deviceId: device._id,
      message: 'Device registered successfully',
    })
  } catch (error) {
    console.error('Register device error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    )
  }
}

// GET - List all devices
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get('restaurantId') || 'demo-restaurant'

    const devicesCollection = await getDeviceCollection()
    const devices = await devicesCollection
      .find({ restaurantId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      devices,
    })
  } catch (error) {
    console.error('Get devices error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch devices' },
      { status: 500 }
    )
  }
}