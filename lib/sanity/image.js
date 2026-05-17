import imageUrlBuilder from '@sanity/image-url'
import { dataset, projectId } from './client'

const imageBuilder = imageUrlBuilder({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'c7bxnoyq',
  dataset: 'production',
})

export const urlForImage = (source) => {
  return imageBuilder.image(source)
}