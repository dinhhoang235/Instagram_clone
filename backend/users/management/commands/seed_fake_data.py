import io
import random
import requests
from faker import Faker
from PIL import Image, ImageDraw
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from users.models import Profile, Follow
from posts.models import Post, PostImage
from comments.models import Comment

User = get_user_model()
fake = Faker()

DEFAULT_PASSWORD = "password123"


def fetch_placeholder_image(seed, size=(800, 800)):
    """Fetch an image from picsum or generate a simple one with Pillow as fallback."""
    try:
        url = f"https://picsum.photos/seed/{seed}/{size[0]}/{size[1]}"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return ContentFile(resp.content, name=f"{seed}.jpg")
    except Exception:
        img = Image.new("RGB", size, (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)))
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), str(seed), fill=(255, 255, 255))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return ContentFile(buf.getvalue(), name=f"{seed}.jpg")


class Command(BaseCommand):
    help = "Seed fake users, profiles, posts, images, comments and follows."

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=20)
        parser.add_argument("--posts-per-user", type=int, default=3)
        parser.add_argument("--images-per-post", type=int, default=1)
        parser.add_argument("--comments-per-post", type=int, default=3)
        parser.add_argument("--max-days-ago", type=int, default=365, help="Max days in the past for post timestamps")
        parser.add_argument("--verified-chance", type=float, default=0.05, help="Probability (0-1) that a profile is verified")
        parser.add_argument("--private-chance", type=float, default=0.2, help="Probability (0-1) that a profile is private")
        parser.add_argument("--save-posts-chance", type=float, default=0.5, help="Probability (0-1) that a user will save posts")
        parser.add_argument("--max-saved-per-user", type=int, default=20, help="Max number of saved posts per user")
        parser.add_argument("--min-image-posts-per-user", type=int, default=1, help="Minimum number of posts per user that must have images")
        parser.add_argument("--image-chance", type=float, default=0.7, help="Probability (0-1) that a non-required post will have an image")
        parser.add_argument("--clear", action="store_true", help="Clear existing generated content first")

    def handle(self, *args, **options):
        users_count = options["users"]
        posts_per_user = options["posts_per_user"]
        images_per_post = options["images_per_post"]
        comments_per_post = options["comments_per_post"]
        max_days_ago = options.get("max_days_ago", 365)
        verified_chance = options.get("verified_chance", 0.05)
        private_chance = options.get("private_chance", 0.2)
        save_posts_chance = options.get("save_posts_chance", 0.5)
        max_saved_per_user = options.get("max_saved_per_user", 20)
        min_image_posts_per_user = options.get("min_image_posts_per_user", 1)
        image_chance = options.get("image_chance", 0.7)
        clear = options["clear"]

        if clear:
            self.stdout.write("Clearing Posts, PostImage, Comments, Follows...")
            PostImage.objects.all().delete()
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Follow.objects.all().delete()
            User.objects.filter(username__startswith="fake_").delete()

        self.stdout.write("Creating users...")
        users = []
        for i in range(users_count):
            username = f"fake_{fake.user_name()}{i}"
            email = f"{username}@example.com"
            user = User.objects.create_user(username=username, email=email, password=DEFAULT_PASSWORD)
            profile, _ = Profile.objects.get_or_create(user=user)
            profile.full_name = fake.name()
            # Randomize profile flags
            profile.is_verified = random.random() < verified_chance
            profile.is_private = random.random() < private_chance
            profile.allow_tagging = random.choice([True, False])
            profile.show_activity = random.choice([True, False])
            profile.allow_comments = random.choice(['everyone', 'followers', 'no_one'])
            avatar_file = fetch_placeholder_image(f"avatar_{username}", size=(300, 300))
            profile.avatar.save(avatar_file.name, avatar_file, save=True)
            profile.save()
            users.append(user)

        self.stdout.write("Creating follow relationships...")
        for user in users:
            others = users.copy()
            others.remove(user)
            to_follow = random.sample(others, k=random.randint(0, min(10, len(others))))
            for u in to_follow:
                Follow.objects.get_or_create(follower=user, following=u)

        self.stdout.write("Creating posts + images + comments + likes...")
        all_posts = []
        for user in users:
            # select indices that must have images to guarantee at least min_image_posts_per_user
            required_count = min(min_image_posts_per_user, posts_per_user)
            required_indices = set(random.sample(range(posts_per_user), k=required_count)) if required_count > 0 else set()

            for p in range(posts_per_user):
                caption = fake.sentence(nb_words=12) + " " + " ".join([f"#{fake.word()}" for _ in range(random.randint(0, 3))])
                post = Post.objects.create(user=user, caption=caption)
                # Randomize posted timestamp within max_days_ago
                posted_time = timezone.now() - timedelta(
                    days=random.randint(0, max_days_ago),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59),
                )
                post.posted = posted_time
                post.save(update_fields=['posted'])
                all_posts.append(post)

                # decide whether this post has image(s)
                has_image = (p in required_indices) or (random.random() < image_chance)

                if has_image:
                    if images_per_post == 1:
                        img = fetch_placeholder_image(f"post_{user.username}_{p}", size=(800, 800))
                        post.image.save(img.name, img, save=True)
                    else:
                        for idx in range(images_per_post):
                            img = fetch_placeholder_image(f"post_{user.username}_{p}_{idx}", size=(800, 800))
                            PostImage.objects.create(post=post, image=img, order=idx)

                likers = random.sample(users, k=random.randint(0, min(10, len(users))))
                for liker in likers:
                    post.likes.add(liker)

                for c in range(random.randint(0, comments_per_post)):
                    commenter = random.choice(users)
                    Comment.objects.create(post=post, user=commenter, text=fake.sentence())

        # Seed saved posts
        self.stdout.write("Seeding saved posts...")
        for user in users:
            if random.random() < save_posts_chance:
                candidate_posts = [p for p in all_posts if p.user != user]
                if not candidate_posts:
                    continue
                k = random.randint(1, min(max_saved_per_user, len(candidate_posts)))
                saved = random.sample(candidate_posts, k)
                profile = Profile.objects.get(user=user)
                for p in saved:
                    profile.saved_posts.add(p)

        self.stdout.write(self.style.SUCCESS("Seeding complete. Use password 'password123' for created users."))
