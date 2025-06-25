import api from "@/lib/api"
import type { TagType } from "@/types/tag"

export const getTrendingTags = async (): Promise<TagType[]> => {
  const res = await api.get<TagType[]>("/tags/trending/")
  return res.data
}