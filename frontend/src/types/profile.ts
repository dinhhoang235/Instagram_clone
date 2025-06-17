export type AllowOption = 'everyone' | 'followers' | 'no_one'
export type GenderOption = 'male' | 'female' | 'other'

export type ProfileType = {
    username: string
    email: string
    full_name: string
    bio: string
    website: string
    phone_number: string
    gender: GenderOption
    avatar: string
    is_verified: boolean
    is_private: boolean
    allow_tagging: boolean
    show_activity: boolean
    allow_story_resharing: boolean
    allow_comments: AllowOption
    allow_messages: AllowOption
    posts_count: number
    followers_count: number
    following_count: number
}
export type UpdateProfileInput = Partial<Omit<ProfileType, 'username' | 'email' | 'avatar'>> & {
    avatar?: File | string
}