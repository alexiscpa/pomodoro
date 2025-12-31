# Icons Directory

This directory should contain the extension icons in PNG format.

## Required Icons

You need to create three icon files:

- `icon16.png` - 16x16 pixels (for browser toolbar)
- `icon48.png` - 48x48 pixels (for extensions page)
- `icon128.png` - 128x128 pixels (for Chrome Web Store)

## Creating Icons

You can use any image editor to create these icons. Here are some options:

### Option 1: Use an online icon generator
- Visit https://www.favicon-generator.org/
- Upload or create a design (recommend a tomato or timer icon for Pomodoro)
- Download the generated icons and rename them to the required sizes

### Option 2: Use Figma, Canva, or Photoshop
- Create a design with dimensions 128x128
- Export at different sizes (16x16, 48x48, 128x128)
- Save as PNG format

### Option 3: Use simple placeholder colors (temporary)
You can create simple colored squares as temporary placeholders:
- Use any image editor
- Create squares with the FocusFlow red color (#EF4444)
- Add a simple timer or "FF" text
- Export at the required sizes

## Design Recommendations

- Use the brand color: #EF4444 (red)
- Include a timer or tomato icon (classic Pomodoro symbol)
- Keep it simple and recognizable at small sizes
- Use a transparent or dark background

## Quick Temporary Solution

Until you create proper icons, you can use this Python script to generate basic placeholder icons:

```python
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), color=(15, 23, 42, 255))
    draw = ImageDraw.Draw(img)

    # Draw red circle
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], fill=(239, 68, 68, 255))

    # Draw white center
    center_margin = size // 3
    draw.ellipse([center_margin, center_margin, size-center_margin, size-center_margin],
                 fill=(241, 245, 249, 255))

    img.save(filename)

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
```

Or use this online tool: https://www.logomaker.com/
