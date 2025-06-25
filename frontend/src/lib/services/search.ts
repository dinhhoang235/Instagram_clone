import api from '@/lib/api'
import type { SearchResponse } from "@/types/search"

export const searchAll = async (query: string): Promise<SearchResponse> => {
    const res = await api.get<SearchResponse>("/search/", {
        params: { q: query }
    })
    return res.data
}