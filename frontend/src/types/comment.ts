export interface CommentType {
    id: number;
    user: {
        username: string;
        avatar: string;
        isVerified: boolean;
    };
    text: string;
    likes: number;
    is_liked: boolean;
    timeAgo: string;
    replies: []
}