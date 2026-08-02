from PIL import Image, ImageDraw

def make_logo_transparent():
    input_path = "public/logo.png"
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    center_x = width / 2.0
    center_y = height / 2.0
    
    # Radius of the outer dark navy ring
    # Let's find the exact radius of the outer emblem boundary
    max_radius = (min(width, height) / 2.0) - 4.0
    
    pix = img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pix[x, y]
            
            dx = x - center_x
            dy = y - center_y
            dist = (dx * dx + dy * dy) ** 0.5
            
            # If outside the outer emblem boundary, make 100% transparent
            if dist > max_radius:
                pix[x, y] = (r, g, b, 0)
            elif dist > max_radius - 12:
                # Anti-alias transition edge
                if r > 230 and g > 230 and b > 230:
                    pix[x, y] = (r, g, b, 0)
            elif r > 248 and g > 248 and b > 248 and dist > max_radius - 45:
                # White background padding right inside border
                pix[x, y] = (r, g, b, 0)

    img.save("public/logo.png", "PNG")
    img.save("public/logo.jpg", "PNG")
    print("Successfully converted public/logo.png to transparent background PNG!")

if __name__ == "__main__":
    make_logo_transparent()
