#!/usr/bin/env python3
"""
Simple icon generator for FocusFlow Pomodoro
Requires: pip install Pillow

Usage: python generate_icons.py
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is not installed.")
    print("Please install it with: pip install Pillow")
    exit(1)

def create_pomodoro_icon(size, filename):
    """Create a simple Pomodoro-style icon"""
    # Create image with dark background
    img = Image.new('RGBA', (size, size), color=(15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # Draw red circle (tomato)
    margin = size // 6
    circle_bounds = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bounds, fill=(239, 68, 68, 255))

    # Draw highlight (to make it look more 3D)
    highlight_margin = margin + size // 12
    highlight_size = size // 4
    highlight_bounds = [
        highlight_margin,
        highlight_margin,
        highlight_margin + highlight_size,
        highlight_margin + highlight_size
    ]
    draw.ellipse(highlight_bounds, fill=(252, 165, 165, 180))

    # Draw stem (green leaf on top)
    if size >= 48:  # Only draw stem for larger icons
        stem_width = size // 8
        stem_height = size // 6
        stem_x = (size - stem_width) // 2
        stem_y = margin // 2
        draw.rectangle(
            [stem_x, stem_y, stem_x + stem_width, stem_y + stem_height],
            fill=(16, 185, 129, 255)
        )

    # Save the icon
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate all required icons"""
    print("Generating FocusFlow Pomodoro icons...")
    print("-" * 40)

    create_pomodoro_icon(16, 'icon16.png')
    create_pomodoro_icon(48, 'icon48.png')
    create_pomodoro_icon(128, 'icon128.png')

    print("-" * 40)
    print("✓ All icons generated successfully!")
    print("\nThe icons are ready to use with your extension.")

if __name__ == "__main__":
    main()
