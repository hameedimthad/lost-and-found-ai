import os
import io
import json
from PIL import Image, ImageDraw, ImageFont
import numpy as np

from backend.database import init_db, create_report, get_reports, DB_PATH
from backend.ai_engine import extract_advanced_features

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "backend", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def generate_avatar(bg_color, text, subtext="", shape="person"):
    img = Image.new("RGB", (400, 400), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    if shape == "person":
        # Head
        draw.ellipse([(140, 70), (260, 190)], fill=(255, 218, 185))
        # Hair (short)
        draw.chord([(135, 60), (265, 170)], 180, 360, fill=(40, 30, 20))
        # Eyes
        draw.ellipse([(175, 120), (190, 135)], fill=(30, 30, 30))
        draw.ellipse([(210, 120), (225, 135)], fill=(30, 30, 30))
        # Smile
        draw.arc([(185, 140), (215, 165)], 0, 180, fill=(30, 30, 30), width=3)
        # Body / Clothes (Navy Blue hoodie)
        draw.polygon([(110, 230), (290, 230), (330, 400), (70, 400)], fill=(28, 54, 100))
        draw.polygon([(170, 220), (230, 220), (200, 270)], fill=(240, 240, 240))
        # Distinguishing mark: mole on right cheek
        draw.ellipse([(222, 145), (228, 151)], fill=(70, 40, 20))
    elif shape == "child":
        draw.ellipse([(150, 80), (250, 180)], fill=(255, 224, 189))
        draw.chord([(145, 75), (255, 160)], 180, 360, fill=(180, 100, 40))
        draw.ellipse([(175, 115), (188, 128)], fill=(40, 40, 40))
        draw.ellipse([(212, 115), (225, 128)], fill=(40, 40, 40))
        draw.polygon([(120, 220), (280, 220), (320, 400), (80, 400)], fill=(245, 190, 30))
        draw.rectangle([(90, 280), (310, 310)], fill=(34, 139, 34))
        draw.ellipse([(172, 95), (180, 103)], fill=(160, 80, 50))
    elif shape == "dog":
        draw.polygon([(110, 100), (140, 220), (180, 120)], fill=(190, 130, 50))
        draw.polygon([(290, 100), (260, 220), (220, 120)], fill=(190, 130, 50))
        draw.ellipse([(130, 100), (270, 250)], fill=(230, 175, 80))
        draw.ellipse([(160, 180), (240, 255)], fill=(245, 210, 130))
        draw.polygon([(190, 200), (210, 200), (200, 215)], fill=(20, 20, 20))
        draw.ellipse([(160, 145), (175, 160)], fill=(30, 20, 10))
        draw.ellipse([(225, 145), (240, 160)], fill=(30, 20, 10))
        draw.rectangle([(130, 260), (270, 290)], fill=(210, 30, 30))
        draw.ellipse([(190, 285), (210, 305)], fill=(255, 215, 0))
    elif shape == "cat":
        draw.polygon([(130, 140), (160, 60), (190, 130)], fill=(220, 220, 220))
        draw.polygon([(210, 130), (240, 60), (270, 140)], fill=(220, 220, 220))
        draw.polygon([(145, 130), (160, 80), (180, 125)], fill=(255, 182, 193))
        draw.polygon([(220, 125), (240, 80), (255, 130)], fill=(255, 182, 193))
        draw.ellipse([(140, 100), (260, 230)], fill=(240, 240, 240))
        draw.chord([(190, 100), (260, 200)], 270, 90, fill=(120, 120, 120))
        draw.ellipse([(165, 145), (185, 165)], fill=(50, 205, 50))
        draw.ellipse([(215, 145), (235, 165)], fill=(50, 205, 50))
        draw.polygon([(195, 175), (205, 175), (200, 185)], fill=(255, 105, 180))
        draw.rectangle([(150, 230), (250, 255)], fill=(30, 100, 220))
        draw.ellipse([(193, 250), (207, 265)], fill=(255, 215, 0))

    draw.rectangle([(0, 340), (400, 400)], fill=(0, 0, 0, 180))
    draw.text((20, 350), text, fill=(255, 255, 255))
    if subtext:
        draw.text((20, 372), subtext, fill=(200, 200, 200))
        
    return img

def seed():
    # Remove existing DB to upgrade to advanced feature representation
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("Reset existing database for advanced FaceNet embeddings.")

    init_db()
    print("Seeding demo Lost and Found reports with FaceNet VGGFace2 features...")

    # 1. Lost Person: Arjun Rao
    p1_img = generate_avatar((220, 235, 245), "Arjun Rao (Age 14)", "Last seen: Navy blue hoodie", "person")
    p1_path = "demo_lost_person_arjun.jpg"
    p1_img.save(os.path.join(UPLOADS_DIR, p1_path))
    feat1 = extract_advanced_features(p1_img)

    create_report(
        report_type="lost",
        category="person",
        name="Arjun Rao",
        age="14 years old",
        last_seen_dress="Navy blue hoodie, dark blue denim jeans, white sneakers",
        birth_mark="Small brown mole under right eye, slight scar on left chin",
        contact_number="+1 (555) 234-5678",
        location="Central Park West & 72nd St, New York",
        details="Was riding a silver bicycle near the park entrance around 4:30 PM. Please call immediately if seen.",
        image_paths=[p1_path],
        embeddings=[feat1]
    )

    # 2. Lost Child: Mia Chen
    p2_img = generate_avatar((255, 240, 220), "Mia Chen (Age 7)", "Last seen: Yellow striped T-shirt", "child")
    p2_path = "demo_lost_child_mia.jpg"
    p2_img.save(os.path.join(UPLOADS_DIR, p2_path))
    feat2 = extract_advanced_features(p2_img)

    create_report(
        report_type="lost",
        category="person",
        name="Mia Chen",
        age="7 years old",
        last_seen_dress="Yellow T-shirt with green stripes, blue shorts",
        birth_mark="Light birthmark on left side of forehead",
        contact_number="+1 (555) 432-8901",
        location="Metro Shopping Mall, Food Court Area",
        details="Got separated during shopping around 6:00 PM. Speaks English and Mandarin.",
        image_paths=[p2_path],
        embeddings=[feat2]
    )

    # 3. Lost Dog: Max (Golden Retriever)
    d1_img = generate_avatar((240, 245, 230), "Max (Golden Retriever)", "Red collar with gold tag", "dog")
    d1_path = "demo_lost_dog_max.jpg"
    d1_img.save(os.path.join(UPLOADS_DIR, d1_path))
    feat3 = extract_advanced_features(d1_img)

    create_report(
        report_type="lost",
        category="animal",
        name="Max",
        age="3 years old",
        last_seen_dress="Red nylon collar with gold circular tag",
        birth_mark="White patch on chest, dark amber eyes, golden honey fur",
        contact_number="+1 (555) 876-5432",
        location="Oakridge Community Park, North Gate",
        details="Very friendly and responds to 'Max'. Ran after a squirrel around 3 PM.",
        image_paths=[d1_path],
        embeddings=[feat3]
    )

    # 4. Lost Cat: Luna (Grey & White)
    c1_img = generate_avatar((240, 230, 245), "Luna (Domestic Shorthair)", "Blue collar with small bell", "cat")
    c1_path = "demo_lost_cat_luna.jpg"
    c1_img.save(os.path.join(UPLOADS_DIR, c1_path))
    feat4 = extract_advanced_features(c1_img)

    create_report(
        report_type="lost",
        category="animal",
        name="Luna",
        age="2 years old",
        last_seen_dress="Blue collar with a tiny gold bell",
        birth_mark="Grey patch over left ear and eye, bright green eyes",
        contact_number="+1 (555) 901-2345",
        location="Maplewood Avenue, near 5th cross",
        details="Indoor cat who slipped out through the back patio door in the evening.",
        image_paths=[c1_path],
        embeddings=[feat4]
    )

    print("Demo reports seeded with FaceNet VGGFace2 features successfully!")

if __name__ == "__main__":
    seed()
