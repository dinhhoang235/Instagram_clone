import api from "@/lib/api";
import { CommentType } from "@/types/comment";

// Lấy tất cả comment của một bài post
export const getCommentsByPostId = async (postId: string): Promise<CommentType[]> => {
  const res = await api.get<CommentType[]>(`/comments/?post_id=${postId}`);
  return res.data;
};

// Tạo comment mới cho một bài post
export const createComment = async (postId: string, text: string): Promise<CommentType> => {
  const res = await api.post<CommentType>(`/comments/`, {
    post: postId,
    text,
  });
  return res.data;
};

// Like hoặc Unlike một comment
export const toggleCommentLike = async (commentId: number): Promise<{ liked: boolean }> => {
  const res = await api.post<{ liked: boolean }>(`/comments/${commentId}/like/`);
  return res.data;
};
