import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demo-qasa-restaurant'
const options = {}

let client
let clientPromise

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options)
  global._mongoClientPromise = client.connect()
}
clientPromise = global._mongoClientPromise

export default clientPromise

// Helper functions for printer collections
export async function getPrinterCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection('printer_configs')
}

export async function getDeviceCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection('printer_devices')
}

export async function getPrintLogCollection() {
  const client = await clientPromise
  const db = client.db()
  return db.collection('print_logs')
}