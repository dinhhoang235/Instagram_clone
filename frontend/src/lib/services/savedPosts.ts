import api from "@/lib/api"
import { PostType } from "@/types/post"

export const getSavedPosts = async (): Promise<PostType[]> => {
  const res = await api.get<{ results: PostType[] }>("/posts/saved/")
  return res.data.results
}
