import { NextResponse } from 'next/server'
import { getPrinterCollection, getDeviceCollection } from '@/lib/mongodb-printer'

// Verify API Key
async function verifyApiKey(apiKey) {
  if (!apiKey) return null
  
  const devicesCollection = await getDeviceCollection()
  const device = await devicesCollection.findOne({ apiKey })
  
  if (device) {
    // Update last seen
    await devicesCollection.updateOne(
      { _id: device._id },
      { 
        $set: { 
          lastSeen: new Date(),
          status: 'online'
        } 
      }
    )
  }
  
  return device
}

// GET - Get printer configuration
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    const device = await verifyApiKey(apiKey)
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const printersCollection = await getPrinterCollection()
    const config = await printersCollection.findOne({ 
      restaurantId: device.restaurantId 
    })

    if (!config) {
      // Return default empty config
      return NextResponse.json({
        success: true,
        config: {
          restaurantId: device.restaurantId,
          printers: [],
          globalSettings: {
            autoPrint: true,
            paperWidth: 58,
            encoding: 'UTF-8',
            cutPaper: true,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}

// PUT - Update printer configuration
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    const device = await verifyApiKey(apiKey)
    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { printers, globalSettings } = body

    const printersCollection = await getPrinterCollection()
    
    const updateData = {
      restaurantId: device.restaurantId,
      printers: printers || [],
      globalSettings: globalSettings || {
        autoPrint: true,
        paperWidth: 58,
        encoding: 'UTF-8',
        cutPaper: true,
      },
      updatedAt: new Date(),
    }

    await printersCollection.updateOne(
      { restaurantId: device.restaurantId },
      { $set: updateData },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    console.error('Update config error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}