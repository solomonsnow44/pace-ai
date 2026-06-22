import { isIP } from 'node:net'

export const CONTACT_PROFILE_IMAGE_BUCKET = 'profile-images'
export const CONTACT_PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

const SUPPORTED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
])

function compactString(value) {
  return String(value || '').trim()
}

function sanitizeStorageName(value = '') {
  return compactString(value)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image'
}

function extensionFromPath(pathname = '') {
  const extension = compactString(pathname.split('/').pop()).split('.').pop().toLowerCase()
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? (extension === 'jpeg' ? 'jpg' : extension) : ''
}

function isPrivateIp(hostname = '') {
  const version = isIP(hostname)
  if (!version) return false
  if (version === 6) {
    const host = hostname.toLowerCase()
    return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')
  }

  const [first, second] = hostname.split('.').map(part => Number.parseInt(part, 10))
  return first === 10
    || first === 127
    || first === 0
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 169 && second === 254)
}

export function assertSafeRemoteImageUrl(value) {
  const rawUrl = compactString(value)
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    const error = new Error('Image URL is not valid.')
    error.statusCode = 400
    throw error
  }

  if (parsed.protocol !== 'https:') {
    const error = new Error('Image URL must use HTTPS.')
    error.statusCode = 400
    throw error
  }

  const hostname = parsed.hostname.toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || isPrivateIp(hostname)) {
    const error = new Error('Image URL host is not allowed.')
    error.statusCode = 400
    throw error
  }

  return parsed
}

export async function ingestContactProfileImage(input = {}, options = {}) {
  const imageUrl = compactString(input.imageUrl)
  if (!imageUrl) {
    const error = new Error('Image URL is required.')
    error.statusCode = 400
    throw error
  }
  const organizationId = compactString(input.organizationId || options.organizationId)
  if (!organizationId) {
    const error = new Error('Workspace organization is required.')
    error.statusCode = 400
    throw error
  }
  const serviceClient = options.serviceClient
  if (!serviceClient?.storage) {
    const error = new Error('Supabase storage is not configured.')
    error.statusCode = 500
    throw error
  }

  const parsedUrl = assertSafeRemoteImageUrl(imageUrl)
  const fetcher = options.fetcher || fetch
  const response = await fetcher(parsedUrl.href, {
    headers: {
      accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9,*/*;q=0.5',
      'user-agent': 'PaceOps contact image importer',
    },
  })
  if (!response.ok) {
    const error = new Error(`Could not download contact image (${response.status}).`)
    error.statusCode = 400
    throw error
  }

  const contentType = compactString(response.headers.get('content-type')).split(';')[0].toLowerCase()
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    const error = new Error('Downloaded file is not a supported contact image.')
    error.statusCode = 400
    throw error
  }

  const contentLength = Number.parseInt(response.headers.get('content-length') || '0', 10)
  if (Number.isFinite(contentLength) && contentLength > CONTACT_PROFILE_IMAGE_MAX_BYTES) {
    const error = new Error('Contact image is larger than 5 MB.')
    error.statusCode = 400
    throw error
  }

  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.byteLength > CONTACT_PROFILE_IMAGE_MAX_BYTES) {
    const error = new Error('Contact image is larger than 5 MB.')
    error.statusCode = 400
    throw error
  }

  const contactKey = sanitizeStorageName(input.contactId || input.providerContactId || input.contactName || 'contact')
  const source = sanitizeStorageName(input.source || 'provider')
  const extension = SUPPORTED_IMAGE_TYPES.get(contentType) || extensionFromPath(parsedUrl.pathname) || 'jpg'
  const objectPath = `${organizationId}/contacts/${contactKey}/${Date.now()}-${source}.${extension}`
  const { error: uploadError } = await serviceClient.storage
    .from(CONTACT_PROFILE_IMAGE_BUCKET)
    .upload(objectPath, bytes, {
      cacheControl: '31536000',
      contentType,
      upsert: true,
    })

  if (uploadError) throw uploadError
  const { data } = serviceClient.storage.from(CONTACT_PROFILE_IMAGE_BUCKET).getPublicUrl(objectPath)
  return {
    profilePictureUrl: data?.publicUrl || '',
    profilePicturePath: objectPath,
    sourceImageUrl: imageUrl,
    contentType,
    byteLength: bytes.byteLength,
  }
}
