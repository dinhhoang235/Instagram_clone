import api from "@/lib/api";
import { CommentType, ReplyType } from "@/types/comment";

interface CommentsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: CommentType[];
}

// Lấy tất cả comment của một bài post với pagination
export const getCommentsByPostId = async (postId: string, page: number = 1): Promise<CommentsResponse> => {
    const res = await api.get<CommentsResponse>(`/comments/?post_id=${postId}&page=${page}`);
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
export const likeComment = async (commentId: number): Promise<{ liked: boolean; likes: number }> => {
  const res = await api.post<{ liked: boolean; likes: number }>(`/comments/${commentId}/like/`);
  return res.data;
}

// commment reply
export const createReply = async (commentId: number, text: string): Promise<ReplyType> => {
    const res = await api.post<ReplyType>(`/comments/${commentId}/replies/`, { text });
    return res.data;
};
