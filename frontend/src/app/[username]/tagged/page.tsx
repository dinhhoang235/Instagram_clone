import ProfileClient from "../ProfileClient"

interface PageProps {
  params: { username: string }
}

export default async function TaggedPage({ params }: PageProps) {
  const { username } = await params
  return <ProfileClient username={username} defaultTab="tagged" />
} 
