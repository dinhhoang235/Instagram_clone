import api from "@/lib/api"

export interface RegisterPayload {
    username: string
    password: string
    confirm_password: string
    email?: string
    full_name?: string
}

export interface LoginPayload {
    username_or_email: string
    password: string
}

export interface TokenResponse {
    access: string
    refresh: string
}

export interface User {
    username: string
    email: string
    full_name?: string
    token?: TokenResponse
}

// Hàm đăng ký
export async function register(payload: RegisterPayload): Promise<User> {
    const res = await api.post<User>("/register/", payload, {
        withCredentials: false,
    })

    const user = res.data
    if (user.token) {
        localStorage.setItem("access_token", user.token.access)
        localStorage.setItem("refresh_token", user.token.refresh)
    }

    return user
}

// Hàm đăng nhập
export async function login(payload: LoginPayload): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>("/token/", payload)
    const token = res.data

    localStorage.setItem("access_token", token.access)
    localStorage.setItem("refresh_token", token.refresh)

    return token
}

// Lấy thông tin người dùng hiện tại
export async function getCurrentUser(): Promise<User> {
    const res = await api.get<User>("/users/me/")
    return res.data
}
