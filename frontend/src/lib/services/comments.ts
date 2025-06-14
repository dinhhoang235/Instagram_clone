import api from "@/lib/api";
import { CommentType, ReplyType } from "@/types/comment";

// Lấy tất cả comment của một bài post
export const getCommentsByPostId = async (postId: string): Promise<CommentType[]> => {
    const res = await api.get< {results: CommentType[] }>(`/comments/?post_id=${postId}`);
    return res.data.results;
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
export const likeComment = async (commentId: number): Promise<{ liked: boolean; likes: number }> => {
  const res = await api.post<{ liked: boolean; likes: number }>(`/comments/${commentId}/like/`);
  return res.data;
}

// commment reply
export const createReply = async (commentId: number, text: string): Promise<ReplyType> => {
    const res = await api.post<ReplyType>(`/comments/${commentId}/replies/`, { text });
    return res.data;
};
